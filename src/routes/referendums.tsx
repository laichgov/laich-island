import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getRefs, voteFn, proposeFn, endRefFn } from '~/lib/server'

export const Route = createFileRoute('/referendums')({ loader: () => getRefs(), component: Hall })

const COLORS = ['bg-pine', 'bg-red-600', 'bg-slate-500', 'bg-lake', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500']

function Hall() {
  const refs = Route.useLoaderData()
  const { me } = Route.useRouteContext()
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const ok = me?.status === 'approved', admin = !!me?.is_admin
  const run = async (p: Promise<any>) => { const r = await p; setMsg(r?.error ?? ''); router.invalidate(); return r }
  const propose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form)
    const options = String(f.get('options') ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
    const r = await run(proposeFn({ data: { title: String(f.get('title')), description: String(f.get('description')), days: Number(f.get('days') || 0), options } }))
    if (!r.error) form.reset()
  }
  const open = refs.filter((r) => r.open), ended = refs.filter((r) => !r.open)

  const outcome = (r: (typeof refs)[number]) => {
    if (r.total === 0) return 'No votes'
    if (r.isDefault) return r.tally[0] > r.tally[1] ? 'Passed' : r.tally[1] > r.tally[0] ? 'Rejected' : 'Tied'
    const top = Math.max(...r.tally), winners = r.options.filter((_, i) => r.tally[i] === top)
    return winners.length > 1 ? 'Tied' : `Winner: ${winners[0]}`
  }
  const Card = ({ r }: { r: (typeof refs)[number] }) => (
    <article className="glass space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl">{r.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${r.open ? 'bg-pine' : 'bg-slate-600'}`}>{r.open ? 'Open' : `Ended: ${outcome(r)}`}</span>
      </div>
      <p className="text-slate-300">{r.description}</p>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label="Results">
        {r.options.map((_, i) => <div key={i} className={COLORS[i % COLORS.length]} style={{ width: `${r.total ? (r.tally[i] / r.total) * 100 : 0}%` }} />)}
      </div>
      <ul className="grid gap-x-4 gap-y-1 text-sm text-slate-400 sm:grid-cols-2">
        {r.options.map((o, i) => <li key={i} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLORS[i % COLORS.length]}`} /><span className="min-w-0 flex-1 truncate">{o}</span><b className="text-slate-200">{r.tally[i]}</b></li>)}
      </ul>
      <p className="text-xs text-slate-500">{r.total} vote{r.total === 1 ? '' : 's'} · by {r.author}{r.open && r.closes_at ? ` · closes ${new Date(r.closes_at).toLocaleDateString('en-GB')}` : ''}</p>
      <div className="flex flex-wrap gap-2">
        {r.open && r.options.map((o, i) => (
          <button key={i} disabled={!ok} onClick={() => run(voteFn({ data: { id: r.id, choice: i } }))} className={`btn !py-1.5 ${r.mine === i ? COLORS[i % COLORS.length] : 'ghost'}`}>{o}{r.mine === i && ' (your vote)'}</button>
        ))}
        {!r.open && r.mine != null && <span className="text-sm text-slate-400">You voted: {r.options[r.mine]}.</span>}
        {admin && r.open && <button className="btn ghost !py-1.5 sm:ml-auto" onClick={() => confirm('End this referendum now? Voting will close.') && run(endRefFn({ data: { id: r.id } }))}>End referendum</button>}
      </div>
    </article>
  )
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">Voting Hall</h1>
        <p className="mt-3 text-slate-300">One citizen, one vote. You can change your vote until a referendum closes. Individual votes are not published, only totals.</p>
        {!ok && <p className="mt-3 rounded-lg bg-lake/20 p-3 text-sm">{me ? 'Voting opens once the admin approves your application.' : 'Register and log in on the Passport page to vote.'}</p>}
        {msg && <p role="alert" className="mt-3 text-sm text-red-300">{msg}</p>}
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl">Open now ({open.length})</h2>
        {open.length === 0 && <p className="text-slate-400">No open referendums. Submit a proposal below.</p>}
        <div className="grid gap-5 lg:grid-cols-2">{open.map((r) => <Card key={r.id} r={r} />)}</div>
      </section>
      {ok && (
        <form onSubmit={propose} className="glass max-w-xl space-y-3 p-6">
          <h2 className="text-2xl">{admin ? 'Open a new referendum' : 'Submit a civic proposal'}</h2>
          <input name="title" required minLength={5} maxLength={120} placeholder="Title" className="input" />
          <textarea name="description" required minLength={10} maxLength={800} rows={4} placeholder="What should the Commonwealth decide, and why?" className="input" />
          {admin && (<>
            <textarea name="options" rows={4} placeholder={'Custom answer options, one per line (2 to 8).\nLeave empty for Yes / No / Abstain.'} className="input" />
            <input name="days" type="number" min={1} max={365} placeholder="Voting days (leave empty to stay open until you end it)" className="input" />
          </>)}
          <button className="btn">{admin ? 'Open referendum' : 'Submit proposal'}</button>
        </form>
      )}
      {ended.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl">Ended ({ended.length})</h2>
          <div className="grid gap-5 lg:grid-cols-2">{ended.map((r) => <Card key={r.id} r={r} />)}</div>
        </section>
      )}
    </div>
  )
}
