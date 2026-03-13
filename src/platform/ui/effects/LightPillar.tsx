import React, { useEffect, useRef, useState } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  interactive?: boolean;
  className?: string;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  pillarRotation?: number;
  quality?: "low" | "medium" | "high";
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const buildFragmentShader = (iterations: number, waveIterations: number, stepMultiplier: number) => `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uIntensity;
uniform int uInteractive;
uniform float uGlowAmount;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform float uNoiseIntensity;
uniform float uRotCos;
uniform float uRotSin;
uniform float uPillarRotCos;
uniform float uPillarRotSin;
uniform float uWaveSin[4];
uniform float uWaveCos[4];

out vec4 fragColor;

const float PI = 3.141592653589793;
const float EPSILON = 0.001;
const float E = 2.71828182845904523536;

float noise(vec2 coord) {
  vec2 r = E * sin(E * coord);
  return fract(r.x * r.y * (1.0 + coord.x));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = (fragCoord * 2.0 - uResolution) / max(uResolution.y, 1.0);

  uv = vec2(
    uv.x * uPillarRotCos - uv.y * uPillarRotSin,
    uv.x * uPillarRotSin + uv.y * uPillarRotCos
  );

  vec3 origin = vec3(0.0, 0.0, -10.0);
  vec3 direction = normalize(vec3(uv, 1.0));

  float maxDepth = 50.0;
  float depth = 0.1;

  float rotCos = uRotCos;
  float rotSin = uRotSin;
  if (uInteractive > 0 && length(uMouse) > 0.0) {
    float mouseAngle = uMouse.x * PI * 2.0;
    rotCos = cos(mouseAngle);
    rotSin = sin(mouseAngle);
  }

  vec3 color = vec3(0.0);
  const int ITERATIONS = ${iterations};
  const int WAVE_ITERATIONS = ${waveIterations};
  const float STEP_MULT = ${stepMultiplier.toFixed(1)};

  for (int i = 0; i < ITERATIONS; i++) {
    vec3 pos = origin + direction * depth;

    float newX = pos.x * rotCos - pos.z * rotSin;
    float newZ = pos.x * rotSin + pos.z * rotCos;
    pos.x = newX;
    pos.z = newZ;

    vec3 deformed = pos;
    deformed.y *= uPillarHeight;
    deformed += vec3(0.0, uTime, 0.0);

    float frequency = 1.0;
    float amplitude = 1.0;
    for (int j = 0; j < WAVE_ITERATIONS; j++) {
      float wx = deformed.x * uWaveCos[j] - deformed.z * uWaveSin[j];
      float wz = deformed.x * uWaveSin[j] + deformed.z * uWaveCos[j];
      deformed.x = wx;
      deformed.z = wz;

      float phase = uTime * float(j) * 2.0;
      vec3 oscillation = cos(deformed.zxy * frequency - phase);
      deformed += oscillation * amplitude;
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    vec2 cosinePair = cos(deformed.xz);
    float fieldDistance = length(cosinePair) - 0.2;

    float radialBound = length(pos.xz) - uPillarWidth;
    float k = 4.0;
    float h = max(k - abs(-radialBound - (-fieldDistance)), 0.0);
    fieldDistance = -(min(-radialBound, -fieldDistance) - h * h * 0.25 / k);
    fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

    vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
    color += gradient / fieldDistance;

    if (fieldDistance < EPSILON || depth > maxDepth) break;
    depth += fieldDistance * STEP_MULT;
  }

  float widthNormalization = uPillarWidth / 3.0;
  color = tanh(color * uGlowAmount / widthNormalization);

  float rnd = noise(gl_FragCoord.xy);
  color -= rnd / 15.0 * uNoiseIntensity;

  fragColor = vec4(color * uIntensity, 1.0);
}
`;

const parseColor = (hex: string): [number, number, number] => {
  const color = new Color(hex);
  return [color.r, color.g, color.b];
};

