export type PerspectivePosition =
  | 'top'
  | 'top-left'
  | 'left'
  | 'center'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

export interface Perspective {
  title: string;
  description?: string;
  position: PerspectivePosition;
}

export interface CylinderConfig {
  radius: number;
  height: number;
  radialSegments: number;
  heightSegments: number;
}

export interface ParticleConfig {
  numParticles: number;
  particleRadius: number;
  segments: number;
  angleSpan: number;
}

export interface ImageConfig {
  width: number;
  height: number;
}

export interface ParticleUserData {
  baseAngle: number;
  angleSpan: number;
  baseY: number;
  speed: number;
  radius: number;
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveSettings {
  maxRadius: number;
  cylinderHeight: number;
  cameraZ: number;
  fov: number;
}

export interface CameraAnimState {
  x: number;
  y: number;
  z: number;
}
