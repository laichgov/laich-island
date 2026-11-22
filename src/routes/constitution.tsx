import { createFileRoute } from '@tanstack/react-router'
import { Flag, Ensign } from '~/lib/art'

export const Route = createFileRoute('/constitution')({ component: Constitution })

const principles = [
  ['I. Shared Heritage', 'Laich Island is acquired through transparent community crowdfunding as a collective ecological and civic sanctuary.'],
  ['II. 100% Direct Democracy', 'No permanent rulers or career politicians. Every major law, budget allocation, and island project is decided by 1-citizen-1-vote online referendums.'],
  ['III. Strict Ecological Stewardship', 'Protecting the island\u2019s forest, wildlife, and freshwater comes first. Only renewable energy and leave-no-trace expeditions are permitted.'],
  ['IV. Absolute Pacifism & Neutrality', 'The Commonwealth stands outside geopolitical conflicts, dedicating its voice to peace, civil liberties, and environmental cooperation.'],
  ['V. Open Global Citizenship', 'Anyone worldwide who shares these values can claim a free Digital Citizen ID and participate from Day 1.'],
]
const powers = [
  ['The Citizens\u2019 Assembly', 'The supreme legislative body. 1 citizen = 1 vote.'],
  ['Rotating President', 'Elected by citizens for fixed terms once initial community milestones are met. Represents citizens, moderates debates and organises referendums.'],
  ['Office of the Managing Minister', 'Project founder and executive coordinator. Safeguards technical infrastructure, media channels, legal compliance and the core Manifesto.'],
]

function Constitution() {
  return (
    <div className="space-y-14">
      <section>
        <h1 className="text-4xl sm:text-5xl">Manifesto &amp; Constitution</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {principles.map(([t, d]) => (<article key={t} className="glass p-6"><h2 className="text-xl text-white">{t}</h2><p className="mt-2 leading-relaxed text-slate-300">{d}</p></article>))}
        </div>
      </section>
      <section>
        <h2 className="text-3xl">Separation of Powers</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {powers.map(([t, d]) => (<article key={t} className="glass border-t-2 !border-t-pine p-6"><h3 className="text-xl">{t}</h3><p className="mt-2 text-slate-300">{d}</p></article>))}
        </div>
      </section>
      <section>
        <h2 className="text-3xl">National Symbols</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <figure className="glass p-5"><Flag className="w-full rounded-lg" /><figcaption className="mt-3 text-slate-300"><b className="text-white">National Flag.</b> A white field of peace. The green saltire cross references Nova Scotia\u2019s heritage and the island\u2019s pine forests. At the centre, a blue Lake Charlotte medallion holds a white maple leaf.</figcaption></figure>
          <figure className="glass p-5"><Ensign className="w-full rounded-lg" /><figcaption className="mt-3 text-slate-300"><b className="text-white">Eco-Defense &amp; Coast Guard Ensign.</b> A green cross on white, ringed by an olive wreath: protection of land and water, never aggression.</figcaption></figure>
        </div>
      </section>
    </div>
  )
}
