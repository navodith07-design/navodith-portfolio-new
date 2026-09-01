import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 1.6;
    float waveFactor = uEnableWaves * 0.18;

    vec3 transformed = position;
    // Gentle organic breathing wave that maintains complete letter legibility
    transformed.x += sin(time + position.y * 0.5) * 0.12 * waveFactor;
    transformed.y += cos(time + position.x * 0.5) * 0.06 * waveFactor;
    transformed.z += sin(time * 0.8 + position.x * 0.8) * 0.18 * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    vec2 pos = vUv;
    vec4 texColor = texture2D(uTexture, pos);
    gl_FragColor = texColor;
}
`;

function mapRange(n: number, start: number, stop: number, start2: number, stop2: number): number {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

interface AsciiFilterOptions {
  fontSize?: number;
  fontFamily?: string;
  charset?: string;
  invert?: boolean;
}

class AsciiFilter {
  renderer: THREE.WebGLRenderer;
  domElement: HTMLDivElement;
  pre: HTMLPreElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  deg: number;
  invert: boolean;
  fontSize: number;
  fontFamily: string;
  charset: string;
  width = 0;
  height = 0;
  cols = 0;
  rows = 0;
  center = { x: 0, y: 0 };
  mouse = { x: 0, y: 0 };

  constructor(renderer: THREE.WebGLRenderer, { fontSize, fontFamily, charset, invert }: AsciiFilterOptions = {}) {
    this.renderer = renderer;
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.overflow = 'hidden';
    this.domElement.style.display = 'flex';
    this.domElement.style.alignItems = 'center';
    this.domElement.style.justifyContent = 'center';

    this.pre = document.createElement('pre');
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert ?? false;
    this.fontSize = fontSize ?? 5;
    this.fontFamily = fontFamily ?? "'IBM Plex Mono', 'Courier New', monospace";
    // Calibrated high-clarity density ramp with solid core blocks
    this.charset = charset ?? '  ..::--==++**##%%██';

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();

    this.center = { x: width / 2, y: height / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  reset() {
    if (!this.context) return;

    // High density grid calculation for razor-sharp letter definition
    // For smaller screens, font size scales down gracefully so glyph count remains high
    const responsiveFontSize = Math.max(4.2, Math.min(this.fontSize, Math.floor(this.width / 130)));
    this.context.font = `600 ${responsiveFontSize}px ${this.fontFamily}`;
    const charWidth = this.context.measureText('M').width || responsiveFontSize * 0.6;

    this.cols = Math.max(20, Math.floor(this.width / charWidth));
    this.rows = Math.max(15, Math.floor(this.height / responsiveFontSize));

    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.pre.style.fontFamily = this.fontFamily;
    this.pre.style.fontSize = `${responsiveFontSize}px`;
    this.pre.style.margin = '0';
    this.pre.style.padding = '0';
    this.pre.style.lineHeight = '1.0em';
    this.pre.style.letterSpacing = '0px';
    this.pre.style.position = 'absolute';
    this.pre.style.left = '50%';
    this.pre.style.top = '50%';
    this.pre.style.transform = 'translate(-50%, -50%)';
    this.pre.style.zIndex = '9';
    this.pre.style.pointerEvents = 'none';
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);

    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.context && w && h) {
      this.context.clearRect(0, 0, w, h);
      this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
      this.asciify(this.context, w, h);
    }
  }

  onMouseMove(e: MouseEvent) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
  }

  get dx() {
    return this.mouse.x - this.center.x;
  }

  get dy() {
    return this.mouse.y - this.center.y;
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (w && h) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let str = '';
      const len = this.charset.length;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (x + y * w) * 4;
          const [r, g, b, a] = [imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3]];

          if (a < 20) {
            str += ' ';
            continue;
          }

          // Perceived luminance calculation
          const luminance = ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * (a / 255);
          
          // Enhanced gamma threshold for solid letter strokes
          const gamma = Math.pow(luminance, 0.6);
          let idx = Math.floor(gamma * (len - 1));
          if (this.invert) idx = len - 1 - idx;
          idx = Math.max(0, Math.min(len - 1, idx));
          str += this.charset[idx];
        }
        str += '\n';
      }
      this.pre.textContent = str;
    }
  }

  dispose() {
    document.removeEventListener('mousemove', this.onMouseMove);
  }
}

class CanvasTxt {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  txt: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  font: string;
  lines: string[] = [];

  constructor(txt: string, { fontSize = 240, fontFamily = '"Space Grotesk", system-ui, sans-serif', color = '#ffffff' } = {}) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.txt = txt;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.color = color;
    this.font = `900 ${this.fontSize}px ${this.fontFamily}`;
  }

  resize(containerWidth?: number) {
    if (!this.context) return;
    this.context.font = this.font;

    // Automatic wrap for narrow viewports to guarantee complete text visibility
    if (containerWidth && containerWidth < 768 && this.txt.includes(' ')) {
      const words = this.txt.split(' ');
      const mid = Math.ceil(words.length / 2);
      this.lines = [
        words.slice(0, mid).join(' '),
        words.slice(mid).join(' ')
      ];
    } else {
      this.lines = [this.txt];
    }

    let maxLineWidth = 0;
    for (const line of this.lines) {
      const m = this.context.measureText(line);
      if (m.width > maxLineWidth) maxLineWidth = m.width;
    }

    const textWidth = Math.ceil(maxLineWidth) + 100;
    const lineHeight = this.fontSize * 1.16;
    const textHeight = Math.ceil(this.lines.length * lineHeight) + 100;

    this.canvas.width = Math.max(textWidth, 160);
    this.canvas.height = Math.max(textHeight, 100);
  }

  render() {
    if (!this.context) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.color;
    this.context.font = this.font;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';

    const lineHeight = this.fontSize * 1.16;
    const startY = (this.canvas.height - (this.lines.length - 1) * lineHeight) / 2;

    this.lines.forEach((line, index) => {
      this.context!.fillText(line, this.canvas.width / 2, startY + index * lineHeight);
    });
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get texture() {
    return this.canvas;
  }
}

interface CanvAsciiConfig {
  text: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  enableWaves: boolean;
}

class CanvAscii {
  textString: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  container: HTMLElement;
  width: number;
  height: number;
  enableWaves: boolean;

  planeW = 0;
  planeH = 0;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  renderer!: THREE.WebGLRenderer;
  filter!: AsciiFilter;
  textCanvas!: CanvasTxt;
  texture!: THREE.CanvasTexture;
  geometry!: THREE.PlaneGeometry;
  material!: THREE.ShaderMaterial;
  mesh!: THREE.Mesh;
  animationFrameId = 0;

  mouse: { x: number; y: number };
  center: { x: number; y: number } = { x: 0, y: 0 };

  constructor(
    config: CanvAsciiConfig,
    containerElem: HTMLElement,
    width: number,
    height: number
  ) {
    this.textString = config.text;
    this.asciiFontSize = config.asciiFontSize;
    this.textFontSize = config.textFontSize;
    this.textColor = config.textColor;
    this.planeBaseHeight = config.planeBaseHeight;
    this.container = containerElem;
    this.width = width;
    this.height = height;
    this.enableWaves = config.enableWaves;

    this.camera = new THREE.PerspectiveCamera(45, Math.max(this.width / Math.max(this.height, 1), 0.1), 1, 1000);
    this.camera.position.z = 30;

    this.scene = new THREE.Scene();
    this.mouse = { x: this.width / 2, y: this.height / 2 };

    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async init() {
    try {
      if (document.fonts) {
        await Promise.race([
          Promise.all([
            document.fonts.load('900 240px "Space Grotesk"'),
            document.fonts.load('600 12px "IBM Plex Mono"')
          ]),
          new Promise((resolve) => setTimeout(resolve, 800))
        ]);
        await document.fonts.ready;
      }
    } catch {
      // Font loading fallback
    }

    this.setMesh();
    this.setRenderer();
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: this.textColor
    });
    this.textCanvas.resize(this.width);
    this.textCanvas.render();

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    const textAspect = Math.max(this.textCanvas.width / Math.max(this.textCanvas.height, 1), 0.1);
    this.planeH = this.planeBaseHeight;
    this.planeW = this.planeH * textAspect;

    this.geometry = new THREE.PlaneGeometry(this.planeW, this.planeH, 48, 48);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 }
      }
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: this.asciiFontSize,
      invert: false
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(this.width, this.height);

    this.container.addEventListener('mousemove', this.onMouseMove, { passive: true });
    this.container.addEventListener('touchmove', this.onMouseMove, { passive: true });
  }

  setSize(w: number, h: number) {
    this.width = Math.max(w, 100);
    this.height = Math.max(h, 60);

    // Re-render text on texture with appropriate wrap and aspect ratio
    if (this.textCanvas) {
      this.textCanvas.resize(this.width);
      this.textCanvas.render();
      if (this.texture) {
        this.texture.needsUpdate = true;
      }

      // Update plane geometry dimensions
      const textAspect = Math.max(this.textCanvas.width / Math.max(this.textCanvas.height, 1), 0.1);
      this.planeH = this.planeBaseHeight;
      this.planeW = this.planeH * textAspect;

      if (this.geometry) {
        this.geometry.dispose();
      }
      this.geometry = new THREE.PlaneGeometry(this.planeW, this.planeH, 48, 48);
      if (this.mesh) {
        this.mesh.geometry = this.geometry;
      }
    }

    this.camera.aspect = this.width / this.height;

    // Dynamically adjust camera distance so the 3D text plane fits entirely within view with generous margins
    if (this.planeW > 0 && this.planeH > 0) {
      const vFovRad = (this.camera.fov * Math.PI) / 180;
      const visibleHeightAtDist1 = 2 * Math.tan(vFovRad / 2);
      const visibleWidthAtDist1 = visibleHeightAtDist1 * this.camera.aspect;

      // Safe bounds ensure no cutoff across all mobile, tablet, and desktop ratios
      const zForWidth = this.planeW / (visibleWidthAtDist1 * 0.80);
      const zForHeight = this.planeH / (visibleHeightAtDist1 * 0.74);
      this.camera.position.z = Math.max(zForWidth, zForHeight, 18);
    }

    this.camera.updateProjectionMatrix();

    this.filter.setSize(this.width, this.height);
    this.center = { x: this.width / 2, y: this.height / 2 };
  }

  load() {
    this.animate();
  }

  onMouseMove(evt: MouseEvent | TouchEvent) {
    const e = 'touches' in evt && evt.touches.length > 0 ? evt.touches[0] : (evt as MouseEvent);
    const bounds = this.container.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    this.mouse = { x, y };
  }

  animate() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame);
      this.render();
    };
    animateFrame();
  }

  render() {
    const time = new Date().getTime() * 0.001;

    this.textCanvas.render();
    this.texture.needsUpdate = true;

    if (this.mesh && this.mesh.material) {
      const mat = this.mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = Math.sin(time);
      }
    }

    this.updateRotation();
    if (this.filter) {
      this.filter.render(this.scene, this.camera);
    }
  }

  updateRotation() {
    if (!this.mesh) return;
    const x = mapRange(this.mouse.y, 0, this.height, 0.28, -0.28);
    const y = mapRange(this.mouse.x, 0, this.width, -0.28, 0.28);

    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.06;
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.06;
  }

  clear() {
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      }
    });
    this.scene.clear();
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.filter) {
      this.filter.dispose();
      if (this.filter.domElement && this.filter.domElement.parentNode) {
        this.container.removeChild(this.filter.domElement);
      }
    }
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('touchmove', this.onMouseMove);
    this.clear();
    if (this.texture) {
      this.texture.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}

export interface ASCIITextProps {
  text?: string;
  asciiFontSize?: number;
  textFontSize?: number;
  textColor?: string;
  planeBaseHeight?: number;
  enableWaves?: boolean;
  className?: string;
}

export default function ASCIIText({
  text = 'LET\'S CRAFT THE FUTURE',
  asciiFontSize = 5.2,
  textFontSize = 240,
  textColor = '#ffffff',
  planeBaseHeight = 8,
  enableWaves = true,
  className = ''
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<CanvAscii | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    const createAndInit = async (container: HTMLElement, w: number, h: number) => {
      const instance = new CanvAscii(
        { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
        container,
        w,
        h
      );
      await instance.init();
      return instance;
    };

    const setup = async () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      if (width === 0 || height === 0) {
        observer = new IntersectionObserver(
          async ([entry]) => {
            if (cancelled || !containerRef.current) return;
            if (entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0) {
              const { width: w, height: h } = entry.boundingClientRect;
              observer?.disconnect();
              observer = null;

              if (!cancelled && containerRef.current) {
                asciiRef.current = await createAndInit(containerRef.current, w, h);
                if (!cancelled && asciiRef.current) {
                  asciiRef.current.load();
                }
              }
            }
          },
          { threshold: 0.05 }
        );
        observer.observe(containerRef.current);
        return;
      }

      asciiRef.current = await createAndInit(containerRef.current, width, height);
      if (!cancelled && asciiRef.current) {
        asciiRef.current.load();

        ro = new ResizeObserver((entries) => {
          if (!entries[0] || !asciiRef.current) return;
          const { width: w, height: h } = entries[0].contentRect;
          if (w > 0 && h > 0) {
            asciiRef.current.setSize(w, h);
          }
        });
        if (containerRef.current) {
          ro.observe(containerRef.current);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (ro) ro.disconnect();
      if (asciiRef.current) {
        asciiRef.current.dispose();
        asciiRef.current = null;
      }
    };
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves]);

  return (
    <div
      ref={containerRef}
      className={`ascii-text-container relative w-full h-full min-h-[180px] overflow-hidden select-none ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=Space+Grotesk:wght@700;800;900&display=swap');

        .ascii-text-container canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        .ascii-text-container pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1.0em;
          letter-spacing: 0px;
          text-align: center;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 40%, #e2e8f0 75%, #cbd5e1 100%);
          background-attachment: fixed;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.35);
          font-weight: 700;
          z-index: 9;
          white-space: pre;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
