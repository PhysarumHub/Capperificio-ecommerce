import type { Breakpoint, CylinderConfig, ImageConfig, ParticleConfig, Perspective, ResponsiveSettings } from './types';

export const images: string[] = [
  '/images/territorio/capperificio-caro-raccolta.webp',
  '/images/territorio/capperificio-caro-lavorazione-jul-23.webp',
  '/images/territorio/capperificio-caro-capperi.webp',
  '/images/territorio/raccolta-capperificio-caro-lug-12-2024.webp',
  '/images/territorio/capperificio-caro-lavorazione-jul-23-1.webp',
  '/images/territorio/capperificio-caro-raccolta-2024.webp',
  '/images/territorio/lavorazione-capperificio-caro-23-lug-2024.webp',
  '/images/territorio/raccolta-capperificio-caro-lug-12-2024-1.webp',
  '/images/territorio/capperificio-caro-raccolta-2024-1.webp',
  '/images/territorio/capperificio-caro-raccolta-jul-12-2024.webp',
  '/images/territorio/capperi-condivisione-pubblica-giugno-11-2025.webp',
  '/images/territorio/foto-lug-29-2024-da-aruba-drive.webp',
];

export const perspectives: Perspective[] = [
  {
    title: 'Il cappero di Racale',
    description: 'Qui non si è piantato. È nato insieme al paese.',
    position: 'top',
  },
  {
    title: 'Nato tra le pietre',
    description: 'Dove non cresce altro, cresce lui. Noi ci siamo solo adattati.',
    position: 'center',
  },
  {
    title: 'A mano, sempre',
    description: 'Bocciolo per bocciolo. Le macchine qui non sono mai entrate.',
    position: 'center',
  },
  {
    title: 'Occhio, non libro',
    description: 'Il momento giusto si impara a vista. Nessun manuale te lo insegna.',
    position: 'center',
  },
  {
    title: 'Come si è sempre fatto',
    description: 'Sotto sale, a strati, senza fretta. Non cambia da tre generazioni.',
    position: 'center',
  },
  {
    title: 'Stessa pianta, altre mani',
    description: 'Tre generazioni, stesso posto, stesso cespuglio.',
    position: 'bottom',
  },
];

export const imageConfig: ImageConfig = {
  width: 1024,
  height: 1024,
};

/** Base geometry config. Built once on mount from the current breakpoint. */
export function getCylinderConfig(isMobile: boolean): CylinderConfig {
  return {
    radius: isMobile ? 2.2 : 2.5,
    height: isMobile ? 1.2 : 2,
    radialSegments: 64,
    heightSegments: 1,
  };
}

export const particleConfig: ParticleConfig = {
  numParticles: 12,
  particleRadius: 3.3, // cylinderRadius (2.5) + 0.8
  segments: 20,
  angleSpan: 0.3,
};

export const responsiveSettings: Record<Breakpoint, ResponsiveSettings> = {
  mobile: { maxRadius: 1.8, cylinderHeight: 0.8, cameraZ: 6, fov: 50 },
  tablet: { maxRadius: 2.2, cylinderHeight: 1.0, cameraZ: 7, fov: 45 },
  desktop: { maxRadius: 2.5, cylinderHeight: 1.2, cameraZ: 8, fov: 45 },
};

export function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
