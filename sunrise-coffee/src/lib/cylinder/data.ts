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
    title: 'Racale, terra di capperi',
    description: 'Nel cuore del Salento, dove il sole asciuga la terra e la pietra ne trattiene il calore, il cappero ha trovato casa. Non da poco: da sempre.',
    position: 'top',
  },
  {
    title: 'Una vocazione, non una scelta',
    description: 'Muretti a secco, terra rossa, un microclima quasi disegnato apposta. Racale non ha scelto il cappero: lo custodisce da generazioni, come una vocazione di famiglia.',
    position: 'center',
  },
  {
    title: 'Quando tutta la famiglia usciva nei campi',
    description: "All'alba, prima che il sole si facesse duro, si usciva insieme. Nonni, genitori, figli: ogni bocciolo va colto a mano, uno per uno, e serviva ogni mano di casa.",
    position: 'center',
  },
  {
    title: 'Un sapere che si imparava guardando',
    description: 'Nessun libro insegnava il gesto giusto tra i cespugli, il momento esatto della raccolta, il rispetto per una pianta che il giorno dopo avrebbe dato ancora. Si imparava standoci accanto.',
    position: 'center',
  },
  {
    title: 'La salatura, il rito di fine giornata',
    description: 'Tornati a casa, i capperi si stendevano e si salavano insieme, in cortile, tra chi raccontava e chi ascoltava. La raccolta finiva nei campi, la cura continuava in famiglia.',
    position: 'center',
  },
  {
    title: 'Stesso territorio, stesse mani',
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
