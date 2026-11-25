import { useState } from 'react'
import { broadcastFn } from '~/lib/server'
import { DISCORD_URL } from '~/lib/site'

const AUD = [['all', 'All registered citizens'], ['approved', 'Approved citizens'], ['pending', 'Pending applicants'], ['rejected', 'Rejected applicants'], ['one', 'One citizen (by number)']] as const
const PRESETS = [
  { label: 'Discord reminder', title: 'Join our Discord', body: 'Join the Citizens\u2019 Assembly on Discord to debate live and share your ID number.', url: DISCORD_URL },
  { label: 'New referendum', title: 'A new referendum is open', body: 'Cast your vote in the Voting Hall.', url: '/referendums' },
]

/** Admin form: send a notification (in-app inbox + browser push) to a group of citizens. */
export function AdminBroadcast() {
  const [f, setF] = useState({ audience: 'all' as (typeof AUD)[number][0], number: '', title: '', body: '', url: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null)
    const r: any = await broadcastFn({ data: { title: f.title, body: f.body, url: f.url || undefined, audience: f.audience, number: f.number } })
    setBusy(false)
    if (r.error) return setMsg({ ok: false, text: r.error })
    setMsg({ ok: true, text: `Sent to ${r.recipients} citizen${r.recipients === 1 ? '' : 's'}. Browser push delivered to ${r.pushed} device${r.pushed === 1 ? '' : 's'}. Everyone sees it in their bell.` })
    setF((s) => ({ ...s, title: '', body: '', url: '' }))
  }
  return (
    <section className="glass space-y-4 p-6">
      <div><h2 className="text-2xl">Admin: send a notification</h2><p className="mt-1 text-sm text-slate-400">Shows in each citizen&rsquo;s bell and as a browser push if they turned push on.</p></div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => <button key={p.label} type="button" className="btn ghost !px-3 !py-1.5 text-xs" onClick={() => setF((s) => ({ ...s, title: p.title, body: p.body, url: p.url }))}>{p.label}</button>)}
      </div>
      <form onSubmit={send} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input" value={f.audience} onChange={(e) => set('audience', e.target.value)} aria-label="Audience">{AUD.map(([v, l]) => <option key={v} value={v} className="bg-[#0d1522]">{l}</option>)}</select>
          {f.audience === 'one' && <input className="input" placeholder="CLI-0004" value={f.number} onChange={(e) => set('number', e.target.value)} maxLength={12} />}
        </div>
        <input className="input" required minLength={2} maxLength={80} placeholder="Title" value={f.title} onChange={(e) => set('title', e.target.value)} />
        <textarea className="input" required minLength={2} maxLength={300} rows={3} placeholder="Message (max 300 characters)" value={f.body} onChange={(e) => set('body', e.target.value)} />
        <input className="input" maxLength={300} placeholder="Link when tapped (optional): /referendums or https://..." value={f.url} onChange={(e) => set('url', e.target.value)} />
        {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-mint' : 'text-red-300'}`}>{msg.text}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send notification'}</button>
      </form>
    </section>
  )
}
