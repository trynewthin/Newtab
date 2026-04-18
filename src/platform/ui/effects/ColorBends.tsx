import React, { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

type ColorBendsProps = {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
};

const MAX_COLORS = 8 as const;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

#define MAX_COLORS ${MAX_COLORS}

uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;

out vec4 fragColor;

void main() {
  float t = uTime * uSpeed;
  vec2 vUv = gl_FragCoord.xy / max(uCanvas, vec2(1.0));
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / max(uCanvas.y, 1.0)), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-6.0 / exp(6.0 * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-6.0 / exp(6.0 * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = uTransparent > 0 ? col * a : col;
  fragColor = vec4(rgb, a);
}
`;

const parseColor = (input: string): [number, number, number] => {
  const parsed = new Color("#000000");
  try {
    parsed.set(input);
  } catch {
    parsed.set("#000000");
  }
  return [parsed.r, parsed.g, parsed.b];
};

export default function ColorBends({
  className,
  style,
  color = "",
  rotation = 45,
  speed = 0.2,
  colors = [],
  transparent = true,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.1,
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<ColorBendsProps>({
    className,
    style,
    color,
    rotation,
    speed,
    colors,
    transparent,
    autoRotate,
    scale,
    frequency,
    warpStrength,
    mouseInfluence,
    parallax,
    noise,
  });
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    propsRef.current = {
      className,
      style,
      color,
      rotation,
      speed,
      colors,
      transparent,
      autoRotate,
      scale,
      frequency,
      warpStrength,
      mouseInfluence,
      parallax,
      noise,
    };
  }, [autoRotate, className, color, colors, frequency, mouseInfluence, noise, parallax, rotation, scale, speed, style, transparent, warpStrength]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const emptyColors = Array.from({ length: MAX_COLORS }, () => [0, 0, 0]);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCanvas: { value: [1, 1] },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uRot: { value: [1, 0] },
        uColorCount: { value: 0 },
        uColors: { value: emptyColors },
        uTransparent: { value: transparent ? 1 : 0 },
        uScale: { value: scale },
        uFrequency: { value: frequency },
        uWarpStrength: { value: warpStrength },
        uPointer: { value: [0, 0] },
        uMouseInfluence: { value: mouseInfluence },
        uParallax: { value: parallax },
        uNoise: { value: noise },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    const setClearState = () => {
      const current = propsRef.current;
      gl.clearColor(0, 0, 0, current.transparent ? 0 : 1);
    };

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      program.uniforms.uCanvas.value = [width, height];
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
          })
        : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      const y = -(((event.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
      pointerTargetRef.current = { x, y };
    };

    container.addEventListener("pointermove", handlePointerMove);

    let previousTime = performance.now();
    let frameId = 0;
    const render = (time: number) => {
      const current = propsRef.current;
      const dt = Math.max(0.001, (time - previousTime) / 1000);
      previousTime = time;

      const elapsed = time * 0.001;
      const degrees = (current.rotation ?? 45) + (current.autoRotate ?? 0) * elapsed;
      const radians = (degrees * Math.PI) / 180;
      const target = pointerTargetRef.current;
      const currentPointer = pointerCurrentRef.current;
      const lerpAmount = Math.min(1, dt * 8);

      currentPointer.x += (target.x - currentPointer.x) * lerpAmount;
      currentPointer.y += (target.y - currentPointer.y) * lerpAmount;

      program.uniforms.uTime.value = elapsed;
      program.uniforms.uSpeed.value = current.speed ?? 0.2;
      program.uniforms.uRot.value = [Math.cos(radians), Math.sin(radians)];
      program.uniforms.uTransparent.value = current.transparent ? 1 : 0;
      program.uniforms.uScale.value = current.scale ?? 1;
      program.uniforms.uFrequency.value = current.frequency ?? 1;
      program.uniforms.uWarpStrength.value = current.warpStrength ?? 1;
      program.uniforms.uPointer.value = [currentPointer.x, currentPointer.y];
      program.uniforms.uMouseInfluence.value = current.mouseInfluence ?? 1;
      program.uniforms.uParallax.value = current.parallax ?? 0.5;
      program.uniforms.uNoise.value = current.noise ?? 0.1;

      const stops = (current.colors ?? []).filter(Boolean).slice(0, MAX_COLORS).map(parseColor);
      const paddedStops = Array.from({ length: MAX_COLORS }, (_, index) => stops[index] ?? [0, 0, 0]);
      program.uniforms.uColorCount.value = stops.length;
      program.uniforms.uColors.value = paddedStops;

      setClearState();
      renderer.render({ scene: mesh });
      frameId = requestAnimationFrame(render);
    };

    resize();
    setClearState();
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", handlePointerMove);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [autoRotate, color, colors, frequency, mouseInfluence, noise, parallax, rotation, scale, speed, transparent, warpStrength]);

  const mergedStyle: React.CSSProperties = { ...(style ?? {}) };
  if (color) {
    mergedStyle.backgroundColor = color;
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className ?? ""}`}
      style={mergedStyle}
    />
  );
}
