import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/constitution')({ component: Constitution })

const principles = [
  ['I. Shared Heritage', 'Laich Island is acquired through transparent community crowdfunding as a collective ecological and civic sanctuary.'],
  ['II. 100% Direct Democracy', 'No permanent rulers or career politicians. Every major law, budget allocation, and island project is decided by 1-citizen-1-vote online referendums.'],
  ['III. Strict Ecological Stewardship', 'Protecting the island\u2019s forest, wildlife, and freshwater comes first. Only renewable energy and leave-no-trace expeditions are permitted.'],
  ['IV. Absolute Pacifism & Neutrality', 'The Commonwealth stands outside geopolitical conflicts, dedicating its voice to peace, civil liberties, and environmental cooperation.'],
  ['V. Open Global Citizenship', 'Anyone worldwide who shares these values can claim a free Digital Citizen ID and participate from Day 1.'],
]
type Art = { t: string; c: string[] }
const articles: Art[] = [
  { t: 'Name, nature and legal standing', c: [
    'The Commonwealth of Laich Island (\u201cthe Commonwealth\u201d) is a crowd-funded civic and ecological community based on Laich Island, Lake Charlotte, Halifax County, Nova Scotia, Canada.',
    'The Commonwealth is a community project. It is not a sovereign state and claims no exemption from the laws of Canada or Nova Scotia. Where this Constitution conflicts with those laws, the law prevails.',
    'Title to the island will be held by a legally registered entity in trust for the community. The entity is chosen by referendum before any purchase is completed.'] },
  { t: 'Citizenship', c: [
    'Any person in the world who accepts the Core Principles may become a citizen. Citizenship is free and always will be.',
    'Applications are reviewed by the Office of the Managing Minister only to confirm one real person per account. Every rejection is recorded with a reason and can be appealed to the Assembly.',
    'One citizen holds one account and one vote. Citizens may use an alias. Only the alias, citizen number and issue date are public.',
    'The Digital Citizen ID is a souvenir community pass. It is not a travel document and grants no rights under the law of any state.',
    'Citizenship may be revoked only for fraud, duplicate accounts, or serious breach of the Core Principles such as violence or hate. Revocation needs an Assembly vote and a right of reply.'] },
  { t: 'The Citizens\u2019 Assembly', c: [
    'The Assembly is made up of all approved citizens and is the supreme legislative body. 1 citizen = 1 vote.',
    'Any approved citizen may submit a proposal. A proposal must be lawful, safe and specific.',
    'A standard referendum passes when Yes votes exceed No votes. Abstentions count towards turnout but not towards the outcome.',
    'The voting period is set when a referendum opens. It may be ended early only by the Office of the Managing Minister, for legal, safety or security reasons, with a public written note.',
    'Voters may change their vote until the referendum closes. Totals are public. Individual votes are not.'] },
  { t: 'Amending this Constitution', c: [
    'Ordinary articles are amended by two thirds of votes cast in a referendum open for at least 14 days.',
    'The Core Principles are entrenched and need three quarters of votes cast.',
    'If an amendment appears to conflict with the Core Principles, the Managing Minister may trigger one cooling-off period and a second 14-day vote. The Managing Minister has no further veto.'] },
  { t: 'The Rotating President', c: [
    'A President is elected by citizens once the island has been acquired and at least 100 citizens are approved.',
    'The term is 12 months. No person may serve two terms in a row.',
    'The President represents the citizens, moderates debate under a published code of conduct, and organises referendums.',
    'The President has no veto, no lawmaking power and no control of funds or infrastructure.',
    'The President may be recalled by a majority of votes cast in a referendum.'] },
  { t: 'Office of the Managing Minister', c: [
    'The Office is held by the project founder (citizen CLI-0001) as executive coordinator.',
    'It safeguards technical infrastructure, media channels, legal compliance and the core Manifesto, and runs the citizen registry.',
    'It carries out Assembly decisions and makes no laws. It may pause a decision only where carrying it out would be unlawful or unsafe, and must publish its reasons within 24 hours. The Assembly may override a pause by two thirds of votes cast.',
    'It publishes an annual public report on activity, funds and decisions.',
    'The Assembly may remove the Office-holder for serious breach, or transfer the Office, by two thirds of votes cast.'] },
  { t: 'Finance and transparency', c: [
    'Every contribution and every expense is published in a public ledger.',
    'Phase I raises \u20ac15,000 for the acquisition of the island. Spending beyond the stated purpose needs a referendum.',
    'No office is paid unless the Assembly approves it by referendum.'] },
  { t: 'Ecological code', c: [
    'Only renewable energy is permitted. Concrete and permanent structures are prohibited unless a referendum approves them and the law allows them.',
    'All visits follow leave-no-trace principles: pack in, pack out, no fires outside permitted places, no harm to wildlife or water.',
    'Approved installations are limited to low-impact equipment such as solar panels, weather sensors and cameras.'] },
  { t: 'Rights and duties', c: [
    'Every citizen has an equal vote, freedom of expression within the law and respect for others, and the right to privacy. The Commonwealth collects the minimum data needed to run the registry.',
    'Every citizen may appeal decisions that affect them to the Assembly.',
    'Every citizen must refrain from violence, harassment and hatred in all Commonwealth spaces.'] },
  { t: 'Peace and neutrality', c: [
    'The Commonwealth keeps no military and takes no side in armed conflicts. The Eco-Defense & Coast Guard protects land and water and is never armed for aggression.',
    'Public statements on peace, civil liberties and environmental cooperation are made only after a referendum.'] },
  { t: 'Transitional provisions', c: [
    'Until the first President is elected, the Managing Minister coordinates referendums and the Citizens\u2019 Assembly sits continuously online.',
    'This is Draft v1.0 dated 22 November 2026. It takes effect when ratified by a referendum of the Founding Citizens.'] },
]

