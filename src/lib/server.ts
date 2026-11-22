import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import * as db from './db'

const COOKIE = 'laich_session'
const me = async () => { try { const t = getCookie(COOKIE); return t ? await db.sessionUser(t) : null } catch (e) { console.error('session lookup failed', e); return null } }
const clean = (s: string, n: number) => String(s ?? '').trim().slice(0, n)
const session = async (id: number) => setCookie(COOKIE, await db.newSession(id), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 2592000, secure: process.env.NODE_ENV === 'production' })

export const getMe = createServerFn({ method: 'GET' }).handler(async () => me())
export const getStats = createServerFn({ method: 'GET' }).handler(async () => db.stats())
export const getRegistry = createServerFn({ method: 'GET' }).handler(async () => db.publicCitizens())
export const getPending = createServerFn({ method: 'GET' }).handler(async () => { const u = await me(); return u?.is_admin ? db.pendingCitizens() : [] })
export const getRefs = createServerFn({ method: 'GET' }).handler(async () => db.listRefs((await me())?.id))

export const registerFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { alias: string; password: string; reason: string } }) => {
  const alias = clean(data.alias, 40), reason = clean(data.reason, 500)
  if (alias.length < 2) return { error: 'Alias must be at least 2 characters.' }
  if (String(data.password).length < 6) return { error: 'Password must be at least 6 characters.' }
  if (await db.aliasTaken(alias)) return { error: 'That alias is already registered.' }
  const c = await db.register(alias, data.password, reason)
  await session(c.id); return { ok: true as const }
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
  await db.setStatus(Number(data.id), data.approve ? 'approved' : 'rejected'); return { ok: true }
})
export const voteFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id: number; choice: 'yes' | 'no' | 'abstain' } }) => {
  const u = await me()
  if (u?.status !== 'approved') return { error: 'Only approved citizens can vote.' }
  if (!['yes', 'no', 'abstain'].includes(data.choice)) return { error: 'Invalid choice.' }
  return (await db.vote(Number(data.id), u.id, data.choice)) ? { ok: true } : { error: 'This referendum has ended.' }
})
export const proposeFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { title: string; description: string; days?: number } }) => {
  const u = await me()
  if (u?.status !== 'approved') return { error: 'Only approved citizens can propose.' }
  const t = clean(data.title, 120), d = clean(data.description, 800)
  if (t.length < 5 || d.length < 10) return { error: 'Add a title (5+ chars) and a description (10+ chars).' }
  const days = u.is_admin && Number(data.days) > 0 ? Math.min(365, Math.floor(Number(data.days))) : undefined
  await db.addRef(t, d, u.is_admin ? 'Managing Minister' : `${u.citizen_number} ${u.alias}`, days); return { ok: true }
})
export const endRefFn = createServerFn({ method: 'POST' }).handler(async ({ data }: { data: { id: number } }) => {
  const u = await me(); if (!u?.is_admin) return { error: 'Admins only.' }
  await db.closeRef(Number(data.id)); return { ok: true }
})
