import { Geometry, type OGLRenderingContext } from 'ogl';
import type { ImageConfig, ParticleConfig, ParticleUserData } from './types';

export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * Open cylinder (no top/bottom caps), built manually so the UVs map cleanly
 * onto a single horizontally-tiled texture atlas.
 */
export function createCylinderGeometry(
  gl: OGLRenderingContext,
  radius: number,
  height: number,
  radialSegments: number,
  heightSegments: number
): Geometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    const v = iy / heightSegments;
    const y = (v - 0.5) * height;

    for (let ix = 0; ix <= radialSegments; ix++) {
      const u = ix / radialSegments;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  const rowSize = radialSegments + 1;
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < radialSegments; ix++) {
      const a = iy * rowSize + ix;
      const b = a + 1;
      const c = a + rowSize;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(positions) },
    uv: { size: 2, data: new Float32Array(uvs) },
    index: { data: new Uint16Array(indices) },
  });
}

export interface ParticleGeometryEntry {
  geometry: Geometry;
  userData: ParticleUserData;
}

/**
 * Each particle is a LINE_STRIP arc parked at a fixed random height band
 * (top half of the particles above the cylinder, bottom half below).
 * Positions get rewritten every frame the cylinder is rotating (see
 * updateParticleGeometry), so the geometry is created with the arc's
 * resting pose (velocity = 0) here.
 */
export function createParticleGeometries(
  gl: OGLRenderingContext,
  config: ParticleConfig,
  cylinderHeight: number
): ParticleGeometryEntry[] {
  const entries: ParticleGeometryEntry[] = [];

  for (let i = 0; i < config.numParticles; i++) {
    const isTopHalf = i < config.numParticles / 2;
    const bandHeight = cylinderHeight * 0.7 + Math.random() * (cylinderHeight * 0.3);
    const baseY = isTopHalf ? bandHeight : -bandHeight;

    const userData: ParticleUserData = {
      baseAngle: (i / config.numParticles) * Math.PI * 2,
      angleSpan: config.angleSpan,
      baseY,
      speed: 0.5 + Math.random(), // 0.5 - 1.5
      radius: config.particleRadius,
    };

    const geometry = new Geometry(gl, {
      position: { size: 3, data: new Float32Array((config.segments + 1) * 3) },
    });

    updateParticleGeometry(geometry, userData, config.segments);
    entries.push({ geometry, userData });
  }

  return entries;
}

export function updateParticleGeometry(geometry: Geometry, userData: ParticleUserData, segments: number): void {
  const data = geometry.attributes.position.data as Float32Array;

  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const angle = userData.baseAngle + userData.angleSpan * t;
    data[j * 3] = Math.cos(angle) * userData.radius;
    data[j * 3 + 1] = userData.baseY;
    data[j * 3 + 2] = Math.sin(angle) * userData.radius;
  }

  geometry.attributes.position.needsUpdate = true;
}

/**
 * "object-fit: cover" crop of `img` into a destW x destH slice, pre-flipped
 * vertically so baked-in text/content isn't upside-down once the atlas is
 * uploaded as a WebGL texture (which flips V on upload).
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number
): void {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const imgRatio = imgW / imgH;
  const destRatio = destW / destH;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = imgW;
  let sourceHeight = imgH;

  if (imgRatio > destRatio) {
    sourceWidth = imgH * destRatio;
    sourceX = (imgW - sourceWidth) / 2;
  } else {
    sourceHeight = imgW / destRatio;
    sourceY = (imgH - sourceHeight) / 2;
  }

  ctx.save();
  ctx.translate(destX, destY + destH);
  ctx.scale(1, -1);
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, destW, destH);
  ctx.restore();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Safe max atlas width for the current device, capped for mobile GPUs. */
export function getSafeAtlasWidth(gl: OGLRenderingContext, isMobile: boolean): number {
  const hardwareLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  return isMobile ? Math.min(2048, hardwareLimit) : Math.min(hardwareLimit, 8192);
}

/**
 * Builds a horizontal texture atlas canvas from `images`, one equal slice
 * per image, scaled down proportionally if the ideal width exceeds the
 * device's safe texture size limit.
 */
export async function buildTextureAtlas(
  images: string[],
  imageConfig: ImageConfig,
  gl: OGLRenderingContext,
  isMobile: boolean
): Promise<HTMLCanvasElement> {
  const loaded = await Promise.all(images.map(loadImage));

  const idealSliceWidth = imageConfig.width;
  const idealTotalWidth = idealSliceWidth * images.length;
  const safeLimit = getSafeAtlasWidth(gl, isMobile);

  const scale = idealTotalWidth > safeLimit ? safeLimit / idealTotalWidth : 1;
  const sliceWidth = Math.floor(idealSliceWidth * scale);
  const canvasHeight = Math.floor(imageConfig.height * scale);
  const totalWidth = sliceWidth * images.length;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for texture atlas canvas');

  loaded.forEach((img, i) => {
    drawImageCover(ctx, img, i * sliceWidth, 0, sliceWidth, canvasHeight);
  });

  return canvas;
}
