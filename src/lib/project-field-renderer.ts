import * as THREE from 'three'
import { FieldDrag } from './project-field-drag'
import { buildFieldLayout, fieldPosition, hitField, nearestFieldTile, wrap, type FieldImage, type FieldLayout } from './project-field-layout'
import { advanceFieldPan } from './project-field-motion'
import { normalizeFieldSettings, type ProjectFieldSettings } from './project-field-settings'

export type ProjectFieldController = {
  focus: (image: number) => void
  setSettings: (settings: Readonly<ProjectFieldSettings>) => void
  dispose: () => void
}

const tileVertex = `
  attribute vec2 aOrigin;
  attribute vec2 aSize;
  uniform vec2 uPan;
  uniform vec2 uPeriod;
  uniform float uSize;
  uniform float uRadius;
  uniform vec3 uScale;
  varying vec2 vUv;
  varying vec2 vSize;
  void main() {
    vec2 center = mod(aOrigin + uPan + uPeriod * .5, uPeriod) - uPeriod * .5;
    float radius = length(center) * 2. / uSize / uRadius;
    float scale = uScale.x + (uScale.y - uScale.x) * pow(1. - smoothstep(0., 1.08, radius), uScale.z * 2.);
    vUv = uv;
    vSize = aSize * scale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(center + position.xy * vSize, 0., 1.);
  }
`
const tileFragment = `
  uniform sampler2D uImage;
  varying vec2 vUv;
  varying vec2 vSize;
  void main() {
    vec2 d = abs(vUv - .5) * vSize - vSize * .5 + 4.;
    float distance = length(max(d, 0.)) + min(max(d.x, d.y), 0.) - 4.;
    float alpha = 1. - smoothstep(-.75, .75, distance);
    vec4 image = texture2D(uImage, vUv);
    alpha *= image.a;
    gl_FragColor = vec4(image.rgb * alpha, alpha);
  }
`
const screenVertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`
// Two separable, variable-radius Gaussian passes. Filtering premultiplied color
// keeps transparent image edges clean; all masks are composed on the GPU too.
const blur = `
  uniform sampler2D uImage;
  uniform vec2 uStep;
  uniform float uRadius;
  uniform float uBlurStart;
  uniform float uBlurFalloff;
  varying vec2 vUv;
  vec4 edgeBlur() {
    float radius = length((vUv - .5) * 2.) / uRadius;
    vec2 step = uStep * pow(smoothstep(uBlurStart, .94, radius), uBlurFalloff);
    vec4 color = vec4(0.);
    float total = 0.;
    for (int i = -6; i <= 6; i++) {
      float weight = exp(-float(i * i) / 12.5);
      color += texture2D(uImage, vUv + step * float(i)) * weight;
      total += weight;
    }
    return color / total;
  }
`
const compositeFragment = `${blur}
  uniform float uOuterFade;
  uniform float uMiddleFade;
  uniform float uMiddleStrength;
  uniform float uInnerFade;
  uniform float uInnerStrength;
  uniform float uMaskOffset;
  void main() {
    vec2 p = (vUv - .5) * 2. / uRadius;
    float outer = 1. - smoothstep(uOuterFade, 1., length(p));
    float middle = 1. - smoothstep(uMiddleFade, .98, length(p * vec2(1., .95) + vec2(uMaskOffset, -uMaskOffset * .5)));
    float inner = 1. - smoothstep(uInnerFade, 1.02, length(p * vec2(.98, 1.03) + vec2(-uMaskOffset, uMaskOffset * 2. / 3.)));
    float mask = outer * mix(1., middle, uMiddleStrength) * mix(1., inner, uInnerStrength);
    vec4 color = edgeBlur();
    gl_FragColor = vec4(color.rgb / max(color.a, .00001), color.a * mask);
    #include <colorspace_fragment>
    gl_FragColor.rgb *= gl_FragColor.a;
  }
