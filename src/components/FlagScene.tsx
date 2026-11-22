import { useEffect, useRef } from 'react'

export function FlagScene() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let dead = false, raf = 0, cleanup = () => {}
    ;(async () => {
      try {
        const THREE = await import('three')
        const { Sky } = await import('three/addons/objects/Sky.js')
        const el = host.current
        if (dead || !el) return

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
        renderer.setSize(el.clientWidth, el.clientHeight)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.6
        renderer.shadowMap.enabled = true
        el.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 2000)
        camera.position.set(0, 2.4, 9)
        camera.lookAt(1.2, 2.6, 0)

        // Realistic sky, also used as image-based lighting
        const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(70), THREE.MathUtils.degToRad(150))
        const sky = new Sky()
        sky.scale.setScalar(1000)
        const u = (sky.material as any).uniforms
        u.turbidity.value = 4
        u.rayleigh.value = 1.2
        u.mieCoefficient.value = 0.003
        u.mieDirectionalG.value = 0.8
        u.sunPosition.value.copy(sun)
        scene.add(sky)
        const pmrem = new THREE.PMREMGenerator(renderer)
        const envRT = pmrem.fromScene(scene, 0, 0.1, 1000)
        scene.environment = envRT.texture

        const sunLight = new THREE.DirectionalLight(0xfff1dc, 2.8)
        sunLight.position.copy(sun).multiplyScalar(20)
        sunLight.castShadow = true
        sunLight.shadow.mapSize.set(2048, 2048)
        Object.assign(sunLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 60 })
        sunLight.shadow.bias = -0.0005
        scene.add(sunLight)

        // Grass ground
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x3d5f33, roughness: 0.95 })
        )
        ground.receiveShadow = true
        scene.add(ground)

        // Polished metal pole
        const FW = 3.2, FH = FW / 1.669, PH = 5.5
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, PH, 16),
          new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.3 })
        )
        pole.position.y = PH / 2
        pole.castShadow = true
        scene.add(pole)

        // Waving flag
        const fg = new THREE.PlaneGeometry(FW, FH, 48, 24)
        fg.translate(FW / 2, 0, 0)
        const tex = new THREE.TextureLoader().load('/flag.png')
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        const cloth = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }))
        cloth.position.set(0.05, PH - 0.4 - FH / 2, 0)
        cloth.castShadow = true
        scene.add(cloth)

        const pos = fg.attributes.position
        const base = (pos.array as Float32Array).slice()
        const wave = (t: number) => {
          for (let i = 0; i < pos.count; i++) {
            const x = base[i * 3], y = base[i * 3 + 1]
            const k = x / FW, ph = x * 3 - t * 3
            pos.setX(i, x - 0.06 * k * (1 + Math.cos(ph)))
            pos.setZ(i, k * k * 0.35 * Math.sin(ph) + 0.08 * k * Math.sin(x * 7 - t * 4 - y * 2))
          }
          pos.needsUpdate = true
          fg.computeVertexNormals()
        }

        const clock = new THREE.Clock()
        const draw = () => {
          const t = clock.getElapsedTime()
          wave(t)
          camera.position.x = Math.sin(t * 0.1) * 0.8
          camera.lookAt(1.2, 2.6, 0)
          renderer.render(scene, camera)
        }
        const loop = () => { draw(); raf = requestAnimationFrame(loop) }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(); else loop()

        const ro = new ResizeObserver(() => {
          renderer.setSize(el.clientWidth, el.clientHeight)
          camera.aspect = el.clientWidth / el.clientHeight
          camera.updateProjectionMatrix()
        })
        ro.observe(el)

        cleanup = () => {
          cancelAnimationFrame(raf); ro.disconnect(); envRT.dispose(); pmrem.dispose()
          renderer.dispose(); renderer.domElement.remove()
        }
      } catch (e) {
        console.warn('3D background unavailable', e)
      }
    })()
    return () => { dead = true; cleanup() }
  }, [])

  return (
    <>
      <div ref={host} aria-hidden className="fixed inset-0 z-0 bg-[#0B1320]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
    </>
  )
}
