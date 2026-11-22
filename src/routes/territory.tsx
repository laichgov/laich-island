import { createFileRoute } from '@tanstack/react-router'
import { Globe } from '~/components/Globe'

export const Route = createFileRoute('/territory')({ component: Territory })

const facts: [string, string][] = [
  ['Location', 'Lake Charlotte, Eastern Shore of Halifax County, Nova Scotia, Canada'],
  ['Nearest community', 'Lake Charlotte, at Trunk 7 and Clam Harbour Road, about 58 km from downtown Halifax'],
  ['Lake', 'Glacial lake, up to 48 m deep and about 2 km wide, many small islands near its midpoint'],
  ['Elevation', 'Lake surface about 6 m above sea level'],
  ['Wildlife', 'Landlocked Atlantic salmon, brook trout and white perch are the lake\u2019s best-known fish'],
  ['Target area', '~1,500 sq m (0.37 acres)'],
]
const tbc = ['Exact parcel boundaries and survey', 'Public boat launch and access route', 'Legal owner entity and title arrangement', 'Provincial and municipal permits for any camping or equipment']
const roadmap = [
  ['Off-grid solar power', 'Panels and batteries only. No generators, no grid connection.'],
  ['Weather telemetry', 'Open sensor feed for wind, temperature, lake level and rainfall.'],
  ['Leave-no-trace eco-camping', 'Pack-in, pack-out visits with limits set by referendum.'],
  ['24/7 citizen-controlled nature livestream', 'Future: the island on camera, with its schedule set by referendum.'],
]

function Territory() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">The Territory</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">Laich Island lies in Lake Charlotte, a deep, forested lake on Nova Scotia&rsquo;s Eastern Shore. It is small, wooded and quiet: a sanctuary first and a settlement never.</p>
      </div>
      <Globe />
      <div className="grid gap-6 lg:grid-cols-5">
        <dl className="glass divide-y divide-white/10 lg:col-span-3">
          {facts.map(([k, v]) => (<div key={k} className="grid gap-1 p-4 sm:grid-cols-3"><dt className="text-slate-400">{k}</dt><dd className="sm:col-span-2">{v}</dd></div>))}
        </dl>
        <div className="glass p-5 lg:col-span-2">
          <h2 className="text-xl">Still to be confirmed</h2>
          <p className="mt-1 text-sm text-slate-400">The map marker sits in the middle of the lake until the parcel is surveyed.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">{tbc.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </div>
      <section>
        <h2 className="text-3xl">Zero-Concrete Eco-Code</h2>
        <p className="mt-2 text-slate-300">No concrete, no fossil fuels, no permanent buildings. Each stage is approved by referendum and must comply with Canadian and Nova Scotian law.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {roadmap.map(([t, d], i) => (<li key={t} className="glass p-5"><span className="text-sm text-pine">Stage {i + 1}</span><h3 className="text-xl">{t}</h3><p className="mt-1 text-slate-300">{d}</p></li>))}
        </ol>
      </section>
    </div>
  )
}
