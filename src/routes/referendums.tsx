import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getRefs, voteFn, proposeFn } from '~/lib/server'

export const Route = createFileRoute('/referendums')({ loader: () => getRefs(), component: Hall })

const choices = [['yes', 'Yes', 'bg-pine'], ['no', 'No', 'bg-red-700'], ['abstain', 'Abstain', 'bg-slate-600']] as const

function Hall() {
  const refs = Route.useLoaderData()
  const { me } = Route.useRouteContext()
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const ok = me?.status === 'approved'

  const cast = async (id: number, choice: 'yes' | 'no' | 'abstain') => {
    const r: any = await voteFn({ data: { id, choice } }); setMsg(r.error ?? ''); router.invalidate()
  }
  const propose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form)
    const r: any = await proposeFn({ data: { title: String(f.get('title')), description: String(f.get('description')) } })
    setMsg(r.error ?? ''); if (!r.error) { form.reset(); router.invalidate() }
  }
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">Voting Hall</h1>
        <p className="mt-3 text-slate-300">One citizen, one vote. You can change your vote while a referendum is open.</p>
        {!ok && <p className="mt-3 rounded-lg bg-lake/20 p-3 text-sm">{me ? 'Voting opens once the admin approves your application.' : 'Register and log in on the Passport page to vote.'}</p>}
        {msg && <p role="alert" className="mt-3 text-sm text-red-300">{msg}</p>}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {refs.map((r) => {
          const t = r.yes + r.no + r.abstain || 1
          return (
            <article key={r.id} className="glass space-y-4 p-6">
              <h2 className="text-xl">{r.title}</h2>
              <p className="text-slate-300">{r.description}</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10" aria-label="Results">
                <div className="bg-pine" style={{ width: `${(r.yes / t) * 100}%` }} /><div className="bg-red-600" style={{ width: `${(r.no / t) * 100}%` }} /><div className="bg-slate-500" style={{ width: `${(r.abstain / t) * 100}%` }} />
              </div>
              <p className="text-sm text-slate-400">Yes {r.yes} &middot; No {r.no} &middot; Abstain {r.abstain} &middot; by {r.author}</p>
              <div className="flex flex-wrap gap-2">
                {choices.map(([v, l, bg]) => (
                  <button key={v} disabled={!ok} onClick={() => cast(r.id, v)} className={`btn !py-1.5 ${r.mine === v ? bg : 'ghost'}`}>{l}{r.mine === v && ' (your vote)'}</button>
                ))}
              </div>
            </article>
          )
        })}
      </div>
      {ok && (
        <form onSubmit={propose} className="glass max-w-xl space-y-3 p-6">
          <h2 className="text-2xl">Submit a civic proposal</h2>
          <input name="title" required minLength={5} maxLength={120} placeholder="Proposal title" className="input" />
          <textarea name="description" required minLength={10} maxLength={800} rows={4} placeholder="What should the Commonwealth decide, and why?" className="input" />
          <button className="btn">Submit proposal</button>
        </form>
      )}
    </div>
  )
}
