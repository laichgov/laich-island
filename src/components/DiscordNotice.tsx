import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { DISCORD_URL } from '~/lib/site'

/** Big box for the Passport page, shown while an application is pending. */
export function DiscordNotice({ number }: { number: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(number) } catch {
      const t = document.createElement('textarea'); t.value = number; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <section role="status" className="rounded-2xl border border-lake/50 bg-gradient-to-br from-lake/15 to-pine/10 p-6 sm:p-8">
      <p className="eyebrow !text-[#9db8f5]">Next step</p>
      <p className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">Application submitted! Join our Discord Citizens&rsquo; Assembly and share your ID number for faster approval and access to live debates.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 font-mono text-lg" aria-label="Your ID number">{number}</span>
        <button className="btn ghost !py-2" onClick={copy}>{copied ? 'Copied ✓' : 'Copy ID'}</button>
        <a className="btn blue" href={DISCORD_URL} target="_blank" rel="noreferrer">Join our Discord &rarr;</a>
      </div>
    </section>
  )
}

/** Small reminder on every other page. Hides when the Discord card or the footer is on screen, and can be dismissed. */
export function DiscordPill({ number }: { number: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const [dismissed, setDismissed] = useState(false)
  const [covered, setCovered] = useState(false)
  useEffect(() => { try { if (sessionStorage.getItem('laich_discord_pill') === '1') setDismissed(true) } catch {} }, [])
  useEffect(() => {
    setCovered(false)
    let io: IntersectionObserver | undefined
    const id = setTimeout(() => {
      const els = [document.getElementById('discord-card'), document.getElementById('site-footer')].filter(Boolean) as Element[]
      if (!els.length) return
      const vis = new Set<Element>()
      io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))); setCovered(vis.size > 0) }, { threshold: 0.15 })
      els.forEach((el) => io!.observe(el))
    }, 60)
    return () => { clearTimeout(id); io?.disconnect() }
  }, [path])
  if (path === '/passport' || dismissed) return null
  const close = () => { setDismissed(true); try { sessionStorage.setItem('laich_discord_pill', '1') } catch {} }
  return (
    <div role="status" aria-live="polite" aria-hidden={covered} className={`fixed bottom-4 left-4 right-4 z-40 transition duration-300 sm:left-auto sm:max-w-sm ${covered ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'}`}>
      <div className="flex items-start gap-3 rounded-xl border border-lake/40 bg-[#0d1522]/95 p-3 pr-2 text-sm shadow-xl backdrop-blur">
        <p className="flex-1 text-slate-300">Your application <b className="font-mono text-white">{number}</b> is pending. Join our Discord and share your ID number for faster approval.</p>
        <a className="btn blue !px-3 !py-1.5 text-xs" href={DISCORD_URL} target="_blank" rel="noreferrer" tabIndex={covered ? -1 : 0}>Join</a>
        <button onClick={close} aria-label="Dismiss" className="px-2 text-lg leading-none text-slate-500 hover:text-white">&times;</button>
      </div>
    </div>
  )
}
