import { HeadContent, Scripts, Outlet, createRootRoute, Link } from '@tanstack/react-router'
import css from '../styles.css?url'
import { getMe } from '~/lib/server'
import { Flag } from '~/lib/art'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Commonwealth of Laich Island' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  beforeLoad: async () => ({ me: await getMe() }),
  component: Root,
})

const nav = [['/', 'Home'], ['/territory', 'Territory'], ['/constitution', 'Constitution'], ['/passport', 'Passport'], ['/referendums', 'Referendums']] as const

function Root() {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 font-[var(--font-display)] text-lg font-semibold">
              <Flag className="h-6 w-9 rounded-sm" /> Laich Island
            </Link>
            <div className="ml-auto flex flex-wrap gap-4 text-sm text-slate-300">
              {nav.map(([to, label]) => (
                <Link key={to} to={to} className="hover:text-white" activeProps={{ className: 'text-white underline decoration-pine decoration-2 underline-offset-8' }} activeOptions={{ exact: to === '/' }}>{label}</Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10"><Outlet /></main>
        <footer className="mt-16 border-t border-white/10 py-10 text-sm text-slate-400">
          <div className="mx-auto max-w-6xl space-y-3 px-4">
            <div className="flex flex-wrap gap-5 text-slate-200">
              <a className="hover:text-white" href="https://www.youtube.com/@laichgov" target="_blank" rel="noreferrer">YouTube</a>
              <a className="hover:text-white" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Boosty</a>
              <a className="hover:text-white" href="mailto:laichisland@gmail.com">laichisland@gmail.com</a>
            </div>
            <p>Digital Citizen IDs are souvenir community passes. They are not official government travel documents.</p>
            <p>Heraldic crest element adapted from Crest of Nova Scotia (CC BY-SA 3.0) via Wikimedia Commons.</p>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
