import { useEffect, useRef, useState } from 'react'

const SRC = '/flag-cutout.webp'
const AR = 1.2683
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv; uniform sampler2D tex; uniform float t;
void main(){
  float w = smoothstep(0.08, 0.95, uv.x); w *= w;           // pole stays still, free edge moves most
  float ph = uv.x * 11.0 - t * 2.3 + uv.y * 4.0;
  float p2 = uv.x * 23.0 - t * 3.6 - uv.y * 6.0;
  vec2 o = vec2(0.010 * sin(ph * 0.7 + 1.3), 0.022 * sin(ph) + 0.009 * sin(p2)) * w;
  vec4 c = texture2D(tex, uv + o);
  float shade = 1.0 + (0.11 * cos(ph) + 0.035 * cos(p2)) * w;  // light rolls across the folds
  c.rgb = min(c.rgb * shade, vec3(c.a));
  c *= 1.0 - smoothstep(0.86, 1.0, uv.y);                      // pole fades into the panel
  gl_FragColor = c;
}`

export function FlagHero() {
  const cv = useRef<HTMLCanvasElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const c = cv.current!
    const gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: true })
    if (!gl) return
    let raf = 0, dead = false, vis = true
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s }
    const pr = gl.createProgram()!
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return
    gl.useProgram(pr)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const tl = gl.getUniformLocation(pr, 't')
    const draw = (t: number) => {
      const d = Math.min(devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d), h = Math.round(c.clientHeight * d)
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(tl, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    const img = new Image()
    img.onload = () => {
      if (dead) return
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture()); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      draw(0); setLive(true)
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const t0 = performance.now()
      const loop = (n: number) => { if (vis) draw((n - t0) / 1000); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }
    img.src = SRC
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting }); io.observe(c)
    return () => { dead = true; cancelAnimationFrame(raf); io.disconnect() }
  }, [])
  return (
    <div className="relative w-full drop-shadow-[0_30px_50px_rgba(0,0,0,.45)]" style={{ aspectRatio: AR }}>
      <img src={SRC} alt="Flag of the Commonwealth of Laich Island" className={`absolute inset-0 h-full w-full object-contain ${live ? 'opacity-0' : ''}`} />
      <canvas ref={cv} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  )
}
