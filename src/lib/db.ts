import { neon } from '@neondatabase/serverless'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type Citizen = {
  id: number; citizen_number: string; alias: string; title: string | null; reason: string | null
  status: 'pending' | 'approved' | 'rejected'; is_admin: boolean; created_at: string
}
export type Ref = { id: number; title: string; description: string; author: string; closed: boolean; closes_at: string | null; open: boolean; yes: number; no: number; abstain: number; mine: string | null }
type Row = Citizen & { pw_hash: string | null }

const URL = process.env.DATABASE_URL
const sql = URL ? neon(URL) : null
const G = globalThis as any
const M = (G.__laich ??= { citizens: [] as Row[], sessions: new Map<string, number>(), refs: [] as any[], votes: [] as any[], ready: false })

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

let inited: Promise<void> | null = null
export function init() {
  return (inited ??= (async () => {
    if (!sql) {
      if (M.ready) return; M.ready = true
      M.citizens.push({ id: 1, citizen_number: 'CLI-0001', alias: 'Founder & Managing Minister', title: 'Founder & Managing Minister', reason: null, status: 'approved', is_admin: true, created_at: new Date().toISOString(), pw_hash: null })
      SEED_REFS.forEach(([t, d], i) => M.refs.push({ id: i + 1, title: t, description: d, author: 'Managing Minister', closed: false, closes_at: null }))
      return
    }
    await q(`CREATE TABLE IF NOT EXISTS citizens (id SERIAL PRIMARY KEY, citizen_number TEXT UNIQUE, alias TEXT NOT NULL, title TEXT, reason TEXT, pw_hash TEXT, status TEXT NOT NULL DEFAULT 'pending', is_admin BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    await q(`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, citizen_id INT NOT NULL)`)
    await q(`CREATE TABLE IF NOT EXISTS referendums (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, author TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    await q(`CREATE TABLE IF NOT EXISTS votes (referendum_id INT NOT NULL, citizen_id INT NOT NULL, choice TEXT NOT NULL, PRIMARY KEY (referendum_id, citizen_id))`)
    await q(`ALTER TABLE referendums ADD COLUMN IF NOT EXISTS closed BOOLEAN NOT NULL DEFAULT FALSE`)
    await q(`ALTER TABLE referendums ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ`)
    await q(`INSERT INTO citizens (citizen_number, alias, title, status, is_admin) SELECT 'CLI-0001','Founder & Managing Minister','Founder & Managing Minister','approved',TRUE WHERE NOT EXISTS (SELECT 1 FROM citizens WHERE citizen_number='CLI-0001')`)
    if (!(await q(`SELECT 1 FROM referendums LIMIT 1`)).length)
      for (const [t, d] of SEED_REFS) await q(`INSERT INTO referendums (title, description, author) VALUES ($1,$2,'Managing Minister')`, [t, d])
  })())
}

export async function register(alias: string, password: string, reason: string): Promise<Citizen> {
  await init(); const pw = hash(password)
  if (!sql) {
    const f = M.citizens[0] as Row
    if (!f.pw_hash) { Object.assign(f, { alias, pw_hash: pw }); return pub(f) }
    const id = M.citizens.length + 1
    const c: Row = { id, citizen_number: 'CLI-' + String(id).padStart(4, '0'), alias, title: null, reason, status: 'pending', is_admin: false, created_at: new Date().toISOString(), pw_hash: pw }
    M.citizens.push(c); return pub(c)
  }
  const claimed = await q(`UPDATE citizens SET alias=$1, pw_hash=$2 WHERE citizen_number='CLI-0001' AND pw_hash IS NULL RETURNING *`, [alias, pw])
  if (claimed.length) return claimed[0]
  const r = await q(`INSERT INTO citizens (alias, reason, pw_hash) VALUES ($1,$2,$3) RETURNING id`, [alias, reason, pw])
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

export async function publicCitizens(): Promise<Citizen[]> {
  await init()
  if (!sql) return M.citizens.filter((c: Row) => c.status === 'approved').map(pub).reverse().slice(0, 50)
  return (await q(`SELECT id,citizen_number,alias,title,status,is_admin,created_at FROM citizens WHERE status='approved' ORDER BY id DESC LIMIT 50`)) as Citizen[]
}
export async function pendingCitizens(): Promise<Citizen[]> {
  await init()
  if (!sql) return M.citizens.filter((c: Row) => c.status === 'pending').map(pub)
  return (await q(`SELECT id,citizen_number,alias,title,reason,status,is_admin,created_at FROM citizens WHERE status='pending' ORDER BY id`)) as Citizen[]
}
export async function setStatus(id: number, status: 'approved' | 'rejected') {
  await init()
  if (sql) await q(`UPDATE citizens SET status=$1 WHERE id=$2 AND is_admin=FALSE`, [status, id])
  else { const c = M.citizens.find((c: Row) => c.id === id && !c.is_admin); if (c) c.status = status }
}
const isOpen = (r: any) => !r.closed && !(r.closes_at && new Date(r.closes_at) < new Date())
const OPEN_SQL = `NOT closed AND (closes_at IS NULL OR closes_at > now())`
export async function stats() {
  await init()
  if (!sql) return { citizens: M.citizens.filter((c: Row) => c.status === 'approved').length, referendums: M.refs.filter(isOpen).length }
  const [a] = await q(`SELECT count(*)::int n FROM citizens WHERE status='approved'`); const [b] = await q(`SELECT count(*)::int n FROM referendums WHERE ${OPEN_SQL}`)
  return { citizens: a.n as number, referendums: b.n as number }
}
export async function listRefs(uid?: number): Promise<Ref[]> {
  await init()
  if (!sql) return M.refs.map((r: any) => {
    const v = M.votes.filter((x: any) => x.rid === r.id), n = (c: string) => v.filter((x: any) => x.choice === c).length
    return { ...r, open: isOpen(r), yes: n('yes'), no: n('no'), abstain: n('abstain'), mine: v.find((x: any) => x.cid === uid)?.choice ?? null }
  }).sort((a: any, b: any) => Number(b.open) - Number(a.open) || b.id - a.id)
  return (await q(`SELECT r.id,r.title,r.description,r.author,r.closed,r.closes_at,
    (NOT r.closed AND (r.closes_at IS NULL OR r.closes_at > now())) AS open,
    count(*) FILTER (WHERE v.choice='yes')::int yes, count(*) FILTER (WHERE v.choice='no')::int no, count(*) FILTER (WHERE v.choice='abstain')::int abstain,
    max(CASE WHEN v.citizen_id=$1 THEN v.choice END) mine
    FROM referendums r LEFT JOIN votes v ON v.referendum_id=r.id GROUP BY r.id ORDER BY open DESC, r.id DESC`, [uid ?? -1])) as Ref[]
}
export async function vote(rid: number, cid: number, choice: string): Promise<boolean> {
  await init()
  if (!sql) {
    const r = M.refs.find((x: any) => x.id === rid); if (!r || !isOpen(r)) return false
    const v = M.votes.find((x: any) => x.rid === rid && x.cid === cid); if (v) v.choice = choice; else M.votes.push({ rid, cid, choice }); return true
  }
  const r = await q(`INSERT INTO votes (referendum_id, citizen_id, choice) SELECT $1::int, $2::int, $3::text WHERE EXISTS (SELECT 1 FROM referendums WHERE id=$1::int AND ${OPEN_SQL}) ON CONFLICT (referendum_id, citizen_id) DO UPDATE SET choice=EXCLUDED.choice RETURNING citizen_id`, [rid, cid, choice])
  return r.length > 0
}
export async function addRef(title: string, description: string, author: string, days?: number) {
  await init()
  const closes = days ? new Date(Date.now() + days * 864e5).toISOString() : null
  if (!sql) M.refs.push({ id: M.refs.length + 1, title, description, author, closed: false, closes_at: closes })
  else await q(`INSERT INTO referendums (title, description, author, closes_at) VALUES ($1,$2,$3,$4)`, [title, description, author, closes])
}
export async function closeRef(id: number) {
  await init()
  if (!sql) { const r = M.refs.find((x: any) => x.id === id); if (r) r.closed = true } else await q(`UPDATE referendums SET closed=TRUE WHERE id=$1`, [id])
}
