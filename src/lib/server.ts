import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import * as db from './db'
import { notify } from './notify'
import { DISCORD_URL } from './site'

const COOKIE = 'laich_session'
const me = async () => { try { const t = getCookie(COOKIE); return t ? await db.sessionUser(t) : null } catch (e) { console.error('session lookup failed', e); return null } }
const clean = (s: string, n: number) => String(s ?? '').trim().slice(0, n)
const session = async (id: number) => setCookie(COOKIE, await db.newSession(id), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 2592000, secure: process.env.NODE_ENV === 'production' })
// A failed notification must never break registration, review or voting.
const safeNotify = async (ids: number[], n: { title: string; body: string; url?: string }) => {
  try { return await notify(ids, n) } catch (e) { console.error('notify failed', e); return { recipients: 0, pushed: 0 } }
}

export const getMe = createServerFn({ method: 'GET' }).handler(async () => me())
export const getStats = createServerFn({ method: 'GET' }).handler(async () => db.stats())
export const getRegistry = createServerFn({ method: 'GET' }).handler(async () => db.publicCitizens())
export const getPending = createServerFn({ method: 'GET' }).handler(async () => { const u = await me(); return u?.is_admin ? db.pendingCitizens() : [] })
export const getRefs = createServerFn({ method: 'GET' }).handler(async () => db.listRefs((await me())?.id))

export const registerFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { alias: string; password: string; reason: string; discord?: string } }) => {
  const alias = clean(data.alias, 40), reason = clean(data.reason, 500)
  const discord = clean(data.discord ?? '', 40).replace(/^@/, '') || null
  if (discord && !/^[\w.#\- ]{2,40}$/.test(discord)) return { error: 'Discord username looks invalid. Use letters, numbers, dots or underscores, or leave it empty.' }
  if (alias.length < 2) return { error: 'Alias must be at least 2 characters.' }
  if (String(data.password).length < 6) return { error: 'Password must be at least 6 characters.' }
  if (await db.aliasTaken(alias)) return { error: 'That alias is already registered.' }
  const c = await db.register(alias, data.password, reason, discord)
  await session(c.id)
  if (c.status === 'pending') await safeNotify([c.id], {
    title: 'Welcome to Laich Island',
    body: `Your Citizen ID is ${c.citizen_number}. Join our Discord Citizens\u2019 Assembly and share it for faster approval.`,
    url: DISCORD_URL,
  })
  return { ok: true as const }
})
export const loginFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { alias: string; password: string } }) => {
  const c = await db.login(clean(data.alias, 40), String(data.password))
  if (!c) return { error: 'Alias or password is incorrect.' }
  await session(c.id); return { ok: true as const }
})
export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const t = getCookie(COOKIE); if (t) await db.dropSession(t); deleteCookie(COOKIE, { path: '/' }); return { ok: true }
})

export const reviewFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id: number; approve: boolean } }) => {
  const u = await me(); if (!u?.is_admin) return { error: 'Admins only.' }
  const id = Number(data.id); const target = await db.getCitizen(id)
  if (!target) return { error: 'Citizen not found.' }
  await db.setStatus(id, data.approve ? 'approved' : 'rejected')
  await safeNotify([id], data.approve
    ? { title: 'Application approved', body: `Welcome, ${target.alias}! ${target.citizen_number} is now an active Citizen ID. Join the Discord to debate live and vote in the Voting Hall.`, url: '/referendums' }
    : { title: 'Application not approved', body: 'Your application was not approved this time. Ask us on Discord or at laichisland@gmail.com if you think this is a mistake.', url: DISCORD_URL })
  return { ok: true }
})

