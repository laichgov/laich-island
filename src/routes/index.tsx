import { createFileRoute, Link } from '@tanstack/react-router'
import { getStats } from '~/lib/server'

const GOAL = 15000
const RAISED = 0 // update as Phase I contributions arrive
const marks = [1000, 5000, 10000, 15000]

export const Route = createFileRoute('/')({ loader: () => getStats(), component: Home })

function Home() {
  const s = Route.useLoaderData()
  const pct = Math.min(100, (RAISED / GOAL) * 100)
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Commonwealth of Laich Island</h1>
          <p className="mt-3 text-2xl text-slate-200">A Real Island. A Real Direct Democracy.</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">A crowd-funded, social-liberal direct democracy centred on acquiring Laich Island (Lake Charlotte, Nova Scotia, Canada) as a shared, off-grid ecological sanctuary where every citizen votes directly on every decision.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/passport" className="btn">Claim your free Citizen ID</Link>
            <Link to="/referendums" className="btn blue">Vote in the Hall</Link>
            <Link to="/territory" className="btn ghost">See the island on the globe</Link>
            <a className="btn ghost" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Fund the island on Boosty</a>
            <a className="btn ghost" href="https://www.youtube.com/@laichgov" target="_blank" rel="noreferrer">Watch on YouTube</a>
          </div>
        </div>
        <figure className="glass p-3 lg:col-span-2">
          <img src="/flag.png" alt="National flag of the Commonwealth of Laich Island" className="w-full rounded-lg" />
          <figcaption className="px-1 pt-2 text-center text-sm text-slate-400">The national flag</figcaption>
        </figure>
      </section>

      <section className="glass p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">Phase I: Island Acquisition</h2>
          <p className="text-xl font-semibold">&euro;{RAISED.toLocaleString()} / &euro;{GOAL.toLocaleString()}</p>
        </div>
        <div className="relative mt-8 h-4 rounded-full bg-white/10">
          <div className="h-4 rounded-full bg-gradient-to-r from-pine to-lake" style={{ width: `${Math.max(pct, 0.8)}%` }} />
          {marks.map((m) => (
            <div key={m} className="absolute top-0 h-4" style={{ left: `${(m / GOAL) * 100}%` }}>
              <div className="-ml-px h-4 w-0.5 bg-white/60" />
              <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs text-slate-300" style={{ left: m === GOAL ? '-1rem' : 0 }}>&euro;{m / 1000}k</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-400">Every contribution is tracked publicly, and spending is decided by referendum.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Registered citizens" value={String(s.citizens)} />
        <Stat label="Active referendums" value={String(s.referendums)} />
        <Stat label="Target island area" value="~1,500 sq m" sub="0.37 acres" />
      </section>
    </div>
  )
}
const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="glass p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-[var(--font-display)] text-4xl">{value}</p>{sub && <p className="text-sm text-slate-400">{sub}</p>}</div>
)
