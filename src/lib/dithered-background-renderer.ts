import {
  DitheringTypes,
  ShaderFitOptions,
  getShaderColorFromString,
  imageDitheringFragmentShader,
} from '@paper-design/shaders'

const VERTEX_SHADER = `#version 300 es
precision mediump float;
layout(location = 0) in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const FOOTER_SHADER_PIXEL_BUDGET = 1280 * 720

export interface CanvasSize {
  width: number
  height: number
  pixelRatio: number
}

export function getCappedCanvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  maxPixelCount: number,
): CanvasSize {
  if (cssWidth <= 0 || cssHeight <= 0) {
    return { width: 1, height: 1, pixelRatio: 1 }
  }

  const requestedRatio = Math.max(1, devicePixelRatio)
  const requestedWidth = cssWidth * requestedRatio
  const requestedHeight = cssHeight * requestedRatio
  const budgetScale = Math.min(
    1,
    Math.sqrt(maxPixelCount / (requestedWidth * requestedHeight)),
  )
  const pixelRatio = requestedRatio * budgetScale

  return {
    width: Math.max(1, Math.floor(cssWidth * pixelRatio)),
    height: Math.max(1, Math.floor(cssHeight * pixelRatio)),
    pixelRatio: Number(pixelRatio.toFixed(3)),
  }
}

export function shouldUploadVideoFrame(
  readyState: number,
  currentTime: number,
  lastUploadedTime: number,
): boolean {
  return readyState >= 2 && Math.abs(currentTime - lastUploadedTime) > 0.0001
}

type ShaderColor = [number, number, number, number]

export interface DitheredBackgroundRendererOptions {
  colorBack: string
  colorFront: string
  colorHighlight: string
  maxPixelCount?: number
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to create WebGL shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error'
    gl.deleteShader(shader)
    throw new Error(message)
  }

  return shader
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    imageDitheringFragmentShader,
  )
  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    throw new Error('Unable to create WebGL program')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.detachShader(program, vertexShader)
  gl.detachShader(program, fragmentShader)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown WebGL link error'
    gl.deleteProgram(program)
    throw new Error(message)
  }

  return program
}

/**
 * A small mount for Paper's Image Dithering fragment shader.
 * Paper's React component loads HTML images; this mount keeps the shader
 * unchanged and updates its sampler from decoded image or video frames instead.
 */
export class DitheredBackgroundRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly gl: WebGL2RenderingContext
  private readonly program: WebGLProgram
  private readonly positionBuffer: WebGLBuffer
  private readonly texture: WebGLTexture
  private readonly resizeObserver: ResizeObserver
  private readonly uniforms = new Map<string, WebGLUniformLocation | null>()
  private readonly maxPixelCount: number
  private disposed = false
  private imageAspectRatio = 16 / 9
  private lastUploadedVideoTime = -1
  private textureWidth = 0
  private textureHeight = 0
  private pixelRatio = 1

  constructor(canvas: HTMLCanvasElement, options: DitheredBackgroundRendererOptions) {
    this.canvas = canvas
    this.maxPixelCount = options.maxPixelCount ?? FOOTER_SHADER_PIXEL_BUDGET

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
      premultipliedAlpha: true,
    })
    if (!gl) throw new Error('WebGL2 is unavailable')
    this.gl = gl
    this.program = createProgram(gl)

    const positionBuffer = gl.createBuffer()
    const texture = gl.createTexture()
    if (!positionBuffer || !texture) {
      if (positionBuffer) gl.deleteBuffer(positionBuffer)
      if (texture) gl.deleteTexture(texture)
      gl.deleteProgram(this.program)
      throw new Error('Unable to allocate WebGL resources')
    }
    this.positionBuffer = positionBuffer
    this.texture = texture

    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([9, 10, 10, 255]),
    )
    this.textureWidth = 1
    this.textureHeight = 1

    this.setUniform1i('u_image', 0)
    this.setUniform1f('u_originX', 0.5)
    /* Top, not centre: the image is cropped to cover, and what is worth
       keeping of the footer's is its top edge, so the crop comes off the
       bottom. 0 is the top in Paper's sizing. */
    this.setUniform1f('u_originY', 0)
    this.setUniform1f('u_worldWidth', 0)
    this.setUniform1f('u_worldHeight', 0)
    this.setUniform1f('u_fit', ShaderFitOptions.cover)
    this.setUniform1f('u_scale', 1)
    this.setUniform1f('u_rotation', 0)
    this.setUniform1f('u_offsetX', 0)
    this.setUniform1f('u_offsetY', 0)
    this.setUniform4fv('u_colorBack', getShaderColorFromString(options.colorBack))
    this.setUniform4fv('u_colorFront', getShaderColorFromString(options.colorFront))
    this.setUniform4fv(
      'u_colorHighlight',
      getShaderColorFromString(options.colorHighlight),
    )
    this.setUniform1f('u_type', DitheringTypes['4x4'])
    this.setUniform1f('u_pxSize', 2.4)
    this.setUniform1f('u_colorSteps', 2)
    this.setUniform1i('u_originalColors', 0)
    this.setUniform1i('u_inverted', 0)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
  }

  setImage(image: HTMLImageElement): void {
    if (this.disposed || image.naturalWidth === 0 || image.naturalHeight === 0) return
    this.uploadSource(image, image.naturalWidth, image.naturalHeight)
  }

  uploadVideoFrame(video: HTMLVideoElement): boolean {
    if (
      this.disposed ||
      !shouldUploadVideoFrame(video.readyState, video.currentTime, this.lastUploadedVideoTime)
    ) {
      return false
    }

    this.uploadSource(video, video.videoWidth, video.videoHeight)
    this.lastUploadedVideoTime = video.currentTime
    return true
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.resizeObserver.disconnect()
    this.gl.deleteTexture(this.texture)
    this.gl.deleteBuffer(this.positionBuffer)
    this.gl.deleteProgram(this.program)
    this.uniforms.clear()
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.canvas.width = 1
    this.canvas.height = 1
  }

  private uploadSource(
    source: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
  ): void {
    if (width <= 0 || height <= 0) return

    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    if (this.textureWidth === width && this.textureHeight === height) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      )
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      )
      this.textureWidth = width
      this.textureHeight = height
    }
    this.imageAspectRatio = width / height
    this.render()
  }

  private resize(): void {
    if (this.disposed) return
    const { width: cssWidth, height: cssHeight } = this.canvas.getBoundingClientRect()
    const size = getCappedCanvasSize(
      cssWidth,
      cssHeight,
      Math.min(window.devicePixelRatio || 1, 2),
      this.maxPixelCount,
    )

    if (this.canvas.width !== size.width || this.canvas.height !== size.height) {
      this.canvas.width = size.width
      this.canvas.height = size.height
      this.pixelRatio = size.pixelRatio
      this.gl.viewport(0, 0, size.width, size.height)
    }
    this.render()
  }

  private render(): void {
    if (this.disposed) return
    const gl = this.gl
    gl.useProgram(this.program)
    this.setUniform2f('u_resolution', this.canvas.width, this.canvas.height)
    this.setUniform1f('u_pixelRatio', this.pixelRatio)
    this.setUniform1f('u_imageAspectRatio', this.imageAspectRatio)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private getUniform(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) {
      this.uniforms.set(name, this.gl.getUniformLocation(this.program, name))
    }
    return this.uniforms.get(name) ?? null
  }

  private setUniform1f(name: string, value: number): void {
    this.gl.uniform1f(this.getUniform(name), value)
  }

  private setUniform1i(name: string, value: number): void {
    this.gl.uniform1i(this.getUniform(name), value)
  }

  private setUniform2f(name: string, x: number, y: number): void {
    this.gl.uniform2f(this.getUniform(name), x, y)
  }

  private setUniform4fv(name: string, value: number[]): void {
    this.gl.uniform4fv(this.getUniform(name), value as ShaderColor)
  }
}
