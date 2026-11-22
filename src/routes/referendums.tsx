import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getRefs, voteFn, proposeFn, endRefFn } from '~/lib/server'

export const Route = createFileRoute('/referendums')({ loader: () => getRefs(), component: Hall })

const choices = [['yes', 'Yes', 'bg-pine'], ['no', 'No', 'bg-red-700'], ['abstain', 'Abstain', 'bg-slate-600']] as const

function Hall() {
  const refs = Route.useLoaderData()
  const { me } = Route.useRouteContext()
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const ok = me?.status === 'approved', admin = !!me?.is_admin
  const run = async (p: Promise<any>) => { const r = await p; setMsg(r?.error ?? ''); router.invalidate(); return r }
  const propose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form)
    const r = await run(proposeFn({ data: { title: String(f.get('title')), description: String(f.get('description')), days: Number(f.get('days') || 0) } }))
    if (!r.error) form.reset()
  }
  const open = refs.filter((r) => r.open), ended = refs.filter((r) => !r.open)

  const Card = ({ r }: { r: (typeof refs)[number] }) => {
    const t = r.yes + r.no + r.abstain || 1
    const result = r.yes > r.no ? 'Passed' : r.no > r.yes ? 'Rejected' : 'Tied'
    return (
      <article className="glass space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl">{r.title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${r.open ? 'bg-pine' : 'bg-slate-600'}`}>{r.open ? 'Open' : `Ended: ${result}`}</span>
        </div>
        <p className="text-slate-300">{r.description}</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10" aria-label="Results">
          <div className="bg-pine" style={{ width: `${(r.yes / t) * 100}%` }} /><div className="bg-red-600" style={{ width: `${(r.no / t) * 100}%` }} /><div className="bg-slate-500" style={{ width: `${(r.abstain / t) * 100}%` }} />
        </div>
        <p className="text-sm text-slate-400">Yes {r.yes} &middot; No {r.no} &middot; Abstain {r.abstain} &middot; by {r.author}{r.open && r.closes_at ? ` · closes ${new Date(r.closes_at).toLocaleDateString('en-GB')}` : ''}</p>
        <div className="flex flex-wrap gap-2">
          {r.open && choices.map(([v, l, bg]) => (
            <button key={v} disabled={!ok} onClick={() => run(voteFn({ data: { id: r.id, choice: v } }))} className={`btn !py-1.5 ${r.mine === v ? bg : 'ghost'}`}>{l}{r.mine === v && ' (your vote)'}</button>
          ))}
          {!r.open && r.mine && <span className="text-sm text-slate-400">You voted {r.mine}.</span>}
          {admin && r.open && <button className="btn ghost !py-1.5 ml-auto" onClick={() => confirm('End this referendum now? Voting will close.') && run(endRefFn({ data: { id: r.id } }))}>End referendum</button>}
        </div>
      </article>
    )
  }
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
          {admin && <input name="days" type="number" min={1} max={365} placeholder="Voting days (leave empty to stay open until you end it)" className="input" />}
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
