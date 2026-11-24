import { Link } from '@tanstack/react-router'

const items = [
  { src: '/flag.png', flat: true, alt: 'National flag of the Commonwealth of Laich Island', title: 'National Flag', body: 'A white field of peace, a green saltire and a blue Lake Charlotte medallion with a white maple leaf.' },
  { src: '/coat-of-arms.png', flat: false, alt: 'Official Coat of Arms of the Commonwealth of Laich Island', title: 'Official Coat of Arms', body: 'A pine on the island above Lake Charlotte, under the saltire. Clasped hands with a sprout, five stars, olive and thistle.' },
  { src: '/eco-defence-emblem.png', flat: false, alt: 'Eco-Defence and Coast Guard emblem of the Commonwealth of Laich Island', title: 'Eco-Defence & Coast Guard', body: 'An olive wreath around a young sapling on the blue Lake Charlotte medallion.' },
]

export function Symbols() {
  return (
    <section aria-labelledby="symbols-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="eyebrow">National symbols</p><h2 id="symbols-title" className="mt-2">Our emblems</h2></div>
        <Link to="/constitution" hash="symbols" className="text-sm font-semibold text-mint hover:underline">Read Article 12 &rarr;</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <figure key={i.title} className="glass flex flex-col overflow-hidden">
            <div className="flex h-64 items-center justify-center bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,.12),transparent_70%)] p-6">
              <img
                src={i.src} alt={i.alt} loading="lazy" decoding="async"
                className={i.flat ? 'w-full max-w-[280px] rounded-lg shadow-xl shadow-black/40' : 'max-h-full max-w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.45)]'}
              />
            </div>
            <figcaption className="border-t border-white/10 p-5">
              <h3 className="text-lg">{i.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{i.body}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
