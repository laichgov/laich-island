import { neon } from '@neondatabase/serverless'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type Citizen = {
  id: number; citizen_number: string; alias: string; title: string | null; reason: string | null; discord: string | null
  status: 'pending' | 'approved' | 'rejected'; is_admin: boolean; created_at: string
}
export const DEFAULT_OPTIONS = ['Yes', 'No', 'Abstain']
export type Ref = {
  id: number; title: string; description: string; author: string; closed: boolean; closes_at: string | null; open: boolean
  options: string[]; isDefault: boolean; tally: number[]; total: number; mine: number | null
}
export type Notice = { id: number; title: string; body: string; url: string | null; created_at: string; read: boolean }
export type Sub = { endpoint: string; p256dh: string; auth: string }
type Row = Citizen & { pw_hash: string | null }

const URL = process.env.DATABASE_URL
const sql = URL ? neon(URL) : null
const G = globalThis as any
const M = (G.__laich ??= { citizens: [] as Row[], sessions: new Map<string, number>(), refs: [] as any[], votes: [] as any[], ready: false })
M.notices ??= []; M.subs ??= []

const SEED_REFS: [string, string][] = [
  ['Referendum #01: First Off-Grid Solar Sensor Setup on Laich Island', 'Approve the first purchase of a small solar panel, battery and weather/telemetry sensor kit for the island, funded from Phase I surplus.'],
  ['Referendum #02: Official Citizen Discord & Assembly Schedule', 'Open an official citizen Discord and fix a recurring monthly Citizens\u2019 Assembly time that works across time zones.'],
]
const pub = ({ pw_hash, ...c }: Row): Citizen => c

export function hash(pw: string) { const s = randomBytes(16).toString('hex'); return s + ':' + scryptSync(pw, s, 32).toString('hex') }
export function check(pw: string, h: string | null) {
  if (!h) return false
  const [s, k] = h.split(':'); const d = scryptSync(pw, s, 32)
  return timingSafeEqual(d, Buffer.from(k, 'hex'))
}
const q = async (text: string, p: any[] = []) => (await sql!.query(text, p)) as any[]
const arr = (ids: number[]) => '{' + ids.map((n) => Math.trunc(Number(n))).filter((n) => Number.isFinite(n)).join(',') + '}'
const iso = (d: any) => (d ? new Date(d).toISOString() : null)

