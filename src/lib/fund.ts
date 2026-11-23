import { createServerFn } from '@tanstack/react-start'
import { ETH_ADDRESS } from './site'

// Optional live balance. Off unless LIVE_FUND=1 is set in the environment.
let cache: { t: number; v: any } | null = null
export const getFund = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.LIVE_FUND !== '1') return null
  if (cache && Date.now() - cache.t < 60_000) return cache.v
  try {
    const rpc = await fetch(process.env.ETH_RPC_URL || 'https://ethereum-rpc.publicnode.com', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [ETH_ADDRESS, 'latest'] }),
    })
    const j: any = await rpc.json()
    const eth = Number(BigInt(j.result)) / 1e18
    const pr = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur')
    const price: number = ((await pr.json()) as any).ethereum.eur
    const baseline = Number(process.env.FUND_BASELINE_ETH || 0)
    const v = { eth, baseline, price, raised_eur: Math.round(Math.max(0, eth - baseline) * price) }
    cache = { t: Date.now(), v }
    return v
  } catch (e) {
    console.error('live fund lookup failed', e)
    return cache?.v ?? null
  }
})
