import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

out vec4 fragColor;

const float E = 2.71828182845904523536;

float noise(vec2 texCoord) {
  vec2 r = E * sin(E * texCoord);
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c) * uv;
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  vec2 centeredUv = (uv - 0.5) * 2.0;
  centeredUv.x *= uResolution.x / max(uResolution.y, 1.0);

  float rnd = noise(gl_FragCoord.xy);
  vec2 rotatedUv = rotateUvs(centeredUv * uScale, uRotation);
  vec2 tex = rotatedUv * uScale;
  float tOffset = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
    0.4 * sin(
      5.0 * (
        tex.x + tex.y +
        cos(3.0 * tex.x + 5.0 * tex.y) +
        0.02 * tOffset
      ) +
      sin(20.0 * (tex.x + tex.y - 0.1 * tOffset))
    );

  vec3 col = uColor * pattern - (rnd / 15.0) * uNoiseIntensity;
  fragColor = vec4(col, 1.0);
}
`;

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

export default function Silk({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}: SilkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<SilkProps>({
    speed,
    scale,
    color,
    noiseIntensity,
    rotation,
  });

  propsRef.current = { speed, scale, color, noiseIntensity, rotation };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.backgroundColor = "transparent";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const parsedColor = new Color(color);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uResolution: { value: [container.offsetWidth || 1, container.offsetHeight || 1] },
        uTime: { value: 0 },
        uColor: { value: [parsedColor.r, parsedColor.g, parsedColor.b] },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uRotation: { value: rotation },
        uNoiseIntensity: { value: noiseIntensity },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    const resize = () => {
      const width = container.offsetWidth || 1;
      const height = container.offsetHeight || 1;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    let frameId = 0;
    const render = (time: number) => {
      const current = propsRef.current;
      const currentColor = new Color(current.color ?? "#7B7481");

      program.uniforms.uTime.value = time * 0.001;
      program.uniforms.uSpeed.value = current.speed ?? 5;
      program.uniforms.uScale.value = current.scale ?? 1;
      program.uniforms.uRotation.value = current.rotation ?? 0;
      program.uniforms.uNoiseIntensity.value = current.noiseIntensity ?? 1.5;
      program.uniforms.uColor.value = [currentColor.r, currentColor.g, currentColor.b];

      renderer.render({ scene: mesh });
      frameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, noiseIntensity, rotation, scale, speed]);

  return <div ref={containerRef} className="h-full w-full" />;
}
