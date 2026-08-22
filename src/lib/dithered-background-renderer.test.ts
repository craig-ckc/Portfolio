import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DitheredBackgroundRenderer,
  getCappedCanvasSize,
  shouldUploadVideoFrame,
} from './dithered-background-renderer'

afterEach(() => {
  vi.unstubAllGlobals()
})

function createReusableWebGlCanvas() {
  let contextLost = false
  const object = () => ({})
  const gl = {
    ARRAY_BUFFER: 0x8892,
    CLAMP_TO_EDGE: 0x812f,
    COMPILE_STATUS: 0x8b81,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    LINEAR: 0x2601,
    LINK_STATUS: 0x8b82,
    RGBA: 0x1908,
    STATIC_DRAW: 0x88e4,
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TRIANGLES: 0x0004,
    UNSIGNED_BYTE: 0x1401,
    VERTEX_SHADER: 0x8b31,
    activeTexture: vi.fn(),
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    bindTexture: vi.fn(),
    bufferData: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: object,
    createProgram: object,
    createShader: object,
    createTexture: object,
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteTexture: vi.fn(),
    detachShader: vi.fn(),
    drawArrays: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getExtension: vi.fn(() => ({ loseContext: () => (contextLost = true) })),
    getProgramInfoLog: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: object,
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    texImage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texParameteri: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    uniform4fv: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  }
  const canvas = {
    getBoundingClientRect: () => ({ width: 100, height: 50 }),
    getContext: () => (contextLost ? null : gl),
    height: 50,
    width: 100,
  }

  return canvas as unknown as HTMLCanvasElement
}

function createInspectableCanvas() {
  let contextLost = false
  const object = () => ({})
  const gl = {
    ARRAY_BUFFER: 0x8892,
    CLAMP_TO_EDGE: 0x812f,
    COMPILE_STATUS: 0x8b81,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    LINEAR: 0x2601,
    LINK_STATUS: 0x8b82,
    RGBA: 0x1908,
    STATIC_DRAW: 0x88e4,
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TRIANGLES: 0x0004,
    UNSIGNED_BYTE: 0x1401,
    VERTEX_SHADER: 0x8b31,
    activeTexture: vi.fn(),
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    bindTexture: vi.fn(),
    bufferData: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: object,
    createProgram: object,
    createShader: object,
    createTexture: object,
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteTexture: vi.fn(),
    detachShader: vi.fn(),
    drawArrays: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getExtension: vi.fn(() => ({ loseContext: () => (contextLost = true) })),
    getProgramInfoLog: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: object,
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    texImage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texParameteri: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    uniform4fv: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  }
  const canvas = {
    getBoundingClientRect: () => ({ width: 100, height: 50 }),
    getContext: () => (contextLost ? null : gl),
    height: 50,
    width: 100,
  }

  return {
    canvas: canvas as unknown as HTMLCanvasElement,
    gl,
  }
}

describe('getCappedCanvasSize', () => {
  it('keeps a canvas below the pixel budget while preserving its aspect ratio', () => {
    expect(getCappedCanvasSize(1000, 500, 2, 1_000_000)).toEqual({
      width: 1414,
      height: 707,
      pixelRatio: 1.414,
    })
  })

  it('does not upscale beyond the requested device pixel ratio', () => {
    expect(getCappedCanvasSize(400, 200, 2, 1_000_000)).toEqual({
      width: 800,
      height: 400,
      pixelRatio: 2,
    })
  })

  it('never crosses the maximum pixel count after integer rounding', () => {
    const size = getCappedCanvasSize(1344, 742.546_813_964_843_8, 1, 1280 * 720)

    expect(size.width * size.height).toBeLessThanOrEqual(1280 * 720)
  })

  it('returns a safe minimum for a temporarily collapsed container', () => {
    expect(getCappedCanvasSize(0, 0, 2, 1_000_000)).toEqual({
      width: 1,
      height: 1,
      pixelRatio: 1,
    })
  })
})

