import { createFileRoute, Link } from '@tanstack/react-router'
import { getStats } from '~/lib/server'
import { FlagHero } from '~/components/FlagHero'
import { getFund } from '~/lib/fund'
import { MANUAL_EUR } from '~/lib/site'

const GOAL = 15000
const marks = [1000, 5000, 10000, 15000]

export const Route = createFileRoute('/')({ loader: async () => ({ ...(await getStats()), fund: await getFund() }), component: Home })

function Home() {
  const s = Route.useLoaderData()
  const raised = MANUAL_EUR + (s.fund?.raised_eur ?? 0)
  const pct = Math.min(100, (raised / GOAL) * 100)
  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#050a12]">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full bg-lake/20 blur-[120px]" />
          <div className="absolute bottom-[-30%] right-[22%] h-[420px] w-[420px] rounded-full bg-pine/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at 72% 40%, #000, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 72% 40%, #000, transparent 70%)' }} />
        </div>
        <div className="grid items-center gap-4 px-6 pb-0 pt-12 sm:px-12 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-6">
            <p className="eyebrow">Commonwealth of Laich Island</p>
            <h1 className="mt-4">A Real Island.<br />A Real <i className="text-mint">Direct Democracy.</i></h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">A crowd-funded, social-liberal direct democracy centred on acquiring Laich Island (Lake Charlotte, Nova Scotia, Canada) as a shared, off-grid ecological sanctuary where every citizen votes directly on every decision.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/passport" className="btn">Claim your free Citizen ID</Link>
              <Link to="/referendums" className="btn ghost">Vote in the Hall</Link>
            </div>
            <div className="mt-6 flex gap-5 text-sm text-slate-400">
              <a className="hover:text-white" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Fund on Boosty &rarr;</a>
              <a className="hover:text-white" href="https://www.youtube.com/@laichgov" target="_blank" rel="noreferrer">Watch on YouTube &rarr;</a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[640px] lg:col-span-6"><FlagHero /></div>
        </div>
      </section>

      <section className="grid divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.02] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat label="Registered citizens" value={String(s.citizens)} />
        <Stat label="Active referendums" value={String(s.referendums)} />
        <Stat label="Target island area" value="~1,500 m²" sub="0.37 acres" />
      </section>

      <section className="glass grid gap-8 p-6 sm:p-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="eyebrow">Phase I</p>
          <h2 className="mt-3">Island acquisition</h2>
          <p className="mt-3 text-slate-300">Every contribution is tracked in a public ledger. Spending beyond the stated purpose is decided by referendum.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/donate" className="btn">Pay with crypto</Link><a className="btn ghost" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Boosty</a></div>
        </div>
        <div className="lg:col-span-3">
          <p className="font-[var(--font-display)] text-5xl sm:text-6xl">&euro;{raised.toLocaleString()} <span className="text-2xl text-slate-500">/ &euro;{GOAL.toLocaleString()}</span></p>
          <div className="relative mt-8 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-gradient-to-r from-pine to-lake" style={{ width: `${Math.max(pct, 0.8)}%` }} />
            {marks.map((m) => (
              <div key={m} className="absolute top-0" style={{ left: `${(m / GOAL) * 100}%` }}>
                <div className="-ml-px h-4 w-px -translate-y-1 bg-white/40" />
                <span className="absolute top-5 -translate-x-1/2 whitespace-nowrap text-xs text-slate-400" style={m === GOAL ? { transform: 'translateX(-100%)' } : undefined}>&euro;{m / 1000}k</span>
              </div>
            ))}
          </div>
          <div className="h-6" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['01', 'Claim your Citizen ID', 'Free for anyone worldwide. The admin approves real people, no bots.', '/passport', 'Get your ID'],
          ['02', 'Vote on every decision', 'Laws, budgets and island projects go to a one-citizen-one-vote referendum.', '/referendums', 'Open the Voting Hall'],
          ['03', 'Read the Constitution', 'Five core principles, separation of powers and a public ledger.', '/constitution', 'Read it'],
        ].map(([n, t, d, to, l]) => (
          <article key={n} className="glass flex flex-col p-6">
            <span className="font-[var(--font-display)] text-4xl text-slate-500">{n}</span>
            <h3 className="mt-6 text-xl">{t}</h3>
            <p className="mt-2 flex-1 text-slate-400">{d}</p>
            <Link to={to as any} className="mt-5 text-sm font-semibold text-mint hover:underline">{l} &rarr;</Link>
          </article>
        ))}
      </section>
    </div>
  )
}
const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="p-6 sm:p-8"><p className="eyebrow !text-slate-400">{label}</p><p className="mt-3 font-[var(--font-display)] text-5xl">{value}</p>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}</div>
)