function Constitution() {
  return (
    <div className="grid gap-10 lg:grid-cols-4">
      <nav className="hidden lg:block"><ul className="glass sticky top-24 space-y-1 p-4 text-sm text-slate-300">
        <li><a href="#preamble" className="hover:text-white">Preamble</a></li>
        <li><a href="#principles" className="hover:text-white">Core Principles</a></li>
        {articles.map((a, i) => <li key={a.t}><a href={`#art-${i + 1}`} className="hover:text-white">Art. {i + 1}: {a.t}</a></li>)}
        <li><a href="#symbols" className="hover:text-white">National symbols</a></li>
      </ul></nav>
      <div className="space-y-12 lg:col-span-3">
        <header id="preamble">
          <h1 className="text-4xl sm:text-5xl">Constitution of the Commonwealth of Laich Island</h1>
          <p className="mt-5 font-[var(--font-display)] text-xl leading-relaxed text-slate-200">We, the citizens of the Commonwealth of Laich Island, wish to hold one small piece of nature in common, to decide together, and to harm no one. We adopt this Constitution.</p>
          <p className="mt-2 text-sm text-slate-400">Draft v1.0, 22 November 2026</p>
        </header>
        <section id="principles" className="space-y-3">
          <h2 className="text-3xl">The Five Core Principles</h2>
          {principles.map(([t, d]) => (<article key={t} className="glass border-l-2 !border-l-pine p-5"><h3 className="text-xl text-white">{t}</h3><p className="mt-1 leading-relaxed text-slate-300">{d}</p></article>))}
        </section>
        {articles.map((a, i) => (
          <section key={a.t} id={`art-${i + 1}`} className="scroll-mt-24">
            <h2 className="text-2xl">Article {i + 1}. {a.t}</h2>
            <ol className="mt-3 space-y-2 leading-relaxed text-slate-300">
              {a.c.map((c, j) => <li key={j} className="flex gap-3"><span className="w-8 shrink-0 text-slate-500">{i + 1}.{j + 1}</span><span>{c}</span></li>)}
            </ol>
          </section>
        ))}
        <section id="symbols" className="scroll-mt-24">
          <h2 className="text-2xl">Article {articles.length + 1}. National symbols</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <figure className="glass p-4"><img src="/flag.png" alt="National flag" className="w-full rounded-lg" /><figcaption className="mt-3 text-slate-300"><b className="text-white">National Flag.</b> A white field of peace crossed by a green saltire, recalling Nova Scotia&rsquo;s heritage and the island&rsquo;s pine forests. At the centre, a blue medallion for Lake Charlotte bears a white maple leaf, ringed in red, green and black. Above it sits the heraldic crest: clasped hands, an olive branch and a thistle.</figcaption></figure>
            <figure className="glass p-4"><img src="/ensign.png" alt="Eco-Defense and Coast Guard ensign" className="w-full rounded-lg" /><figcaption className="mt-3 text-slate-300"><b className="text-white">Eco-Defense &amp; Coast Guard Ensign.</b> A green cross on white, with the same ringed medallion. A white olive wreath around a young sapling stands for protection and growth, and the crest rests in the upper hoist corner.</figcaption></figure>
          </div>
        </section>
      </div>
    </div>
  )
}
