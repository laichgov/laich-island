import { HeadContent, Scripts, Outlet, createRootRoute, Link } from '@tanstack/react-router'
import css from '../styles.css?url'
import { getMe } from '~/lib/server'
import { SITE_URL, DISCORD_URL } from '~/lib/site'
import { DiscordPill } from '~/components/DiscordNotice'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Commonwealth of Laich Island' }, { name: 'description', content: 'A real island. A real direct democracy. Crowd-funded, off-grid and run by one-citizen-one-vote referendums on Laich Island, Lake Charlotte, Nova Scotia.' }, { name: 'theme-color', content: '#0B1320' },
      { property: 'og:type', content: 'website' }, { property: 'og:site_name', content: 'Commonwealth of Laich Island' }, { property: 'og:title', content: 'Commonwealth of Laich Island: A Real Island. A Real Direct Democracy.' },
      { property: 'og:description', content: 'A real island. A real direct democracy. Crowd-funded, off-grid and run by one-citizen-one-vote referendums on Laich Island, Lake Charlotte, Nova Scotia.' }, { property: 'og:url', content: SITE_URL }, { property: 'og:image', content: SITE_URL + '/og.png' },
      { property: 'og:image:width', content: '1200' }, { property: 'og:image:height', content: '630' }, { property: 'og:image:alt', content: 'Flag of the Commonwealth of Laich Island' },
      { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: 'Commonwealth of Laich Island' }, { name: 'twitter:description', content: 'A real island. A real direct democracy. Crowd-funded, off-grid and run by one-citizen-one-vote referendums on Laich Island, Lake Charlotte, Nova Scotia.' }, { name: 'twitter:image', content: SITE_URL + '/og.png' },
    ],
    links: [
      { rel: 'icon', href: '/flag.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap' },
      { rel: 'stylesheet', href: css },
    ],
  }),
  beforeLoad: async () => ({ me: await getMe() }),
  component: Root,
})

const nav = [['/', 'Home'], ['/territory', 'Territory'], ['/constitution', 'Constitution'], ['/passport', 'Passport'], ['/referendums', 'Referendums'], ['/donate', 'Fund']] as const
const linkCls = 'rounded-md px-3 py-1.5 text-[13px] text-slate-300 transition hover:text-white'

function Root() {
  const { me } = Route.useRouteContext()
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#080e19]/75 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/flag.png" alt="" className="h-5 w-8 rounded-[3px] object-cover ring-1 ring-white/20" />
              <span className="text-[13px] font-semibold uppercase tracking-[.18em]">Laich Island</span>
            </Link>
            <div className="ml-auto hidden items-center gap-1 md:flex">
              {nav.map(([to, l]) => <Link key={to} to={to} className={linkCls} activeProps={{ className: 'bg-white/10 !text-white' }} activeOptions={{ exact: to === '/' }}>{l}</Link>)}
            </div>
            <Link to="/passport" className="btn ml-auto !px-4 !py-2 text-sm md:ml-0">Get your ID</Link>
          </nav>
          <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {nav.map(([to, l]) => <Link key={to} to={to} className={linkCls} activeProps={{ className: 'bg-white/10 !text-white' }} activeOptions={{ exact: to === '/' }}>{l}</Link>)}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><Outlet /></main>
        <footer id="site-footer" className="mt-20 border-t border-white/[.07] py-12 text-sm text-slate-400">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-3">
            <div className="space-y-3">
              <p className="text-[13px] font-semibold uppercase tracking-[.18em] text-white">Commonwealth of Laich Island</p>
              <p>Digital Citizen IDs are souvenir community passes. They are not official government travel documents.</p>
            </div>
            <div className="space-y-2">
              <p className="eyebrow">Explore</p>
              {nav.slice(1).map(([to, l]) => <Link key={to} to={to} className="block hover:text-white">{l}</Link>)}
            </div>
            <div className="space-y-2">
              <p className="eyebrow">Official channels</p>
              <a className="block hover:text-white" href="https://www.youtube.com/@laichgov" target="_blank" rel="noreferrer">YouTube</a>
              <a className="block hover:text-white" href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>
              <a className="block hover:text-white" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Boosty</a>
              <a className="block hover:text-white" href="mailto:laichisland@gmail.com">laichisland@gmail.com</a>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-6xl border-t border-white/[.07] px-5 pt-6 text-xs text-slate-500 sm:px-8">Heraldic crest element adapted from Crest of Nova Scotia (CC BY-SA 3.0) via Wikimedia Commons.</p>
        </footer>
        {me?.status === 'pending' && <DiscordPill number={me.citizen_number} />}
        <Scripts />
      </body>
    </html>
  )
}
