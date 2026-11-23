import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getFund } from '~/lib/fund'
import { ETH_ADDRESS, ETHERSCAN, FUND_GOAL, FUND_MARKS, MANUAL_EUR } from '~/lib/site'

export const Route = createFileRoute('/donate')({ loader: () => getFund(), component: Donate })

const rules = [
  ['Network', 'Send on Ethereum Mainnet. ETH and ERC-20 tokens such as USDC and USDT work.'],
  ['Other chains', 'Bitcoin, Solana, Tron, BNB Chain and layer-2 networks will not show in our public ledger, and some of them cannot be recovered.'],
  ['Irreversible', 'Crypto transfers cannot be undone. Send a small test amount first and check the address on your screen.'],
  ['No extra votes', 'Donations are voluntary. Every citizen gets exactly one vote, whether they donate or not.'],
]

function Donate() {
  const fund = Route.useLoaderData()
  const [copied, setCopied] = useState(false)
  const raised = MANUAL_EUR + (fund?.raised_eur ?? 0)
  const pct = Math.min(100, (raised / FUND_GOAL) * 100)
  const copy = async () => {
    try { await navigator.clipboard.writeText(ETH_ADDRESS) } catch {
      const t = document.createElement('textarea'); t.value = ETH_ADDRESS; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Phase I</p>
        <h1 className="mt-3">Fund the island</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">Every contribution goes toward acquiring Laich Island and is visible on a public blockchain explorer. Pay with crypto below, or use Boosty.</p>
      </div>

      <section className="glass p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-[var(--font-display)] text-4xl sm:text-5xl">&euro;{raised.toLocaleString()} <span className="text-xl text-slate-500">/ &euro;{FUND_GOAL.toLocaleString()}</span></p>
          {fund && <p className="text-sm text-slate-400">Wallet balance {fund.eth.toFixed(4)} ETH · 1 ETH ≈ &euro;{Math.round(fund.price).toLocaleString()}</p>}
        </div>
        <div className="relative mt-8 h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-gradient-to-r from-pine to-lake" style={{ width: `${Math.max(pct, 0.8)}%` }} />
          {FUND_MARKS.map((m) => (
            <div key={m} className="absolute top-0" style={{ left: `${(m / FUND_GOAL) * 100}%` }}>
              <div className="-ml-px h-4 w-px -translate-y-1 bg-white/40" />
              <span className="absolute top-5 whitespace-nowrap text-xs text-slate-400" style={{ transform: m === FUND_GOAL ? 'translateX(-100%)' : 'translateX(-50%)' }}>&euro;{m / 1000}k</span>
            </div>
          ))}
        </div>
        <div className="h-6" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="glass p-6 sm:p-8 lg:col-span-2">
          <p className="eyebrow">Scan to pay</p>
          <div className="mx-auto mt-4 max-w-[320px] rounded-2xl bg-white p-3">
            <img src="/eth-qr.png" alt={`QR code for Ethereum address ${ETH_ADDRESS}`} className="h-auto w-full" />
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">Scan with MetaMask or any Ethereum wallet</p>
        </section>

        <section className="glass space-y-5 p-6 sm:p-8 lg:col-span-3">
          <div>
            <p className="eyebrow">Ethereum address</p>
            <p className="mt-3 break-all rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[15px] leading-relaxed sm:text-base">{ETH_ADDRESS}</p>
            <p className="mt-2 text-xs text-slate-500">Check the start ({ETH_ADDRESS.slice(0, 8)}) and the end ({ETH_ADDRESS.slice(-6)}) before you send.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy address'}</button>
            <a className="btn blue" href={`ethereum:${ETH_ADDRESS}`}>Open in wallet</a>
            <a className="btn ghost" href={ETHERSCAN} target="_blank" rel="noreferrer">View on Etherscan</a>
          </div>
          <dl className="divide-y divide-white/10 border-t border-white/10 text-sm">
            {rules.map(([k, v]) => (<div key={k} className="grid gap-1 py-3 sm:grid-cols-4"><dt className="text-slate-400">{k}</dt><dd className="text-slate-200 sm:col-span-3">{v}</dd></div>))}
          </dl>
        </section>
      </div>

      <p className="text-sm text-slate-500">Prefer a card or bank payment? <a className="text-mint hover:underline" href="https://boosty.to/laich" target="_blank" rel="noreferrer">Support on Boosty</a>. Questions: <a className="text-mint hover:underline" href="mailto:laichisland@gmail.com">laichisland@gmail.com</a>.</p>
    </div>
  )
}
