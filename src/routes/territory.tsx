import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/territory')({ component: Territory })

const roadmap = [
  ['Off-grid solar power', 'Panels and batteries only. No generators, no grid connection.'],
  ['Weather telemetry', 'Open sensor feed for wind, temperature, lake level and rainfall.'],
  ['Leave-no-trace eco-camping', 'Small-footprint, pack-in pack-out expeditions with citizen-approved limits.'],
  ['24/7 citizen-controlled nature livestream', 'Future: the island on camera, with the camera schedule set by referendum.'],
]
const pins = [
  { id: 'island', name: 'Laich Island', x: 235, y: 120, d: 'Target sanctuary, ~1,500 sq m (0.37 acres), Lake Charlotte.' },
  { id: 'cove', name: 'Moose Cove', x: 150, y: 175, d: 'Public launch point. The island is about 6 km by boat from here.' },
  { id: 'yhz', name: 'Halifax Int\u2019l Airport', x: 70, y: 70, d: 'Nearest major airport for visiting citizens.' },
]

function Territory() {
  const [sel, setSel] = useState(pins[0])
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">The Territory</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">Laich Island sits in Lake Charlotte near Moose Cove, Halifax County, Nova Scotia, Canada, about 6 km by boat from the public launch and near Halifax International Airport. It is small, wooded and quiet: a sanctuary first, a settlement never.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass p-4 lg:col-span-3">
          <svg viewBox="0 0 320 240" className="w-full rounded-xl" role="img" aria-label="Schematic map, not to scale">
            <rect width="320" height="240" fill="#0f2a44" rx="12" />
            <path d="M0 150 C60 120 110 170 170 150 S290 90 320 120 V240 H0Z" fill="#134a6b" opacity=".8" />
            <path d="M0 0H320V70 C250 60 190 90 120 60 S40 40 0 55Z" fill="#164a35" />
            <path d="M0 150 C60 120 110 170 170 150 S290 90 320 120" fill="none" stroke="#1E6FD9" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="150" y1="175" x2="235" y2="120" stroke="#fff" strokeOpacity=".5" strokeDasharray="3 4" />
            {pins.map((p) => (
              <g key={p.id} onClick={() => setSel(p)} className="cursor-pointer" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(p)}>
                <circle cx={p.x} cy={p.y} r={sel.id === p.id ? 9 : 6} fill={p.id === 'island' ? '#1F8A5B' : '#1E6FD9'} stroke="#fff" strokeWidth="2" />
                <text x={p.x + 12} y={p.y + 4} fill="#fff" fontSize="10">{p.name}</text>
              </g>
            ))}
          </svg>
          <p className="mt-3 text-sm text-slate-400">Schematic only, not to scale. Select a pin for details.</p>
        </div>
        <div className="glass space-y-3 p-6 lg:col-span-2">
          <h2 className="text-2xl">{sel.name}</h2>
          <p className="text-slate-300">{sel.d}</p>
          <dl className="space-y-1 pt-3 text-sm text-slate-300">
            <div className="flex justify-between"><dt>Region</dt><dd>Halifax County, NS</dd></div>
            <div className="flex justify-between"><dt>Lake</dt><dd>Lake Charlotte</dd></div>
            <div className="flex justify-between"><dt>Boat from launch</dt><dd>~6 km</dd></div>
            <div className="flex justify-between"><dt>Area</dt><dd>~1,500 sq m</dd></div>
          </dl>
          <p className="pt-2 text-xs text-slate-500">Exact survey coordinates will be published once the parcel is confirmed.</p>
        </div>
      </div>
      <section>
        <h2 className="text-3xl">Zero-Concrete Eco-Code</h2>
        <p className="mt-2 text-slate-300">No concrete, no fossil fuels, no permanent buildings. The roadmap below is built in stages, each approved by referendum.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {roadmap.map(([t, d], i) => (<li key={t} className="glass p-5"><span className="text-sm text-pine">Stage {i + 1}</span><h3 className="text-xl">{t}</h3><p className="mt-1 text-slate-300">{d}</p></li>))}
        </ol>
      </section>
    </div>
  )
}
