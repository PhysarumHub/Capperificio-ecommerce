export const cylinderVertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cylinderFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uDarkness;

  varying vec2 vUv;

  void main() {
    // Face culling is disabled so the cylinder is visible from inside too
    // (the scroll camera flies through it). Without this, the backface
    // shows the same UVs as the front and the baked-in text reads mirrored.
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(tMap, uv);
    tex.rgb *= (1.0 - uDarkness);
    gl_FragColor = tex;
  }
`;

export const particleVertex = /* glsl */ `
  attribute vec3 position;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const particleFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;