let inited: Promise<void> | null = null
export function init() {
  return (inited ??= (async () => {
    if (!sql) {
      if (M.ready) return; M.ready = true
      M.citizens.push({ id: 1, citizen_number: 'CLI-0001', alias: 'Founder & Managing Minister', title: 'Founder & Managing Minister', reason: null, discord: null, status: 'approved', is_admin: true, created_at: new Date().toISOString(), pw_hash: null })
      SEED_REFS.forEach(([t, d], i) => M.refs.push({ id: i + 1, title: t, description: d, author: 'Managing Minister', closed: false, closes_at: null, options: null }))
      return
    }
    await q(`CREATE TABLE IF NOT EXISTS citizens (id SERIAL PRIMARY KEY, citizen_number TEXT UNIQUE, alias TEXT NOT NULL, title TEXT, reason TEXT, pw_hash TEXT, status TEXT NOT NULL DEFAULT 'pending', is_admin BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    await q(`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, citizen_id INT NOT NULL)`)
    await q(`CREATE TABLE IF NOT EXISTS referendums (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, author TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    await q(`CREATE TABLE IF NOT EXISTS votes (referendum_id INT NOT NULL, citizen_id INT NOT NULL, choice TEXT NOT NULL, PRIMARY KEY (referendum_id, citizen_id))`)
    await q(`ALTER TABLE referendums ADD COLUMN IF NOT EXISTS closed BOOLEAN NOT NULL DEFAULT FALSE`)
    await q(`ALTER TABLE referendums ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ`)
    await q(`ALTER TABLE referendums ADD COLUMN IF NOT EXISTS options TEXT`)
    await q(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS discord TEXT`)
    await q(`CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, citizen_id INT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), read_at TIMESTAMPTZ)`)
    await q(`CREATE TABLE IF NOT EXISTS push_subs (id SERIAL PRIMARY KEY, citizen_id INT NOT NULL, endpoint TEXT UNIQUE NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    await q(`INSERT INTO citizens (citizen_number, alias, title, status, is_admin) SELECT 'CLI-0001','Founder & Managing Minister','Founder & Managing Minister','approved',TRUE WHERE NOT EXISTS (SELECT 1 FROM citizens WHERE citizen_number='CLI-0001')`)
    if (!(await q(`SELECT 1 FROM referendums LIMIT 1`)).length)
      for (const [t, d] of SEED_REFS) await q(`INSERT INTO referendums (title, description, author) VALUES ($1,$2,'Managing Minister')`, [t, d])
  })())
}

// ---------------- citizens ----------------
export async function register(alias: string, password: string, reason: string, discord: string | null = null): Promise<Citizen> {
  await init(); const pw = hash(password)
  if (!sql) {
    const f = M.citizens[0] as Row
    if (!f.pw_hash) { Object.assign(f, { alias, pw_hash: pw }); return pub(f) }
    const id = M.citizens.length + 1
    const c: Row = { id, citizen_number: 'CLI-' + String(id).padStart(4, '0'), alias, title: null, reason, discord, status: 'pending', is_admin: false, created_at: new Date().toISOString(), pw_hash: pw }
    M.citizens.push(c); return pub(c)
  }
  const claimed = await q(`UPDATE citizens SET alias=$1, pw_hash=$2 WHERE citizen_number='CLI-0001' AND pw_hash IS NULL RETURNING *`, [alias, pw])
  if (claimed.length) return claimed[0]
  const r = await q(`INSERT INTO citizens (alias, reason, pw_hash, discord) VALUES ($1,$2,$3,$4) RETURNING id`, [alias, reason, pw, discord])
  const u = await q(`UPDATE citizens SET citizen_number='CLI-'||lpad(id::text,4,'0') WHERE id=$1 RETURNING *`, [r[0].id])
  return u[0]
}
export async function aliasTaken(alias: string) {
  await init()
  if (!sql) return M.citizens.some((c: Row) => c.pw_hash && c.alias.toLowerCase() === alias.toLowerCase())
  return (await q(`SELECT 1 FROM citizens WHERE lower(alias)=lower($1) AND pw_hash IS NOT NULL`, [alias])).length > 0
}
export async function login(alias: string, password: string): Promise<Citizen | null> {
  await init()
  const r: Row | undefined = sql ? (await q(`SELECT * FROM citizens WHERE lower(alias)=lower($1)`, [alias]))[0] : M.citizens.find((c: Row) => c.alias.toLowerCase() === alias.toLowerCase())
  return r && check(password, r.pw_hash) ? pub(r) : null
}
export async function newSession(id: number) {
  const t = randomBytes(24).toString('hex')
  if (sql) await q(`INSERT INTO sessions VALUES ($1,$2)`, [t, id]); else M.sessions.set(t, id)
  return t
}
export async function sessionUser(t: string): Promise<Citizen | null> {
  await init()
  if (!sql) { const c = M.citizens.find((c: Row) => c.id === M.sessions.get(t)); return c ? pub(c) : null }
  const r = await q(`SELECT c.* FROM sessions s JOIN citizens c ON c.id=s.citizen_id WHERE s.token=$1`, [t])
  return r[0] ? pub(r[0]) : null
}
export async function dropSession(t: string) { if (sql) await q(`DELETE FROM sessions WHERE token=$1`, [t]); else M.sessions.delete(t) }
export async function getCitizen(id: number): Promise<Citizen | null> {
  await init()
  if (!sql) { const c = M.citizens.find((c: Row) => c.id === id); return c ? pub(c) : null }
  const r = await q(`SELECT id,citizen_number,alias,title,reason,discord,status,is_admin,created_at FROM citizens WHERE id=$1`, [id]); return r[0] ?? null
}
export async function publicCitizens(): Promise<Citizen[]> {
  await init()
  if (!sql) return M.citizens.filter((c: Row) => c.status === 'approved').map(pub).reverse().slice(0, 50)
  return (await q(`SELECT id,citizen_number,alias,title,status,is_admin,created_at FROM citizens WHERE status='approved' ORDER BY id DESC LIMIT 50`)) as Citizen[]
}
export async function pendingCitizens(): Promise<Citizen[]> {
  await init()
  if (!sql) return M.citizens.filter((c: Row) => c.status === 'pending').map(pub)
  return (await q(`SELECT id,citizen_number,alias,title,reason,discord,status,is_admin,created_at FROM citizens WHERE status='pending' ORDER BY id`)) as Citizen[]
}
export async function setStatus(id: number, status: 'approved' | 'rejected') {
  await init()
  if (sql) await q(`UPDATE citizens SET status=$1 WHERE id=$2 AND is_admin=FALSE`, [status, id])
  else { const c = M.citizens.find((c: Row) => c.id === id && !c.is_admin); if (c) c.status = status }
}
export async function stats() {
  await init()
  const OPEN = `NOT closed AND (closes_at IS NULL OR closes_at > now())`
  if (!sql) return { citizens: M.citizens.filter((c: Row) => c.status === 'approved').length, referendums: M.refs.filter(isOpen).length }
  const [a] = await q(`SELECT count(*)::int n FROM citizens WHERE status='approved'`); const [b] = await q(`SELECT count(*)::int n FROM referendums WHERE ${OPEN}`)
  return { citizens: a.n as number, referendums: b.n as number }
}

// ---------------- referendums (custom answer options) ----------------
const isOpen = (r: any) => !r.closed && !(r.closes_at && new Date(r.closes_at) < new Date())
const LEGACY: Record<string, number> = { yes: 0, no: 1, abstain: 2 }
const toIdx = (c: string) => (c in LEGACY ? LEGACY[c] : parseInt(c, 10))
function shape(r: any, open: boolean, counts: Record<string, number>, mine: string | null): Ref {
  const custom: string[] | null = r.options ? (typeof r.options === 'string' ? JSON.parse(r.options) : r.options) : null
  const options = custom ?? DEFAULT_OPTIONS; const tally = options.map(() => 0)
  for (const [c, n] of Object.entries(counts)) { const i = toIdx(c); if (i >= 0 && i < tally.length) tally[i] += n }
  const mi = mine == null ? null : toIdx(mine)
  return { id: r.id, title: r.title, description: r.description, author: r.author, closed: !!r.closed, closes_at: iso(r.closes_at), open, options, isDefault: !custom, tally, total: tally.reduce((a, b) => a + b, 0), mine: mi != null && mi >= 0 && mi < options.length ? mi : null }
}
export async function listRefs(uid?: number): Promise<Ref[]> {
  await init()
  if (!sql) {
    return M.refs.map((r: any) => {
      const counts: Record<string, number> = {}; let mine: string | null = null
      for (const v of M.votes) if (v.rid === r.id) { counts[v.choice] = (counts[v.choice] ?? 0) + 1; if (v.cid === uid) mine = v.choice }
      return shape(r, isOpen(r), counts, mine)
    }).sort((a: Ref, b: Ref) => Number(b.open) - Number(a.open) || b.id - a.id)
  }
  const refs = await q(`SELECT id,title,description,author,closed,closes_at,options,(NOT closed AND (closes_at IS NULL OR closes_at > now())) AS open FROM referendums ORDER BY open DESC, id DESC`)
  const vs = await q(`SELECT referendum_id, choice, count(*)::int n FROM votes GROUP BY referendum_id, choice`)
  const mineRows = uid ? await q(`SELECT referendum_id, choice FROM votes WHERE citizen_id=$1`, [uid]) : []
  return refs.map((r: any) => {
    const counts: Record<string, number> = {}; for (const v of vs) if (v.referendum_id === r.id) counts[v.choice] = v.n
    return shape(r, !!r.open, counts, mineRows.find((m: any) => m.referendum_id === r.id)?.choice ?? null)
  })
}
export async function vote(rid: number, cid: number, index: number): Promise<'ok' | 'closed' | 'invalid'> {
  await init()
  if (!sql) {
    const r = M.refs.find((x: any) => x.id === rid); if (!r) return 'invalid'
    if (!isOpen(r)) return 'closed'
    if (!(index >= 0 && index < (r.options ?? DEFAULT_OPTIONS).length)) return 'invalid'
    const v = M.votes.find((x: any) => x.rid === rid && x.cid === cid); if (v) v.choice = String(index); else M.votes.push({ rid, cid, choice: String(index) }); return 'ok'
  }
  const [r] = await q(`SELECT options,(NOT closed AND (closes_at IS NULL OR closes_at > now())) AS open FROM referendums WHERE id=$1`, [rid])
  if (!r) return 'invalid'; if (!r.open) return 'closed'
  const n = (r.options ? JSON.parse(r.options) : DEFAULT_OPTIONS).length
  if (!(index >= 0 && index < n)) return 'invalid'
  await q(`INSERT INTO votes (referendum_id, citizen_id, choice) VALUES ($1,$2,$3) ON CONFLICT (referendum_id, citizen_id) DO UPDATE SET choice=EXCLUDED.choice`, [rid, cid, String(index)])
  return 'ok'
}
export async function addRef(title: string, description: string, author: string, days?: number, options?: string[] | null) {
  await init()
  const closes = days ? new Date(Date.now() + days * 864e5).toISOString() : null; const opts = options?.length ? JSON.stringify(options) : null
  if (!sql) M.refs.push({ id: M.refs.length + 1, title, description, author, closed: false, closes_at: closes, options: opts })
  else await q(`INSERT INTO referendums (title, description, author, closes_at, options) VALUES ($1,$2,$3,$4,$5)`, [title, description, author, closes, opts])
}
export async function closeRef(id: number) {
  await init()
  if (!sql) { const r = M.refs.find((x: any) => x.id === id); if (r) r.closed = true } else await q(`UPDATE referendums SET closed=TRUE WHERE id=$1`, [id])
}

// ---------------- notifications + push subscriptions ----------------
export async function audience(kind: 'all' | 'approved' | 'pending' | 'rejected' | 'one', number?: string): Promise<number[]> {
  await init()
  if (!sql) {
    const rows = M.citizens.filter((c: Row) => c.pw_hash)
    if (kind === 'one') return rows.filter((c: Row) => c.citizen_number === (number ?? '').toUpperCase()).map((c: Row) => c.id)
    return rows.filter((c: Row) => kind === 'all' || c.status === kind).map((c: Row) => c.id)
  }
  if (kind === 'one') return (await q(`SELECT id FROM citizens WHERE citizen_number=$1 AND pw_hash IS NOT NULL`, [(number ?? '').toUpperCase()])).map((r) => r.id)
  if (kind === 'all') return (await q(`SELECT id FROM citizens WHERE pw_hash IS NOT NULL`)).map((r) => r.id)
  return (await q(`SELECT id FROM citizens WHERE status=$1 AND pw_hash IS NOT NULL`, [kind])).map((r) => r.id)
}
export async function addNotices(ids: number[], n: { title: string; body: string; url?: string | null }) {
  await init()
  if (!ids.length) return
  if (!sql) { for (const id of ids) M.notices.push({ id: M.notices.length + 1, citizen_id: id, title: n.title, body: n.body, url: n.url ?? null, created_at: new Date().toISOString(), read: false }); return }
  await q(`INSERT INTO notifications (citizen_id,title,body,url) SELECT unnest($1::int[]),$2,$3,$4`, [arr(ids), n.title, n.body, n.url ?? null])
}
export async function listNotices(cid: number): Promise<Notice[]> {
  await init()
  if (!sql) return M.notices.filter((x: any) => x.citizen_id === cid).map(({ citizen_id, ...r }: any) => r).reverse().slice(0, 30)
  return (await q(`SELECT id,title,body,url,created_at,(read_at IS NOT NULL) AS read FROM notifications WHERE citizen_id=$1 ORDER BY id DESC LIMIT 30`, [cid])).map((r) => ({ ...r, created_at: iso(r.created_at)! }))
}
export async function markRead(cid: number, id?: number) {
  await init()
  if (!sql) { for (const x of M.notices) if (x.citizen_id === cid && (id == null || x.id === id)) x.read = true; return }
  if (id != null) await q(`UPDATE notifications SET read_at=now() WHERE citizen_id=$1 AND id=$2 AND read_at IS NULL`, [cid, id])
  else await q(`UPDATE notifications SET read_at=now() WHERE citizen_id=$1 AND read_at IS NULL`, [cid])
}
export async function saveSub(cid: number, s: Sub) {
  await init()
  if (!sql) { M.subs = M.subs.filter((x: any) => x.endpoint !== s.endpoint); M.subs.push({ citizen_id: cid, ...s }); return }
  await q(`INSERT INTO push_subs (citizen_id,endpoint,p256dh,auth) VALUES ($1,$2,$3,$4) ON CONFLICT (endpoint) DO UPDATE SET citizen_id=EXCLUDED.citizen_id, p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth`, [cid, s.endpoint, s.p256dh, s.auth])
}
export async function dropSub(endpoint: string) {
  await init(); if (!sql) M.subs = M.subs.filter((x: any) => x.endpoint !== endpoint); else await q(`DELETE FROM push_subs WHERE endpoint=$1`, [endpoint])
}
export async function subsFor(ids: number[]): Promise<Sub[]> {
  await init()
  if (!sql) return M.subs.filter((x: any) => ids.includes(x.citizen_id)).map(({ citizen_id, ...s }: any) => s)
  return (await q(`SELECT endpoint,p256dh,auth FROM push_subs WHERE citizen_id = ANY($1::int[])`, [arr(ids)])) as Sub[]
}