describe('shouldUploadVideoFrame', () => {
  it('uploads only decoded frames whose media time has advanced', () => {
    expect(shouldUploadVideoFrame(2, 1.25, 1)).toBe(true)
    expect(shouldUploadVideoFrame(2, 1.25, 1.25)).toBe(false)
    expect(shouldUploadVideoFrame(1, 1.25, 1)).toBe(false)
  })
})

describe('DitheredBackgroundRenderer lifecycle', () => {
  it('can remount on the same canvas after React StrictMode cleanup', () => {
    class ResizeObserverStub {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('window', { devicePixelRatio: 1 })
    const canvas = createReusableWebGlCanvas()
    const options = {
      colorBack: '#090a0a',
      colorFront: '#2c2c2c',
      colorHighlight: '#434242',
    }

    const firstMount = new DitheredBackgroundRenderer(canvas, options)
    firstMount.dispose()

    expect(() => new DitheredBackgroundRenderer(canvas, options)).not.toThrow()
  })
})

describe('DitheredBackgroundRenderer image path', () => {
  it('uploads a still image as the WebGL texture and redraws', () => {
    class ResizeObserverStub {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('window', { devicePixelRatio: 1 })
    const { canvas, gl } = createInspectableCanvas()
    const renderer = new DitheredBackgroundRenderer(canvas, {
      colorBack: '#00000000',
      colorFront: '#1F1F1F',
      colorHighlight: '#313131',
    })

    const image = { naturalWidth: 640, naturalHeight: 400 } as HTMLImageElement
    const drawsBefore = gl.drawArrays.mock.calls.length
    renderer.setImage(image)

    expect(gl.texImage2D).toHaveBeenCalled()
    expect(gl.drawArrays.mock.calls.length).toBeGreaterThan(drawsBefore)

    renderer.dispose()
  })

  it('ignores images with no decoded size', () => {
    class ResizeObserverStub {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('window', { devicePixelRatio: 1 })
    const { canvas, gl } = createInspectableCanvas()
    const renderer = new DitheredBackgroundRenderer(canvas, {
      colorBack: '#00000000',
      colorFront: '#1F1F1F',
      colorHighlight: '#313131',
    })

    const before = gl.texImage2D.mock.calls.length
    renderer.setImage({ naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement)
    expect(gl.texImage2D.mock.calls.length).toBe(before)

    renderer.dispose()
  })

  it('reuses the texture allocation when the same image size is uploaded twice', () => {
    class ResizeObserverStub {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('window', { devicePixelRatio: 1 })
    const { canvas, gl } = createInspectableCanvas()
    const renderer = new DitheredBackgroundRenderer(canvas, {
      colorBack: '#00000000',
      colorFront: '#1F1F1F',
      colorHighlight: '#313131',
    })

    const image = { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement
    renderer.setImage(image)
    const afterFirst = gl.texImage2D.mock.calls.length
    const subBefore = gl.texSubImage2D.mock.calls.length

    renderer.setImage(image)

    expect(gl.texImage2D.mock.calls.length).toBe(afterFirst)
    expect(gl.texSubImage2D.mock.calls.length).toBeGreaterThan(subBefore)

    renderer.dispose()
  })

  it('does nothing after dispose', () => {
    class ResizeObserverStub {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('window', { devicePixelRatio: 1 })
    const { canvas, gl } = createInspectableCanvas()
    const renderer = new DitheredBackgroundRenderer(canvas, {
      colorBack: '#00000000',
      colorFront: '#1F1F1F',
      colorHighlight: '#313131',
    })
    renderer.dispose()

    const before = gl.texImage2D.mock.calls.length
    renderer.setImage({ naturalWidth: 300, naturalHeight: 200 } as HTMLImageElement)
    expect(gl.texImage2D.mock.calls.length).toBe(before)
  })
})