const LightPillar: React.FC<LightPillarProps> = ({
  topColor = "#5227FF",
  bottomColor = "#FF9FFC",
  intensity = 1.0,
  rotationSpeed = 0.3,
  interactive = false,
  className = "",
  glowAmount = 0.005,
  pillarWidth = 3.0,
  pillarHeight = 0.4,
  noiseIntensity = 0.5,
  mixBlendMode = "screen",
  pillarRotation = 0,
  quality = "high",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<LightPillarProps>({
    topColor,
    bottomColor,
    intensity,
    rotationSpeed,
    interactive,
    className,
    glowAmount,
    pillarWidth,
    pillarHeight,
    noiseIntensity,
    mixBlendMode,
    pillarRotation,
    quality,
  });
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const [webGLSupported, setWebGLSupported] = useState(true);

  propsRef.current = {
    topColor,
    bottomColor,
    intensity,
    rotationSpeed,
    interactive,
    className,
    glowAmount,
    pillarWidth,
    pillarHeight,
    noiseIntensity,
    mixBlendMode,
    pillarRotation,
    quality,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webGLSupported) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    let effectiveQuality = quality;
    if (isLowEndDevice && quality === "high") effectiveQuality = "medium";
    if (isMobile && quality !== "low") effectiveQuality = "low";

    const qualitySettings = {
      low: { iterations: 24, waveIterations: 1, dpr: 0.5, stepMultiplier: 1.5 },
      medium: { iterations: 40, waveIterations: 2, dpr: 0.65, stepMultiplier: 1.2 },
      high: { iterations: 80, waveIterations: 4, dpr: Math.min(window.devicePixelRatio, 2), stepMultiplier: 1.0 },
    } as const;

    const settings = qualitySettings[effectiveQuality];
    let renderer: Renderer;

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        dpr: settings.dpr,
        powerPreference: effectiveQuality === "low" ? "low-power" : "high-performance",
        depth: false,
        stencil: false,
      });
    } catch (error) {
      console.error("Failed to create WebGL renderer:", error);
      setWebGLSupported(false);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const waveAngle = 0.4;
    const waveSinValues = Array.from({ length: 4 }, () => Math.sin(waveAngle));
    const waveCosValues = Array.from({ length: 4 }, () => Math.cos(waveAngle));
    const pillarRotRad = (pillarRotation * Math.PI) / 180;

    const program = new Program(gl, {
      vertex: VERT,
      fragment: buildFragmentShader(settings.iterations, settings.waveIterations, settings.stepMultiplier),
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uMouse: { value: [0, 0] },
        uTopColor: { value: parseColor(topColor) },
        uBottomColor: { value: parseColor(bottomColor) },
        uIntensity: { value: intensity },
        uInteractive: { value: interactive ? 1 : 0 },
        uGlowAmount: { value: glowAmount },
        uPillarWidth: { value: pillarWidth },
        uPillarHeight: { value: pillarHeight },
        uNoiseIntensity: { value: noiseIntensity },
        uRotCos: { value: 1 },
        uRotSin: { value: 0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: waveSinValues },
        uWaveCos: { value: waveCosValues },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });

    let resizeTimeout: number | null = null;
    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    resize();
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    let mouseMoveTimeout: number | null = null;
    const handleMouseMove = (event: MouseEvent) => {
      if (!propsRef.current.interactive) return;
      if (mouseMoveTimeout) return;

      mouseMoveTimeout = window.setTimeout(() => {
        mouseMoveTimeout = null;
      }, 16);

      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      mouseRef.current = { x, y };
    };

    if (interactive) {
      container.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    let lastTime = performance.now();
    const targetFPS = effectiveQuality === "low" ? 30 : 60;
    const frameTime = 1000 / targetFPS;
    let frameId = 0;

    const animate = (currentTime: number) => {
      const current = propsRef.current;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        timeRef.current += 0.016 * (current.rotationSpeed ?? 0.3);
        const rotAngle = timeRef.current * 0.3;
        const pillarAngle = ((current.pillarRotation ?? 0) * Math.PI) / 180;

        program.uniforms.uTime.value = timeRef.current;
        program.uniforms.uMouse.value = [mouseRef.current.x, mouseRef.current.y];
        program.uniforms.uTopColor.value = parseColor(current.topColor ?? "#5227FF");
        program.uniforms.uBottomColor.value = parseColor(current.bottomColor ?? "#FF9FFC");
        program.uniforms.uIntensity.value = current.intensity ?? 1;
        program.uniforms.uInteractive.value = current.interactive ? 1 : 0;
        program.uniforms.uGlowAmount.value = current.glowAmount ?? 0.005;
        program.uniforms.uPillarWidth.value = current.pillarWidth ?? 3;
        program.uniforms.uPillarHeight.value = current.pillarHeight ?? 0.4;
        program.uniforms.uNoiseIntensity.value = current.noiseIntensity ?? 0.5;
        program.uniforms.uRotCos.value = Math.cos(rotAngle);
        program.uniforms.uRotSin.value = Math.sin(rotAngle);
        program.uniforms.uPillarRotCos.value = Math.cos(pillarAngle);
        program.uniforms.uPillarRotSin.value = Math.sin(pillarAngle);

        renderer.render({ scene: mesh });
        lastTime = currentTime - (deltaTime % frameTime);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
      cancelAnimationFrame(frameId);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    bottomColor,
    glowAmount,
    intensity,
    interactive,
    noiseIntensity,
    pillarHeight,
    pillarRotation,
    pillarWidth,
    quality,
    rotationSpeed,
    topColor,
    webGLSupported,
  ]);

  if (!webGLSupported) {
    return (
      <div
        className={`absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/10 text-sm text-gray-500 ${className}`}
        style={{ mixBlendMode }}
      >
        WebGL not supported
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute left-0 top-0 h-full w-full ${className}`}
      style={{ mixBlendMode }}
    />
  );
};

export default LightPillar;