`

export async function createProjectField(
  root: HTMLDivElement,
  surface: HTMLDivElement,
  link: HTMLAnchorElement,
  images: readonly FieldImage[],
  initialSettings: Readonly<ProjectFieldSettings>,
  signal: AbortSignal,
  onContextLost: () => void,
): Promise<ProjectFieldController> {
  let settings = normalizeFieldSettings(initialSettings)
  const loaded = await Promise.allSettled(images.map(async (image) => {
    const texture = await new THREE.TextureLoader().loadAsync(image.src)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }))
  const textures = loaded.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
  if (signal.aborted || textures.length !== images.length) {
    textures.forEach((texture) => texture.dispose())
    throw new Error('Project field images unavailable')
  }
  // Decode the actual source dimensions rather than cropping to a gallery preset.
  const sources = images.map((image, index) => ({
    ...image,
    width: textures[index].image.naturalWidth || image.width,
    height: textures[index].image.naturalHeight || image.height,
  }))
  const resources: { dispose: () => void }[] = [...textures]
  const cleanups: (() => void)[] = []
  let frame = 0
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    cleanups.reverse().forEach((cleanup) => cleanup())
    resources.reverse().forEach((resource) => resource.dispose())
  }
  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
    resources.push(renderer)
    renderer.setClearColor(0, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    surface.prepend(renderer.domElement)
    cleanups.push(() => renderer.domElement.remove())
    const events = new AbortController()
    cleanups.push(() => events.abort())
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      dispose()
      onContextLost()
    }, { signal: events.signal })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10)
    camera.position.z = 1
    const pan = { x: 0, y: 0, vx: 0, vy: 0 }
    const direction = { x: -2 / Math.sqrt(5), y: 1 / Math.sqrt(5) }
    if (settings.autoDrift) { pan.vx = direction.x * settings.driftSpeed / 1000; pan.vy = direction.y * settings.driftSpeed / 1000 }
    const shared = {
      uPan: { value: new THREE.Vector2() }, uPeriod: { value: new THREE.Vector2() }, uSize: { value: 1 },
      uRadius: { value: settings.radius },
      uScale: { value: new THREE.Vector3(settings.edgeScale, settings.centerScale, settings.scaleFalloff) },
    }
    const postSettings = {
      uRadius: shared.uRadius,
      uBlurStart: { value: settings.blurStart }, uBlurFalloff: { value: settings.blurFalloff },
      uOuterFade: { value: settings.outerFade },
      uMiddleFade: { value: settings.middleFade }, uMiddleStrength: { value: settings.middleStrength },
      uInnerFade: { value: settings.innerFade }, uInnerStrength: { value: settings.innerStrength },
      uMaskOffset: { value: settings.maskOffset },
    }
    const meshes = textures.map((texture) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: tileVertex, fragmentShader: tileFragment,
        uniforms: { ...shared, uImage: { value: texture } },
        transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
      })
      resources.push(material)
      const mesh = new THREE.Mesh(new THREE.InstancedBufferGeometry(), material)
      mesh.frustumCulled = false
      scene.add(mesh)
      return mesh
    })
    cleanups.push(() => meshes.forEach((mesh) => mesh.geometry.dispose()))
    const sharp = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })
    const soft = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })
    resources.push(sharp, soft)
    const screen = new THREE.PlaneGeometry(2, 2)
    const horizontal = new THREE.ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: `${blur}\nvoid main() { gl_FragColor = edgeBlur(); }`,
      uniforms: { ...postSettings, uImage: { value: sharp.texture }, uStep: { value: new THREE.Vector2() } },
      depthTest: false, depthWrite: false,
    })
    const composite = new THREE.ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: compositeFragment,
      uniforms: { ...postSettings, uImage: { value: soft.texture }, uStep: { value: new THREE.Vector2() } },
      transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    })
    resources.push(screen, horizontal, composite)
    const post = new THREE.Scene()
    const pass = new THREE.Mesh(screen, horizontal)
    post.add(pass)
    let layout: FieldLayout = buildFieldLayout(sources, 1, settings)
    let visible = true
    let previous = performance.now()
    let pointer: { x: number; y: number } | null = null
    let drag: FieldDrag | null = null
    let positioned = false
    let suppressClick = false
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let hovered = -1
    const coordinates = (event: MouseEvent) => {
      const rect = surface.getBoundingClientRect()
      return { x: event.clientX - rect.left - rect.width / 2, y: rect.height / 2 - event.clientY + rect.top }
    }
    function updateLink() {
      const hit = pointer ? hitField(layout, pan, pointer.x, pointer.y) : undefined
      const image = hit?.image ?? -1
      if (image === hovered) return
      hovered = image
      if (hit) {
        link.href = images[image].href
        link.title = images[image].title
        link.dataset.project = images[image].title
      } else {
        link.removeAttribute('href')
        link.removeAttribute('title')
        delete link.dataset.project
      }
      link.style.cursor = drag ? 'grabbing' : hit ? 'pointer' : 'grab'
    }
    function invalidate() {
      if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw)
    }
    function draw(now: number) {
      frame = 0
      if (disposed) return
      const dt = Math.max(0, Math.min(now - previous, 64))
      previous = now
      const drifting = settings.autoDrift && settings.driftSpeed > 0 && !motion.matches
      if (motion.matches) pan.vx = pan.vy = 0
      else if (!drag?.moved) {
        const speed = !drag && drifting ? settings.driftSpeed / 1000 : 0
        advanceFieldPan(pan, dt, settings.inertia, { x: direction.x * speed, y: direction.y * speed }, !!drag)
      }
      pan.x = wrap(pan.x, layout.periodX)
      pan.y = wrap(pan.y, layout.periodY)
      shared.uPan.value.set(pan.x, pan.y)
      renderer.setRenderTarget(sharp)
      renderer.render(scene, camera)
      pass.material = horizontal
      renderer.setRenderTarget(soft)
      renderer.render(post, camera)
      pass.material = composite
      renderer.setRenderTarget(null)
      renderer.render(post, camera)
      if (!drag) updateLink()
      if (!motion.matches && !drag?.moved && (drifting || Math.abs(pan.vx) + Math.abs(pan.vy) > .002)) invalidate()
    }
    function updateUniforms() {
      shared.uRadius.value = settings.radius
      shared.uScale.value.set(settings.edgeScale, settings.centerScale, settings.scaleFalloff)
      postSettings.uBlurStart.value = settings.blurStart
      postSettings.uBlurFalloff.value = settings.blurFalloff
      postSettings.uOuterFade.value = settings.outerFade
      postSettings.uMiddleFade.value = settings.middleFade
      postSettings.uMiddleStrength.value = settings.middleStrength
      postSettings.uInnerFade.value = settings.innerFade
      postSettings.uInnerStrength.value = settings.innerStrength
      postSettings.uMaskOffset.value = settings.maskOffset
      horizontal.uniforms.uStep.value.set(settings.edgeBlur / 2.5 / layout.size, 0)
      composite.uniforms.uStep.value.set(0, settings.edgeBlur / 2.5 / layout.size)
    }
    function resize() {
      const size = Math.min(surface.clientWidth, surface.clientHeight)
      if (!size) return
      const focus = positioned ? nearestFieldTile(layout, pan) : undefined
      const focusOffset = focus ? fieldPosition(focus, layout, pan) : undefined
      const previousSize = layout.size
      const normalizedX = pan.x / layout.size
      const normalizedY = pan.y / layout.size
      layout = buildFieldLayout(sources, size, settings)
      pan.x = normalizedX * size
      pan.y = normalizedY * size
      // Keep the same project nearest the center after a resize or a spacing
      // edit, and start with one centered project before the first paint.
      const nearest = nearestFieldTile(layout, pan, focus?.image)
      if (nearest) {
        const offset = fieldPosition(nearest, layout, pan)
        pan.x += (focusOffset ? focusOffset.x / previousSize * size : 0) - offset.x
        pan.y += (focusOffset ? focusOffset.y / previousSize * size : 0) - offset.y
      }
      positioned = true
      const dpr = Math.min(devicePixelRatio, 1.75, 1600 / size)
      renderer.setPixelRatio(dpr)
      renderer.setSize(size, size, false)
      sharp.setSize(Math.round(size * dpr), Math.round(size * dpr))
      soft.setSize(Math.round(size * dpr), Math.round(size * dpr))
      updateUniforms()
      camera.left = camera.bottom = -size / 2
      camera.right = camera.top = size / 2
      camera.updateProjectionMatrix()
      shared.uPeriod.value.set(layout.periodX, layout.periodY)
      shared.uSize.value = size
      meshes.forEach((mesh, index) => {
        const tiles = layout.tiles.filter((tile) => tile.image === index)
        const geometry = new THREE.InstancedBufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3))
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
        geometry.setIndex([0, 1, 2, 0, 2, 3])
        geometry.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(new Float32Array(tiles.flatMap((tile) => [tile.x, tile.y])), 2))
        geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(tiles.flatMap((tile) => [tile.width, tile.height])), 2))
        geometry.instanceCount = tiles.length
        mesh.geometry.dispose()
        mesh.geometry = geometry
      })
      invalidate()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    cleanups.push(() => observer.disconnect())
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) { previous = performance.now(); invalidate() }
      else { cancelAnimationFrame(frame); frame = 0 }
    })
    intersection.observe(root)
    cleanups.push(() => intersection.disconnect())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 }
      else { previous = performance.now(); invalidate() }
    }, { signal: events.signal })
    motion.addEventListener('change', invalidate, { signal: events.signal })
    link.addEventListener('pointerdown', (event) => {
      if (drag || event.button !== 0 || !event.isPrimary) return
      pointer = coordinates(event)
      suppressClick = false
      drag = new FieldDrag(event.pointerId, { x: event.clientX, y: event.clientY, time: event.timeStamp })
      updateLink()
      link.style.cursor = 'grabbing'
      // Window listeners below also cover browsers that lose capture when the
      // cursor crosses the canvas, controls, or viewport boundary.
      try { link.setPointerCapture(event.pointerId) } catch { /* The pointer may already have ended. */ }
      root.focus({ preventScroll: true })
      previous = performance.now()
      invalidate()
    }, { signal: events.signal })
    function moveDrag(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return
      const delta = drag.move({ x: event.clientX, y: event.clientY, time: event.timeStamp }, settings.dragSpeed)
      pan.x += delta.x
      pan.y += delta.y
      if (drag.moved) {
        const velocity = drag.velocity(event.timeStamp)
        pan.vx = velocity.x
        pan.vy = velocity.y
        const speed = Math.hypot(velocity.x, velocity.y)
        if (speed > .002) { direction.x = velocity.x / speed; direction.y = velocity.y / speed }
      }
    }
    function finishDrag(time: number) {
      if (!drag) return
      suppressClick = drag.moved
      if (drag.moved) {
        const velocity = drag.velocity(time)
        pan.vx = velocity.x
        pan.vy = velocity.y
        const speed = Math.hypot(velocity.x, velocity.y)
        if (speed > .002) { direction.x = velocity.x / speed; direction.y = velocity.y / speed }
      }
      drag = null
      // Preserve the originally pressed project for a click. A moving field
      // may have carried another tile under the cursor in the meantime.
      if (suppressClick) updateLink()
      link.style.cursor = hovered >= 0 ? 'pointer' : 'grab'
      previous = performance.now()
      invalidate()
    }
    window.addEventListener('pointermove', (event) => {
      if (drag) {
        if (event.pointerId !== drag.id) return
        pointer = coordinates(event)
        // A release outside the browser can arrive only as the next move.
        if (!(event.buttons & 1)) { finishDrag(event.timeStamp); return }
        for (const sample of event.getCoalescedEvents?.() ?? []) moveDrag(sample)
        moveDrag(event)
        invalidate()
      } else if (event.target === link) {
        pointer = coordinates(event)
        updateLink()
      }
    }, { signal: events.signal })
    window.addEventListener('pointerup', (event) => {
      if (!drag || event.pointerId !== drag.id || (event.buttons & 1)) return
      pointer = coordinates(event)
      moveDrag(event)
      finishDrag(event.timeStamp)
    }, { signal: events.signal })
    window.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== drag?.id) return
      finishDrag(event.timeStamp)
      suppressClick = true
    }, { signal: events.signal })
    link.addEventListener('lostpointercapture', (event) => {
      if (event.pointerId === drag?.id && !(event.buttons & 1)) finishDrag(event.timeStamp)
    }, { signal: events.signal })
    window.addEventListener('blur', () => {
      pointer = null
      finishDrag(performance.now())
    }, { signal: events.signal })
    link.addEventListener('pointerleave', () => { if (!drag) { pointer = null; updateLink() } }, { signal: events.signal })
    link.addEventListener('dragstart', (event) => event.preventDefault(), { signal: events.signal })
    link.addEventListener('click', (event) => {
      if (suppressClick || hovered < 0) event.preventDefault()
    }, { signal: events.signal })
    root.addEventListener('keydown', (event) => {
      if (event.target !== root || drag) return
      const vectors: Record<string, { x: number; y: number }> = { ArrowLeft: { x: 1, y: 0 }, ArrowRight: { x: -1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
      const vector = vectors[event.key]
      if (!vector) return
      event.preventDefault()
      direction.x = vector.x
      direction.y = vector.y
      pan.x += vector.x * 100
      pan.y += vector.y * 100
      pan.vx = vector.x * .15
      pan.vy = vector.y * .15
      invalidate()
    }, { signal: events.signal })
    resize()
    // Don't reveal a blank canvas and then compile/draw on the next frame.
    cancelAnimationFrame(frame)
    draw(performance.now())
    return {
      dispose,
      setSettings(nextSettings) {
        if (disposed) return
        const next = normalizeFieldSettings(nextSettings)
        const geometryChanged = next.imageSize !== settings.imageSize || next.spacing !== settings.spacing || next.centerScale !== settings.centerScale || next.edgeScale !== settings.edgeScale || next.scaleFalloff !== settings.scaleFalloff || next.radius !== settings.radius
        settings = next
        layout.settings = settings
        if (geometryChanged) resize()
        else { updateUniforms(); invalidate() }
      },
      focus(image) {
        const nearest = nearestFieldTile(layout, pan, image)
        if (nearest) {
          const offset = fieldPosition(nearest, layout, pan)
          pan.x -= offset.x
          pan.y -= offset.y
        }
        const speed = settings.autoDrift && !motion.matches ? settings.driftSpeed / 1000 : 0
        pan.vx = direction.x * speed
        pan.vy = direction.y * speed
        invalidate()
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
