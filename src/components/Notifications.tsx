import { useEffect, useRef, useState } from 'react'
import type { Notice } from '~/lib/db'
import { getNotifications, markReadFn, getPushConfig, subscribePush, unsubscribePush } from '~/lib/server'

const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}
const b64 = (k: string) => {
  const p = '='.repeat((4 - (k.length % 4)) % 4), raw = atob((k + p).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

type PS = 'checking' | 'unsupported' | 'unconfigured' | 'off' | 'on' | 'denied'
/** Opt in or out of browser push notifications on this device. */
export function PushToggle() {
  const [st, setSt] = useState<PS>('checking'); const [busy, setBusy] = useState(false)
  useEffect(() => {
    ;(async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setSt('unsupported')
      const cfg = await getPushConfig(); if (!cfg.publicKey) return setSt('unconfigured')
      if (Notification.permission === 'denied') return setSt('denied')
      const reg = await navigator.serviceWorker.getRegistration('/sw.js'); const sub = await reg?.pushManager.getSubscription()
      setSt(sub && Notification.permission === 'granted' ? 'on' : 'off')
    })().catch(() => setSt('unsupported'))
  }, [])
  const enable = async () => {
    setBusy(true)
    try {
      const cfg = await getPushConfig(); const perm = await Notification.requestPermission()
      if (perm !== 'granted') return setSt(perm === 'denied' ? 'denied' : 'off')
      const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.publicKey!) })
      const j = sub.toJSON(); await subscribePush({ data: { endpoint: j.endpoint!, p256dh: j.keys!.p256dh, auth: j.keys!.auth } }); setSt('on')
    } catch (e) { console.error(e); setSt('off') } finally { setBusy(false) }
  }
  const disable = async () => {
    setBusy(true)
    try { const reg = await navigator.serviceWorker.getRegistration('/sw.js'); const sub = await reg?.pushManager.getSubscription(); if (sub) { await unsubscribePush({ data: { endpoint: sub.endpoint } }); await sub.unsubscribe() }; setSt('off') }
    catch (e) { console.error(e) } finally { setBusy(false) }
  }
  const msg: Record<PS, string> = {
    checking: '', on: 'Push notifications are on for this device.', off: 'Get a push notification when your application is reviewed.',
    denied: 'Notifications are blocked in your browser settings. Allow them for this site to turn push on.',
    unsupported: 'This browser cannot show push notifications. On iPhone, add the site to your Home Screen first. You still get alerts in the bell.',
    unconfigured: 'Push is not enabled on this site yet. You still get alerts in the bell.',
  }
  if (st === 'checking') return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
      <span className="min-w-0 flex-1">{msg[st]}</span>
      {st === 'off' && <button className="btn blue !px-3 !py-1.5 text-xs" disabled={busy} onClick={enable}>Turn on push</button>}
      {st === 'on' && <button className="btn ghost !px-3 !py-1.5 text-xs" disabled={busy} onClick={disable}>Turn off</button>}
    </div>
  )
}

/** Header bell with unread badge and an inbox dropdown. */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ items: Notice[]; unread: number }>({ items: [], unread: 0 })
  const box = useRef<HTMLDivElement>(null)
  const load = async () => { try { setData(await getNotifications()) } catch {} }
  useEffect(() => { load(); const id = setInterval(() => { if (!document.hidden) load() }, 60000); return () => clearInterval(id) }, [])
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])
  const readAll = async () => { await markReadFn({ data: {} }); load() }
  const openItem = async (n: Notice) => { if (!n.read) { await markReadFn({ data: { id: n.id } }); load() } }
  return (
    <div ref={box} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) load() }} aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`} aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
        {data.unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E04848] px-1 text-[10px] font-bold text-white">{data.unread > 9 ? '9+' : data.unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-[60] mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-xl border border-white/10 bg-[#0d1522] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {data.unread > 0 && <button onClick={readAll} className="text-xs text-mint hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-[22rem] divide-y divide-white/5 overflow-y-auto">
            {data.items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Nothing yet. Updates about your application will appear here.</li>}
            {data.items.map((n) => {
              const inner = (<><span className="flex items-start justify-between gap-3"><b className={`text-sm ${n.read ? 'text-slate-300' : 'text-white'}`}>{n.title}</b><span className="shrink-0 text-[11px] text-slate-500">{ago(n.created_at)}</span></span><span className="mt-0.5 block text-sm text-slate-400">{n.body}</span></>)
              const cls = `block px-4 py-3 ${n.read ? '' : 'bg-lake/10'} hover:bg-white/5`
              return (
                <li key={n.id}>
                  {n.url ? <a href={n.url} {...(n.url.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} onClick={() => openItem(n)} className={cls}>{inner}</a>
                    : <button onClick={() => openItem(n)} className={`w-full text-left ${cls}`}>{inner}</button>}
                </li>
              )
            })}
          </ul>
          <div className="border-t border-white/10 px-4 py-3"><PushToggle /></div>
        </div>
      )}
    </div>
  )
}
