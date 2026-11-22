import { useEffect, useRef, useState } from 'react'
import { LEAF } from '~/lib/art'

const W = 1012, H = 638
export type CardData = { number: string; alias: string; title: string | null }

const mrz = (c: CardData) => {
  const n = c.alias.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '<')
  return [('P<CLI' + n).padEnd(44, '<').slice(0, 44), (c.number.replace('-', '') + '<<CLI<<221126<<<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 44)]
}
const rr = (x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) => { x.beginPath(); x.roundRect(a, b, w, h, r) }

function draw(cv: HTMLCanvasElement, c: CardData, img: HTMLImageElement | null) {
  const x = cv.getContext('2d')!
  x.clearRect(0, 0, W, H)
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0B1320'); g.addColorStop(1, '#14385c')
  rr(x, 0, 0, W, H, 36); x.fillStyle = g; x.fill()
  x.save(); x.globalAlpha = 0.08; x.fillStyle = '#1E6FD9'; x.translate(520, 60); x.scale(5.2, 5.2); x.fill(new Path2D(LEAF)); x.restore()
  x.save(); x.translate(40, 34); x.scale(0.5, 0.5); x.beginPath(); x.rect(0, 0, 300, 200); x.clip()
  x.fillStyle = '#fff'; x.fillRect(0, 0, 300, 200)
  x.strokeStyle = '#1F8A5B'; x.lineWidth = 30; x.beginPath(); x.moveTo(0, 0); x.lineTo(300, 200); x.moveTo(300, 0); x.lineTo(0, 200); x.stroke()
  x.fillStyle = '#1E6FD9'; x.beginPath(); x.arc(150, 100, 52, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 4; x.stroke()
  x.translate(120, 70); x.scale(0.6, 0.6); x.fillStyle = '#fff'; x.fill(new Path2D(LEAF)); x.restore()
  x.fillStyle = '#fff'; x.font = '700 34px Georgia, serif'; x.fillText('COMMONWEALTH OF LAICH ISLAND', 215, 70)
  x.fillStyle = '#9fb4cc'; x.font = '600 22px system-ui, sans-serif'; x.fillText('Digital Citizen ID, Lake Charlotte, Nova Scotia', 215, 100)
  rr(x, 215, 118, 250, 38, 19); x.fillStyle = '#1F8A5B'; x.fill()
  x.fillStyle = '#fff'; x.font = '700 20px system-ui, sans-serif'; x.fillText('FOUNDING CITIZEN', 240, 144)
  x.save(); rr(x, 40, 185, 250, 290, 20); x.clip(); x.fillStyle = '#1b2a40'; x.fillRect(40, 185, 250, 290)
  if (img) { const s = Math.max(250 / img.width, 290 / img.height), w = img.width * s, h = img.height * s; x.drawImage(img, 40 + (250 - w) / 2, 185 + (290 - h) / 2, w, h) }
  else { x.fillStyle = '#1E6FD9'; x.globalAlpha = 0.5; x.translate(90, 250); x.scale(1.5, 1.5); x.fill(new Path2D(LEAF)) }
  x.restore(); rr(x, 40, 185, 250, 290, 20); x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 3; x.stroke()
  const f = (l: string, v: string, y: number, s = 40) => { x.fillStyle = '#7f95b0'; x.font = '600 18px system-ui'; x.fillText(l, 325, y); x.fillStyle = '#fff'; x.font = `700 ${s}px system-ui`; x.fillText(v, 325, y + s + 2) }
  f('CITIZEN NUMBER', c.number, 205, 46)
  f('NAME / ALIAS', c.alias.slice(0, 26), 285, 40)
  if (c.title) { x.fillStyle = '#5ad19a'; x.font = '600 22px system-ui'; x.fillText(c.title, 325, 385) }
  f('ISSUE DATE', '22 NOV 2026', c.title ? 405 : 375, 34)
  rr(x, 30, 495, W - 60, 90, 12); x.fillStyle = 'rgba(255,255,255,.92)'; x.fill()
  x.fillStyle = '#0B1320'; x.font = '700 29px "Courier New", monospace'
  const [a, b] = mrz(c); x.fillText(a, 50, 534); x.fillText(b, 50, 572)
  x.fillStyle = '#9fb4cc'; x.font = '600 17px system-ui'
  x.fillText('Souvenir / Community Digital Pass Only. Not an official government travel document.', 40, 615)
}

export function IdCard({ data, onCanvas }: { data: CardData; onCanvas?: (c: HTMLCanvasElement) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [url, setUrl] = useState('')
  const [tilt, setTilt] = useState({ x: 0, y: 0, mx: 50, my: 50 })
  const [flip, setFlip] = useState(false)

  useEffect(() => { const c = ref.current!; draw(c, data, img); setUrl(c.toDataURL('image/png')); onCanvas?.(c) }, [data.number, data.alias, data.title, img])

  const upload = (f?: File) => { if (!f) return; const i = new Image(); i.onload = () => setImg(i); i.src = URL.createObjectURL(f) }
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    setTilt({ x: (0.5 - py) * 26, y: (px - 0.5) * 34, mx: px * 100, my: py * 100 })
  }
  const edge = { background: '#0e2238', borderRadius: 28 }
  return (
    <div>
      <canvas ref={ref} width={W} height={H} className="hidden" />
      <div className="mx-auto max-w-[520px]" style={{ perspective: 1000 }} onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0, mx: 50, my: 50 })}>
        <div onClick={() => setFlip(!flip)} className="relative cursor-pointer" role="button" aria-label="Flip card"
          style={{ aspectRatio: `${W}/${H}`, transformStyle: 'preserve-3d', transition: 'transform .15s ease-out', transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flip ? 180 : 0)}deg)` }}>
          {[1, 2, 3, 4].map((d) => <div key={d} className="absolute inset-0" style={{ ...edge, transform: `translateZ(${-d * 1.5}px)` }} />)}
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 28, backfaceVisibility: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,.5)' }}>
            {url && <img src={url} alt={`Citizen ID ${data.number}`} className="h-full w-full" />}
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,.28), transparent 45%)`, mixBlendMode: 'overlay' }} />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ ...edge, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg,#0B1320,#14385c)', border: '1px solid rgba(255,255,255,.2)' }}>
            <svg viewBox="0 0 100 100" className="h-16 w-16"><path d={LEAF} fill="#1E6FD9" /></svg>
            <p className="font-[var(--font-display)] text-lg">Commonwealth of Laich Island</p>
            <p className="text-sm text-slate-300">1 citizen, 1 vote. No permanent rulers.</p>
            <p className="mt-2 text-xs text-slate-400">Souvenir / Community Digital Pass Only.<br />Not an official government travel document.</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">Move your cursor to tilt. Click to flip.</p>
      <label className="mt-4 block text-sm text-slate-300">Avatar photo
        <input type="file" accept="image/*" className="input mt-1" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
    </div>
  )
}
