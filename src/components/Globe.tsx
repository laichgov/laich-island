import { useEffect, useRef } from 'react'
import { ISLAND } from '~/lib/site'

const HOME = { center: [-40, 30] as [number, number], zoom: 1.3, pitch: 0 }
const TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export function Globe() {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const fly = () => map.current?.flyTo({ center: [ISLAND.lng, ISLAND.lat], zoom: 14, pitch: 45, duration: 7000, essential: true })
  const back = () => map.current?.flyTo({ ...HOME, duration: 3500 })

  useEffect(() => {
    let dead = false, m: any, t: any
    ;(async () => {
      const [{ default: ml }] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
      if (dead || !el.current) return
      m = new ml.Map({
        container: el.current, ...HOME,
        style: {
          version: 8, projection: { type: 'globe' },
          sources: { sat: { type: 'raster', tiles: [TILES], tileSize: 256, maxzoom: 18, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' } },
          layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
        } as any,
      })
      map.current = m
      m.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right')
      new ml.Marker({ color: '#1F8A5B' }).setLngLat([ISLAND.lng, ISLAND.lat]).setPopup(new ml.Popup({ offset: 24 }).setHTML('<b>Laich Island</b><br/>Lake Charlotte, Nova Scotia<br/><small>approximate position</small>')).addTo(m)
      t = setTimeout(fly, 1500)
    })()
    return () => { dead = true; clearTimeout(t); m?.remove() }
  }, [])

  return (
    <div className="glass overflow-hidden p-2">
      <div ref={el} className="h-[460px] w-full rounded-xl bg-[#05080f]" />
      <div className="flex flex-wrap gap-2 p-2">
        <button className="btn !py-1.5 text-sm" onClick={fly}>Fly to Laich Island</button>
        <button className="btn ghost !py-1.5 text-sm" onClick={back}>Back to globe</button>
        <span className="ml-auto self-center text-xs text-slate-400">{ISLAND.lat.toFixed(3)}&deg;N, {Math.abs(ISLAND.lng).toFixed(3)}&deg;W (approx.)</span>
      </div>
    </div>
  )
}
