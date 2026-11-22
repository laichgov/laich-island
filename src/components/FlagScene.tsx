import { useEffect, useRef } from 'react'

const prng = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

export function FlagScene() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let dead = false, stop = () => {}
    ;(async () => {
      try {
        const THREE = await import('three')
        const { Sky } = await import('three/addons/objects/Sky.js')
        const { Water } = await import('three/addons/objects/Water.js')
        const el = host.current
        if (dead || !el) return
        const small = el.clientWidth < 700

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(el.clientWidth, el.clientHeight)
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.5
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        el.appendChild(renderer.domElement)
        const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0xb4c4d2, 0.011)
        const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 3000)

        // procedural PBR maps (normal maps generated from height functions)
        const normalTex = (size: number, h: (u: number, v: number) => number, k: number, rep: number) => {
          const c = document.createElement('canvas'); c.width = c.height = size
          const g = c.getContext('2d')!, d = g.createImageData(size, size)
          const H = (i: number, j: number) => h(((i + size) % size) / size, ((j + size) % size) / size)
          for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
            const dx = (H(i + 1, j) - H(i - 1, j)) * k, dy = (H(i, j + 1) - H(i, j - 1)) * k, l = Math.hypot(dx, dy, 1), o = (j * size + i) * 4
            d.data[o] = (-dx / l * 0.5 + 0.5) * 255; d.data[o + 1] = (-dy / l * 0.5 + 0.5) * 255; d.data[o + 2] = (0.5 / l + 0.5) * 255; d.data[o + 3] = 255
          }
          g.putImageData(d, 0, 0)
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t
        }
        const TAU = Math.PI * 2
        const waves: [number, number, number][] = [[3, 1, 0], [2, 5, 1.3], [7, 3, 2.1], [11, 9, 0.7], [17, 5, 2.9]]
        const waterN = normalTex(256, (u, v) => waves.reduce((s, [a, b, f]) => s + Math.sin(TAU * (a * u + b * v) + f), 0) / 5, 5, 1)
        const weaveN = normalTex(256, (u, v) => Math.sin(u * TAU * 56) * Math.sin(v * TAU * 56) + 0.4 * Math.sin(u * TAU * 7 + v * TAU * 3), 1.4, 1)
        const groundN = normalTex(256, (u, v) => Math.sin(u * TAU * 13 + Math.sin(v * TAU * 5)) * Math.cos(v * TAU * 17) + 0.5 * Math.sin((u + v) * TAU * 31), 2.2, 10)

        // sky, sun, image-based lighting
        const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(78), THREE.MathUtils.degToRad(35))
        const sky = new Sky(); sky.scale.setScalar(10000)
        const su = (sky.material as any).uniforms
        su.turbidity.value = 6; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8; su.sunPosition.value.copy(sun)
        const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(sky)
        const envRT = pm.fromScene(envScene); scene.add(sky); scene.environment = envRT.texture

        const light = new THREE.DirectionalLight(0xfff0d6, 3.4)
        light.position.copy(sun).multiplyScalar(30).add(new THREE.Vector3(3.4, 0, -1.5)); light.target.position.set(3.4, 1, -1.5)
        light.castShadow = true; light.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048)
        Object.assign(light.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 80 }); light.shadow.bias = -0.0004; light.shadow.normalBias = 0.03
        scene.add(light, light.target)

        const water = new Water(new THREE.PlaneGeometry(4000, 4000), { textureWidth: 512, textureHeight: 512, waterNormals: waterN, sunDirection: sun.clone(), sunColor: 0xffffff, waterColor: 0x07263d, distortionScale: 2.4, size: 4, fog: true })
        water.rotation.x = -Math.PI / 2; scene.add(water)

        // island
        const R = 5.2
        const hAt = (x: number, z: number) => { const a = Math.atan2(z, x), r = Math.hypot(x, z) + Math.sin(a * 3 + 1) * 0.5 + Math.sin(a * 5 + 2) * 0.3 + Math.sin(a * 9) * 0.1; return 1.7 * Math.pow(Math.max(0, 1 - r / R), 0.9) - 0.3 + 0.12 * Math.sin(x * 2.3) * Math.sin(z * 2.1) }
        const isle = new THREE.Group(); isle.position.set(3.4, 0, -1.5); scene.add(isle)
        const gg = new THREE.PlaneGeometry(14, 14, 110, 110); gg.rotateX(-Math.PI / 2)
        const gp = gg.attributes.position, col = new Float32Array(gp.count * 3), c = new THREE.Color(), rnd = prng(7)
        for (let i = 0; i < gp.count; i++) {
          const x = gp.getX(i), z = gp.getZ(i), h = hAt(x, z); gp.setY(i, h)
          const n = 0.5 + 0.5 * Math.sin(x * 3.1) * Math.sin(z * 2.7)
          if (h < 0.12) c.setHex(0x8f8268).lerp(new THREE.Color(0x5c554a), n * 0.5)
          else if (h < 0.4) c.setHex(0x8f8268).lerp(new THREE.Color(0x3d5f33), (h - 0.12) / 0.28)
          else c.setHex(0x3d5f33).lerp(new THREE.Color(0x56733c), n)
          if (h > 1.1) c.lerp(new THREE.Color(0x7c7a73), Math.min(1, (h - 1.1) * 2))
          col.set([c.r, c.g, c.b], i * 3)
        }
        gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); gg.computeVertexNormals()
        const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, normalMap: groundN, normalScale: new THREE.Vector2(1.3, 1.3) }))
        ground.receiveShadow = true; ground.castShadow = true; isle.add(ground)

        // pine forest (instanced)
        const spots: [number, number, number, number][] = []
        for (let n = 0; n < 600 && spots.length < 55; n++) {
          const x = (rnd() - 0.5) * 11, z = (rnd() - 0.5) * 11, h = hAt(x, z)
          if (h > 0.22 && Math.hypot(x, z) > 1.3) spots.push([x, h, z, 0.8 + rnd() * 0.9])
        }
        const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.07, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 }), spots.length)
        const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 1.25, 9).translate(0, 0.62, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 }), spots.length * 3)
        const o = new THREE.Object3D()
        spots.forEach(([x, h, z, s], i) => {
          o.position.set(x, h - 0.05, z); o.scale.set(s, s * 1.5, s); o.rotation.set(0, 0, 0); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix)
          for (let L = 0; L < 3; L++) {
            const k = 1 - L * 0.25; o.position.set(x, h + s * (0.6 + L * 0.62), z); o.scale.set(s * k, s, s * k); o.rotation.y = rnd() * 6; o.updateMatrix()
            cones.setMatrixAt(i * 3 + L, o.matrix); cones.setColorAt(i * 3 + L, new THREE.Color().setHSL(0.36 + rnd() * 0.04, 0.45, 0.14 + rnd() * 0.07))
          }
        })
        for (const m of [trunk, cones]) { m.castShadow = true; m.receiveShadow = true; isle.add(m) }

        // pole + flag
        const top0 = hAt(0, 0) - 0.1, PH = 6, FW = 3.4, FH = FW / 1.669
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, PH, 16), new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.28 }))
        pole.position.set(0, top0 + PH / 2, 0); pole.castShadow = true
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.25 }))
        finial.position.set(0, top0 + PH + 0.08, 0); finial.castShadow = true
        const fg = new THREE.PlaneGeometry(FW, FH, 64, 38); fg.translate(FW / 2 + 0.05, 0, 0)
        const tex = new THREE.TextureLoader().load('/flag.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        const cloth = new THREE.Mesh(fg, new THREE.MeshPhysicalMaterial({ map: tex, normalMap: weaveN, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.82, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide }))
        cloth.position.set(0, top0 + PH - 0.25 - FH / 2, 0); cloth.castShadow = true; cloth.receiveShadow = true
        isle.add(pole, finial, cloth)
        const fp = fg.attributes.position, base = (fp.array as Float32Array).slice()
        const wave = (t: number) => {
          for (let i = 0; i < fp.count; i++) {
            const x = base[i * 3], y = base[i * 3 + 1], k = Math.max(0, (x - 0.05) / FW), ph = x * 3.2 - t * 3.4 + y * 1.1
            fp.setXYZ(i, x - 0.05 * k * (1 + Math.cos(ph)), y - 0.06 * k * k, (0.03 + 0.4 * k * k) * Math.sin(ph) + 0.12 * k * Math.sin(x * 6.5 - t * 5.1 - y * 2) + 0.06 * k * Math.sin(t * 1.3 + y * 2.2))
          }
          fp.needsUpdate = true; fg.computeVertexNormals()
        }

        const clock = new THREE.Clock(); let raf = 0
        const draw = () => {
          const t = clock.getElapsedTime(); wave(t); (water.material as any).uniforms.time.value = t * 0.35
          camera.position.set(2 + Math.sin(t * 0.1) * 1.3, 3.1 + Math.sin(t * 0.07) * 0.3, 13.5); camera.lookAt(3.4, 3.6, -1.5)
          renderer.render(scene, camera)
        }
        const loop = () => { draw(); raf = requestAnimationFrame(loop) }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(); else loop()
        const ro = new ResizeObserver(() => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); if (!raf) draw() })
        ro.observe(el)
        stop = () => { cancelAnimationFrame(raf); ro.disconnect(); envRT.dispose(); pm.dispose(); renderer.dispose(); renderer.domElement.remove() }
        if (dead) stop()
      } catch (e) { console.warn('3D background unavailable', e) }
    })()
    return () => { dead = true; stop() }
  }, [])

  return (
    <>
      <div ref={host} aria-hidden className="fixed inset-0 z-0 bg-[#0B1320]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
    </>
  )
}