// ---------- referendums ----------
export const voteFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id: number; choice: number } }) => {
  const u = await me()
  if (u?.status !== 'approved') return { error: 'Only approved citizens can vote.' }
  if (!Number.isInteger(data.choice)) return { error: 'Invalid choice.' }
  const r = await db.vote(Number(data.id), u.id, data.choice)
  return r === 'ok' ? { ok: true } : { error: r === 'closed' ? 'This referendum has ended.' : 'Invalid choice.' }
})
export const proposeFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { title: string; description: string; days?: number; options?: string[] } }) => {
  const u = await me()
  if (u?.status !== 'approved') return { error: 'Only approved citizens can propose.' }
  const t = clean(data.title, 120), d = clean(data.description, 800)
  if (t.length < 5 || d.length < 10) return { error: 'Add a title (5+ chars) and a description (10+ chars).' }
  const days = u.is_admin && Number(data.days) > 0 ? Math.min(365, Math.floor(Number(data.days))) : undefined
  let options: string[] | null = null
  if (u.is_admin && Array.isArray(data.options) && data.options.some((o) => String(o).trim())) {
    const seen = new Set<string>(); options = []
    for (const o of data.options) { const v = clean(o, 60); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); options.push(v) } }
    if (options.length < 2 || options.length > 8) return { error: 'Give 2 to 8 different answer options, or leave the list empty for Yes / No / Abstain.' }
  }
  await db.addRef(t, d, u.is_admin ? 'Managing Minister' : `${u.citizen_number} ${u.alias}`, days, options); return { ok: true }
})
export const endRefFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id: number } }) => {
  const u = await me(); if (!u?.is_admin) return { error: 'Admins only.' }
  await db.closeRef(Number(data.id)); return { ok: true }
})

// ---------- notifications and push ----------
export const getPushConfig = createServerFn({ method: 'GET' }).handler(async () => ({ publicKey: process.env.VAPID_PUBLIC_KEY || null }))
export const getNotifications = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await me(); if (!u) return { items: [] as db.Notice[], unread: 0 }
  const items = await db.listNotices(u.id); return { items, unread: items.filter((n) => !n.read).length }
})
export const markReadFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id?: number } }) => {
  const u = await me(); if (!u) return { error: 'Log in first.' }
  await db.markRead(u.id, data?.id != null ? Number(data.id) : undefined); return { ok: true }
})
export const subscribePush = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { endpoint: string; p256dh: string; auth: string } }) => {
  const u = await me(); if (!u) return { error: 'Log in first.' }
  if (!/^https:\/\//.test(String(data.endpoint)) || !data.p256dh || !data.auth) return { error: 'Invalid subscription.' }
  await db.saveSub(u.id, { endpoint: String(data.endpoint), p256dh: String(data.p256dh), auth: String(data.auth) }); return { ok: true }
})
export const unsubscribePush = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { endpoint: string } }) => {
  const u = await me(); if (!u) return { error: 'Log in first.' }
  await db.dropSub(String(data.endpoint)); return { ok: true }
})
export const broadcastFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { title: string; body: string; url?: string; audience: 'all' | 'approved' | 'pending' | 'rejected' | 'one'; number?: string } }) => {
  const u = await me(); if (!u?.is_admin) return { error: 'Admins only.' }
  const title = clean(data.title, 80), body = clean(data.body, 300), url = clean(data.url ?? '', 300)
  if (title.length < 2 || body.length < 2) return { error: 'Add a title and a message.' }
  if (url && !/^(\/[\w\-./?=&#%]*|https:\/\/\S+)$/.test(url)) return { error: 'The link must start with / or https://' }
  if (!['all', 'approved', 'pending', 'rejected', 'one'].includes(data.audience)) return { error: 'Choose who should receive it.' }
  if (data.audience === 'one' && !/^CLI-\d{4}$/i.test(clean(data.number ?? '', 12))) return { error: 'Enter a citizen number like CLI-0004.' }
  const ids = await db.audience(data.audience, clean(data.number ?? '', 12))
  if (!ids.length) return { error: 'No registered citizens match that audience.' }
  const r = await safeNotify(ids, { title, body, url: url || undefined })
  return { ok: true as const, recipients: r.recipients, pushed: r.pushed }
})
