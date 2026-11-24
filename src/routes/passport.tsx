import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { getRegistry, getPending, registerFn, loginFn, logoutFn, reviewFn } from '~/lib/server'
import { IdCard } from '~/components/IdCard'
import { DiscordNotice } from '~/components/DiscordNotice'

export const Route = createFileRoute('/passport')({
  loader: async () => ({ registry: await getRegistry(), pending: await getPending() }),
  component: Passport,
})

function Passport() {
  const { me } = Route.useRouteContext()
  const { registry, pending } = Route.useLoaderData()
  const router = useRouter()
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = () => router.invalidate()

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr('')
    const f = new FormData(e.currentTarget)
    const alias = String(f.get('alias')), password = String(f.get('password'))
    const r: any = mode === 'login' ? await loginFn({ data: { alias, password } }) : await registerFn({ data: { alias, password, reason: String(f.get('reason') ?? ''), discord: String(f.get('discord') ?? '') } })
    setBusy(false)
    if (r.error) setErr(r.error); else refresh()
  }
  const download = () => canvas.current?.toBlob((b) => {
    if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${me!.citizen_number}-citizen-id.png`; a.click()
  })

  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">Citizen Passport</h1>
        <p className="mt-3 text-slate-300">Free for everyone. The first registration claims CLI-0001 and becomes administrator. Every later applicant is reviewed and approved by the admin.</p>
      </div>

      {!me && (
        <form onSubmit={submit} className="glass max-w-md space-y-3 p-6">
          <div className="flex gap-2 text-sm">
            <button type="button" className={`btn ${mode === 'register' ? '' : 'ghost'}`} onClick={() => setMode('register')}>Apply</button>
            <button type="button" className={`btn ${mode === 'login' ? 'blue' : 'ghost'}`} onClick={() => setMode('login')}>Log in</button>
          </div>
          <input name="alias" required minLength={2} maxLength={40} placeholder="Alias or name" className="input" />
          <input name="password" type="password" required minLength={6} placeholder="Password (6+ characters)" className="input" />
          {mode === 'register' && (<><textarea name="reason" maxLength={500} rows={3} placeholder="Why do you want to join? (shown to the admin)" className="input" /><input name="discord" maxLength={40} autoComplete="off" placeholder="Discord username (optional, for faster verification)" className="input" /></>)}
          {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
          <button className="btn w-full justify-center" disabled={busy}>{mode === 'register' ? 'Submit application' : 'Log in'}</button>
        </form>
      )}

      {me && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-slate-300">Signed in as <b className="text-white">{me.alias}</b> ({me.citizen_number}){me.is_admin && <span className="ml-2 rounded-full bg-lake px-2 py-0.5 text-xs">Admin</span>}</p>
            <button className="btn ghost !py-1 text-sm" onClick={async () => { await logoutFn(); refresh() }}>Log out</button>
          </div>

          {me.status === 'pending' && <DiscordNotice number={me.citizen_number} />}
          {me.status === 'pending' && <div className="glass p-6"><h2 className="text-2xl">Application received</h2><p className="mt-2 text-slate-300">Your number {me.citizen_number} is reserved. Your ID card unlocks once the admin approves your application.</p></div>}
          {me.status === 'rejected' && <div className="glass p-6 text-red-200">Your application was not approved.</div>}

          {me.status === 'approved' && (
            <div className="grid items-start gap-8 lg:grid-cols-2">
              <IdCard data={{ number: me.citizen_number, alias: me.alias, title: me.title }} onCanvas={(c) => (canvas.current = c)} />
              <div className="glass space-y-3 p-6">
                <h2 className="text-2xl">Your Founding Citizen ID</h2>
                <p className="text-slate-300">Add a photo, then download the flat 1012x638 PNG version of your card.</p>
                <button className="btn" onClick={download}>Download Citizen ID (PNG)</button>
              </div>
            </div>
          )}

          {me.is_admin && (
            <section className="glass p-6">
              <h2 className="text-2xl">Admin: pending applications ({pending.length})</h2>
              {pending.length === 0 && <p className="mt-2 text-slate-400">No applications waiting.</p>}
              <ul className="mt-3 divide-y divide-white/10">
                {pending.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1"><p><b>{p.citizen_number}</b> {p.alias}{p.discord && <span className="ml-2 font-mono text-xs text-mint">Discord: {p.discord}</span>}</p><p className="truncate text-sm text-slate-400">{p.reason || 'No reason given.'}</p></div>
                    <button className="btn !py-1" onClick={async () => { await reviewFn({ data: { id: p.id, approve: true } }); refresh() }}>Approve</button>
                    <button className="btn ghost !py-1" onClick={async () => { await reviewFn({ data: { id: p.id, approve: false } }); refresh() }}>Reject</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section>
        <h2 className="text-2xl">Public registry</h2>
        <div className="glass mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400"><tr><th className="p-3">Number</th><th className="p-3">Citizen</th><th className="p-3">Issued</th></tr></thead>
            <tbody>
              {registry.map((c) => (
                <tr key={c.id} className="border-t border-white/10"><td className="p-3 font-mono">{c.citizen_number}</td><td className="p-3">{c.alias}{c.is_admin && <span className="ml-2 text-xs text-pine">Managing Minister</span>}</td><td className="p-3 text-slate-400">{new Date(c.created_at).toLocaleDateString('en-GB')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
