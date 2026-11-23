import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getFund } from '~/lib/fund'
import { ETH_ADDRESS, ETHERSCAN, FUND_GOAL, FUND_MARKS, MANUAL_EUR } from '~/lib/site'

export const Route = createFileRoute('/donate')({ loader: () => getFund(), component: Donate })

const rules = [
  ['Network', 'Send on Ethereum Mainnet. ETH and ERC-20 tokens such as USDC and USDT work.'],
  ['Irreversible', 'Crypto transfers cannot be undone. Send a small test amount first and check the address on your screen.'],
  ['No extra votes', 'Donations are voluntary. Every citizen gets exactly one vote, whether they donate or not.'],
]

const NETWORKS: [boolean, string, string][] = [
  [true, 'Ethereum Mainnet (ERC-20)', 'ETH, USDT (ERC-20), USDC (ERC-20)'],
  [false, 'TRON (TRC-20)', 'TRON addresses start with T. USDT on TRON sent here will most likely be lost.'],
  [false, 'BNB Chain (BEP-20)', 'Will not arrive or will not show in our ledger.'],
  [false, 'Polygon, Arbitrum, Base, Optimism', 'Not tracked in our public ledger.'],
  [false, 'Solana, Bitcoin, Litecoin, any other coin', 'Different address formats. Funds will be lost.'],
]

function NetworkList() {
  return (
    <ul className="space-y-2">
      {NETWORKS.map(([ok, name, note]) => (
        <li key={name} className={`flex gap-3 rounded-lg border p-3 ${ok ? 'border-pine/50 bg-pine/10' : 'border-[#E04848]/40 bg-[#E04848]/10'}`}>
          <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${ok ? 'bg-pine' : 'bg-[#E04848]'}`}>{ok ? '✓' : '✕'}</span>
          <span className="text-sm"><b className="text-white">{ok ? 'Send on: ' : 'Do NOT send on: '}{name}</b><br /><span className="text-slate-300">{note}</span></span>
        </li>
      ))}
    </ul>
  )
}

function WarningModal({ onAck }: { onAck: () => void }) {
  const [ok, setOk] = useState(false)
  useEffect(() => { const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = p } }, [])
  return (
    <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="warn-title" aria-describedby="warn-desc">
      <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#E04848]/60 bg-[#0d1522] shadow-2xl">
        <div className="bg-[#E04848] px-6 py-3 text-sm font-bold uppercase tracking-[.16em] text-white">⚠ Read before you send</div>
        <div className="space-y-5 p-6">
          <h2 id="warn-title" className="!text-3xl">This is an Ethereum address. Do not send TRON.</h2>
          <p id="warn-desc" className="text-slate-300">Sending a coin on the wrong network is permanent. If you send TRON (TRC-20) USDT or any other chain&rsquo;s asset to this <b className="text-white">0x&hellip;</b> address, it will most likely be lost for good, and nobody can reverse it.</p>
          <NetworkList />
          <p className="rounded-lg bg-white/5 p-3 text-sm text-slate-300"><b className="text-white">On an exchange?</b> When you withdraw, set the network to <b className="text-white">&ldquo;Ethereum (ERC-20)&rdquo;</b>. If the exchange does not offer it for your coin, do not send.</p>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" autoFocus checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#1F8A5B]" />
            <span>I understand. I will send only on <b>Ethereum Mainnet (ERC-20)</b> and I will not use TRON.</span>
          </label>
          <button className="btn w-full" disabled={!ok} onClick={onAck}>Show address and QR code</button>
        </div>
      </div>
    </div>
  )
}

function Donate() {
  const fund = Route.useLoaderData()
  const [copied, setCopied] = useState(false)
  const [ack, setAck] = useState(false)
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
      {!ack && <WarningModal onAck={() => setAck(true)} />}
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

      <section className="rounded-2xl border border-[#E04848]/50 bg-[#E04848]/[.07] p-5 sm:p-6" aria-label="Network warning">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-[#ff8a8a]">⚠ Ethereum Mainnet only. Not TRON.</p>
        <div className="mt-3"><NetworkList /></div>
      </section>

      <div className={`grid gap-6 lg:grid-cols-5 ${ack ? '' : 'pointer-events-none select-none blur-md'}`} aria-hidden={!ack}>
        <section className="glass p-6 sm:p-8 lg:col-span-2">
          <p className="eyebrow">Scan to pay</p>
          <div className="mx-auto mt-4 max-w-[320px] rounded-2xl bg-white p-3">
            <img src="/eth-qr.png" alt={`QR code for Ethereum address ${ETH_ADDRESS}`} className="h-auto w-full" />
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">Scan with MetaMask or any Ethereum wallet. Network: Ethereum Mainnet.</p>
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
