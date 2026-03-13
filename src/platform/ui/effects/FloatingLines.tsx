import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;

uniform int enableTop;
uniform int enableMiddle;
uniform int enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform int interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform int parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

out vec4 fragColor;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0, 75.0, 162.0) / 255.0;

mat2 rotate2d(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 backgroundColor(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  if (lineGradientCount == 1) {
    return lineGradient[0] * 0.5;
  }

  float clampedT = clamp(t, 0.0, 0.9999);
  float scaled = clampedT * float(lineGradientCount - 1);
  int idx = int(floor(scaled));
  float f = fract(scaled);
  int idx2 = min(idx + 1, lineGradientCount - 1);
  return mix(lineGradient[idx], lineGradient[idx2], f) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float xOffset = offset;
  float xMovement = time * 0.1;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + xOffset + xMovement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / max(iResolution.y, 1.0);
  baseUv.y *= -1.0;

  if (parallax > 0) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);
  vec3 base = lineGradientCount > 0 ? vec3(0.0) : backgroundColor(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive > 0) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / max(iResolution.y, 1.0);
    mouseUv.y *= -1.0;
  }

  if (enableBottom > 0) {
    for (int i = 0; i < 32; ++i) {
      if (i >= bottomLineCount) break;
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, base);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate2d(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive > 0
      ) * 0.2;
    }
  }

  if (enableMiddle > 0) {
    for (int i = 0; i < 32; ++i) {
      if (i >= middleLineCount) break;
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, base);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate2d(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive > 0
      );
    }
  }

  if (enableTop > 0) {
    for (int i = 0; i < 32; ++i) {
      if (i >= topLineCount) break;
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, base);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate2d(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive > 0
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}
`;

const MAX_GRADIENT_STOPS = 8;

type WavePosition = {
  x: number;
  y: number;
  rotate: number;
};

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Array<"top" | "middle" | "bottom">;
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
};

function hexToVec3(hex: string): [number, number, number] {
  let value = hex.trim();
  if (value.startsWith("#")) {
    value = value.slice(1);
  }

  let r = 255;
  let g = 255;
  let b = 255;

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }

  return [r / 255, g / 255, b / 255];
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<FloatingLinesProps>({
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
    mixBlendMode,
  });
  const targetMouseRef = useRef({ x: -1000, y: -1000 });
  const currentMouseRef = useRef({ x: -1000, y: -1000 });
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef({ x: 0, y: 0 });
  const currentParallaxRef = useRef({ x: 0, y: 0 });

  propsRef.current = {
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
    mixBlendMode,
  };

  const getLineCount = (waves: Array<"top" | "middle" | "bottom">, counts: number | number[], waveType: "top" | "middle" | "bottom"): number => {
    if (typeof counts === "number") return counts;
    if (!waves.includes(waveType)) return 0;
    const index = waves.indexOf(waveType);
    return counts[index] ?? 6;
  };

  const getLineDistance = (
    waves: Array<"top" | "middle" | "bottom">,
    distances: number | number[],
    waveType: "top" | "middle" | "bottom",
  ): number => {
    if (typeof distances === "number") return distances;
    if (!waves.includes(waveType)) return 0.1;
    const index = waves.indexOf(waveType);
    return distances[index] ?? 0.1;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: false,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [1, 1, 1] },
        animationSpeed: { value: animationSpeed },
        enableTop: { value: 1 },
        enableMiddle: { value: 1 },
        enableBottom: { value: 1 },
        topLineCount: { value: 6 },
        middleLineCount: { value: 6 },
        bottomLineCount: { value: 6 },
        topLineDistance: { value: 0.01 },
        middleLineDistance: { value: 0.01 },
        bottomLineDistance: { value: 0.01 },
        topWavePosition: { value: [10, 0.5, -0.4] },
        middleWavePosition: { value: [5, 0, 0.2] },
        bottomWavePosition: { value: [2, -0.7, 0.4] },
        iMouse: { value: [-1000, -1000] },
        interactive: { value: interactive ? 1 : 0 },
        bendRadius: { value: bendRadius },
        bendStrength: { value: bendStrength },
        bendInfluence: { value: 0 },
        parallax: { value: parallax ? 1 : 0 },
        parallaxStrength: { value: parallaxStrength },
        parallaxOffset: { value: [0, 0] },
        lineGradient: { value: Array.from({ length: MAX_GRADIENT_STOPS }, () => [1, 1, 1]) },
        lineGradientCount: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      program.uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height, 1];
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
      const rect = gl.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dpr = Math.max(gl.canvas.width / Math.max(rect.width, 1), 1);

      targetMouseRef.current = { x: x * dpr, y: (rect.height - y) * dpr };
      targetInfluenceRef.current = 1;

      if (propsRef.current.parallax) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (x - centerX) / Math.max(rect.width, 1);
        const offsetY = -(y - centerY) / Math.max(rect.height, 1);
        targetParallaxRef.current = {
          x: offsetX * (propsRef.current.parallaxStrength ?? 0.2),
          y: offsetY * (propsRef.current.parallaxStrength ?? 0.2),
        };
      }
    };

    const handlePointerLeave = () => {
      targetInfluenceRef.current = 0;
    };

    gl.canvas.addEventListener("pointermove", handlePointerMove);
    gl.canvas.addEventListener("pointerleave", handlePointerLeave);

    let frameId = 0;
    const render = (time: number) => {
      const current = propsRef.current;
      const waves = current.enabledWaves ?? ["top", "middle", "bottom"];
      const counts = current.lineCount ?? [6];
      const distances = current.lineDistance ?? [5];

      const topCount = waves.includes("top") ? getLineCount(waves, counts, "top") : 0;
      const middleCount = waves.includes("middle") ? getLineCount(waves, counts, "middle") : 0;
      const bottomCount = waves.includes("bottom") ? getLineCount(waves, counts, "bottom") : 0;

      const topDistance = waves.includes("top") ? getLineDistance(waves, distances, "top") * 0.01 : 0.01;
      const middleDistance = waves.includes("middle") ? getLineDistance(waves, distances, "middle") * 0.01 : 0.01;
      const bottomDistance = waves.includes("bottom") ? getLineDistance(waves, distances, "bottom") * 0.01 : 0.01;

      currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * (current.mouseDamping ?? 0.05);
      currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * (current.mouseDamping ?? 0.05);
      currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * (current.mouseDamping ?? 0.05);
      currentParallaxRef.current.x += (targetParallaxRef.current.x - currentParallaxRef.current.x) * (current.mouseDamping ?? 0.05);
      currentParallaxRef.current.y += (targetParallaxRef.current.y - currentParallaxRef.current.y) * (current.mouseDamping ?? 0.05);

      const stops = (current.linesGradient ?? []).slice(0, MAX_GRADIENT_STOPS).map(hexToVec3);
      const paddedStops = Array.from({ length: MAX_GRADIENT_STOPS }, (_, index) => stops[index] ?? [1, 1, 1]);

      program.uniforms.iTime.value = time * 0.001;
      program.uniforms.animationSpeed.value = current.animationSpeed ?? 1;
      program.uniforms.enableTop.value = waves.includes("top") ? 1 : 0;
      program.uniforms.enableMiddle.value = waves.includes("middle") ? 1 : 0;
      program.uniforms.enableBottom.value = waves.includes("bottom") ? 1 : 0;
      program.uniforms.topLineCount.value = topCount;
      program.uniforms.middleLineCount.value = middleCount;
      program.uniforms.bottomLineCount.value = bottomCount;
      program.uniforms.topLineDistance.value = topDistance;
      program.uniforms.middleLineDistance.value = middleDistance;
      program.uniforms.bottomLineDistance.value = bottomDistance;
      program.uniforms.topWavePosition.value = [
        current.topWavePosition?.x ?? 10,
        current.topWavePosition?.y ?? 0.5,
        current.topWavePosition?.rotate ?? -0.4,
      ];
      program.uniforms.middleWavePosition.value = [
        current.middleWavePosition?.x ?? 5,
        current.middleWavePosition?.y ?? 0,
        current.middleWavePosition?.rotate ?? 0.2,
      ];
      program.uniforms.bottomWavePosition.value = [
        current.bottomWavePosition?.x ?? 2,
        current.bottomWavePosition?.y ?? -0.7,
        current.bottomWavePosition?.rotate ?? 0.4,
      ];
      program.uniforms.iMouse.value = [currentMouseRef.current.x, currentMouseRef.current.y];
      program.uniforms.interactive.value = current.interactive ? 1 : 0;
      program.uniforms.bendRadius.value = current.bendRadius ?? 5;
      program.uniforms.bendStrength.value = current.bendStrength ?? -0.5;
      program.uniforms.bendInfluence.value = currentInfluenceRef.current;
      program.uniforms.parallax.value = current.parallax ? 1 : 0;
      program.uniforms.parallaxStrength.value = current.parallaxStrength ?? 0.2;
      program.uniforms.parallaxOffset.value = [currentParallaxRef.current.x, currentParallaxRef.current.y];
      program.uniforms.lineGradient.value = paddedStops;
      program.uniforms.lineGradientCount.value = stops.length;

      renderer.render({ scene: mesh });
      frameId = requestAnimationFrame(render);
    };

    resize();
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      gl.canvas.removeEventListener("pointermove", handlePointerMove);
      gl.canvas.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [animationSpeed, bendRadius, bendStrength, bottomWavePosition, enabledWaves, interactive, lineCount, lineDistance, linesGradient, middleWavePosition, mixBlendMode, mouseDamping, parallax, parallaxStrength, topWavePosition]);

  return (
    <div
      ref={containerRef}
      className="floating-lines-container relative h-full w-full overflow-hidden"
      style={{ mixBlendMode }}
    />
  );
}
