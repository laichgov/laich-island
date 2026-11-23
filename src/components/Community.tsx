import { DISCORD_URL, YOUTUBE_URL } from '~/lib/site'

const cards = [
  {
    href: YOUTUBE_URL, title: 'Watch on YouTube', body: 'Build-in-public updates, Shorts and island progress.', tag: '@laichgov', accent: '#E04848',
    icon: (<svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" /></svg>),
  },
  {
    href: DISCORD_URL, title: 'Join the Discord', body: 'Citizens\u2019 Assembly chat, referendum debates and announcements.', tag: DISCORD_URL.replace('https://', ''), accent: '#7B86F7',
    icon: (<svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden><path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6.2L9 21.5V17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><circle cx="8.5" cy="10" r="1.4" fill="#0B1320" /><circle cx="12" cy="10" r="1.4" fill="#0B1320" /><circle cx="15.5" cy="10" r="1.4" fill="#0B1320" /></svg>),
  },
]

export function Community() {
  return (
    <section aria-label="Community links" className="space-y-4">
      <div><p className="eyebrow">Community</p><h2 className="mt-2">Follow the build</h2></div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <a key={c.href} href={c.href} target="_blank" rel="noreferrer" className="glass group flex items-center gap-5 p-6 transition hover:border-white/25 hover:bg-white/[.05]">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: c.accent + '26', color: c.accent }}>{c.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{c.title}</span>
              <span className="mt-0.5 block text-sm text-slate-400">{c.body}</span>
              <span className="mt-2 block truncate font-mono text-xs text-slate-500">{c.tag}</span>
            </span>
            <span aria-hidden className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-white">&rarr;</span>
          </a>
        ))}
      </div>
    </section>
  )
}
