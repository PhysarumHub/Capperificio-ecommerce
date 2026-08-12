import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { CustomEase } from 'gsap/CustomEase';
import { Camera, Mesh, Program, Renderer, Texture, Transform } from 'ogl';

import {
  getBreakpoint,
  getCylinderConfig,
  imageConfig,
  images,
  particleConfig,
  perspectives,
  responsiveSettings,
} from '../lib/cylinder/data';
import { cylinderFragment, cylinderVertex, particleFragment, particleVertex } from '../lib/cylinder/shaders';
import {
  buildTextureAtlas,
  createCylinderGeometry,
  createParticleGeometries,
  lerp,
  updateParticleGeometry,
} from '../lib/cylinder/utils';
import type { Breakpoint, CameraAnimState, PerspectivePosition } from '../lib/cylinder/types';
import '../styles/cylinder-tailwind.css';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, CustomEase);

const positionClasses: Record<PerspectivePosition, string> = {
  top: 'top-20 left-1/2 -translate-x-1/2 text-center',
  'top-left': 'top-20 left-6 md:left-20 text-left',
  'top-right': 'top-20 right-6 md:right-20 text-right',
  left: 'top-1/2 left-6 md:left-20 -translate-y-1/2 text-left',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center',
  bottom: 'bottom-20 left-1/2 -translate-x-1/2 text-center',
  'bottom-left': 'bottom-20 left-6 md:left-20 text-left',
  'bottom-right': 'bottom-20 right-6 md:right-20 text-right',
};

export default function CylinderCarousel() {
  const [isLoading, setIsLoading] = useState(true);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const perspectiveRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || !wrapperRef.current || !contentRef.current) return;

    CustomEase.create('cinematicSilk', '0.45,0.05,0.55,0.95');
    CustomEase.create('cinematicSmooth', '0.25,0.1,0.25,1');
    CustomEase.create('cinematicFlow', '0.33,0,0.2,1');
    CustomEase.create('cinematicLinear', '0.4,0,0.6,1');

    let destroyed = false;
    let rafId = 0;
    let lastWidth = window.innerWidth;

    // ---------------------------------------------------------------------
    // ogl scene setup
    // ---------------------------------------------------------------------
    const renderer = new Renderer({
      canvas,
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    renderer.disable(gl.CULL_FACE);

    const initialBreakpoint = getBreakpoint(window.innerWidth);
    const initialSettings = responsiveSettings[initialBreakpoint];

    const camera = new Camera(gl, { fov: initialSettings.fov, near: 0.1, far: 100 });
    camera.position.set(0, 0, initialSettings.cameraZ);

    const scene = new Transform();

    const isMobileGeometry = initialBreakpoint === 'mobile';
    const baseCylinderConfig = getCylinderConfig(isMobileGeometry);
    const cylinderGeometry = createCylinderGeometry(
      gl,
      baseCylinderConfig.radius,
      baseCylinderConfig.height,
      baseCylinderConfig.radialSegments,
      baseCylinderConfig.heightSegments
    );

    const texture = new Texture(gl, {
      generateMipmaps: false,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    const cylinderProgram = new Program(gl, {
      vertex: cylinderVertex,
      fragment: cylinderFragment,
      cullFace: null,
      uniforms: {
        tMap: { value: texture },
        uDarkness: { value: 0.3 },
      },
    });

    const cylinderMesh = new Mesh(gl, { geometry: cylinderGeometry, program: cylinderProgram });
    cylinderMesh.setParent(scene);
    cylinderMesh.rotation.y = 0.5;

    function applyResponsiveScale(breakpoint: Breakpoint) {
      const settings = responsiveSettings[breakpoint];
      const baseScale = settings.maxRadius / baseCylinderConfig.radius;
      let scaleY = baseScale;

      if (breakpoint === 'mobile') {
        const circumference = 2 * Math.PI * baseCylinderConfig.radius;
        const textureAspectRatio = imageConfig.height / (imageConfig.width * images.length);
        const idealHeight = circumference * textureAspectRatio;
        const heightCorrection = idealHeight / baseCylinderConfig.height;
        scaleY = baseScale * heightCorrection;
      }

      cylinderMesh.scale.set(baseScale, scaleY, baseScale);
    }
    applyResponsiveScale(initialBreakpoint);

    // ---------------------------------------------------------------------
    // trailing particles
    // ---------------------------------------------------------------------
    const particleEntries = createParticleGeometries(gl, particleConfig, baseCylinderConfig.height);
    const particleMeshes = particleEntries.map(({ geometry }) => {
      const program = new Program(gl, {
        vertex: particleVertex,
        fragment: particleFragment,
        cullFace: null,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: [1, 1, 1] },
          uOpacity: { value: 0 },
        },
      });
      const mesh = new Mesh(gl, { geometry, program, mode: gl.LINE_STRIP });
      mesh.setParent(scene);
      return mesh;
    });

    // ---------------------------------------------------------------------
    // resize (with mobile address-bar jump guard)
    // ---------------------------------------------------------------------
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width === lastWidth) return; // only viewport height changed (URL bar) — ignore
      lastWidth = width;

      const breakpoint = getBreakpoint(width);
      const settings = responsiveSettings[breakpoint];

      renderer.setSize(width, height);
      camera.perspective({ fov: settings.fov, aspect: width / height });
      applyResponsiveScale(breakpoint);
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    // ---------------------------------------------------------------------
    // texture atlas (loader gate)
    // ---------------------------------------------------------------------
    buildTextureAtlas(images, imageConfig, gl, isMobileGeometry).then((atlasCanvas) => {
      if (destroyed) return;
      texture.image = atlasCanvas;
      setIsLoading(false);
    });

    // ---------------------------------------------------------------------
    // gsap scroll setup
    // ---------------------------------------------------------------------
    const ctx = gsap.context(() => {
      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current!,
        content: contentRef.current!,
        smooth: 4,
        effects: false,
        smoothTouch: 0.1,
      });

      const cameraAnim: CameraAnimState = { x: 0, y: 0, z: initialSettings.cameraZ };

      const cameraTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      cameraTl
        .to(cameraAnim, { x: 0, y: 0, z: initialSettings.cameraZ, duration: 1, ease: 'cinematicSilk' })
        .to(cameraAnim, { x: 0, y: 5, z: 5, duration: 1, ease: 'cinematicFlow' })
        .to(cameraAnim, { x: 1.5, y: 2, z: 2, duration: 2, ease: 'cinematicLinear' })
        .to(cameraAnim, { x: 0.5, y: 0, z: 0.8, duration: 3.5, ease: 'power1.inOut' })
        .to(cameraAnim, { x: -6, y: -1, z: initialSettings.cameraZ, duration: 1, ease: 'cinematicSmooth' });

      cameraTl.to(cylinderMesh.rotation, { y: '+=28.27', duration: 8.5, ease: 'none' }, 0);

      perspectives.forEach((_, index) => {
        const el = perspectiveRefs.current[index];
        if (!el) return;

        const start = `${(index * 100) / perspectives.length}% top`;
        const end = `${((index + 1) * 100) / perspectives.length}% top`;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start,
              end,
              scrub: 0.8,
            },
          })
          .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'cinematicSmooth' })
          .addLabel('hold')
          .to(el, { opacity: 1, duration: 0.6, ease: 'none' }, 'hold')
          .to(el, { opacity: 0, duration: 0.2, ease: 'cinematicSmooth' });
      });

      // -----------------------------------------------------------------
      // render loop
      // -----------------------------------------------------------------
      let prevRotationY = cylinderMesh.rotation.y;
      let momentum = 0;
      let currentOpacity = 0;

      function tick() {
        rafId = requestAnimationFrame(tick);

        camera.position.set(cameraAnim.x, cameraAnim.y, cameraAnim.z);
        camera.lookAt([0, 0, 0]);

        const velocity = cylinderMesh.rotation.y - prevRotationY;
        prevRotationY = cylinderMesh.rotation.y;
        momentum = momentum * 0.92 + velocity * 0.15;
        const speed = Math.abs(velocity) * 100;
        const isRotating = Math.abs(velocity) > 0.0001;
        const targetOpacity = isRotating ? Math.min(speed * 3, 0.95) : 0;
        currentOpacity = lerp(currentOpacity, targetOpacity, 0.15);

        particleEntries.forEach(({ geometry, userData }, i) => {
          particleMeshes[i].program.uniforms.uOpacity.value = currentOpacity;

          if (isRotating) {
            const rotationOffset = velocity * userData.speed * 1.5;
            userData.baseAngle += rotationOffset;
            updateParticleGeometry(geometry, userData, particleConfig.segments);
          }
        });

        renderer.render({ scene, camera });
      }
      tick();

      return () => smoother.kill();
    }, wrapperRef);

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      ctx.revert();

      cylinderGeometry.remove();
      particleEntries.forEach(({ geometry }) => geometry.remove());
      // Note: deliberately not forcing WEBGL_lose_context here — under
      // React StrictMode's dev double-invoke, the effect's cleanup and
      // re-setup run against the *same* canvas node, and force-losing the
      // context would permanently break the second mount. The browser
      // reclaims the GL context on its own once the canvas is unmounted.
    };
  }, []);

  return (
    <div className="bg-black text-neutral-200 min-h-screen">
      <Link
        to="/"
        aria-label="Torna alla home"
        className="fixed top-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>

      <div ref={wrapperRef} id="smooth-wrapper" className="fixed inset-0 overflow-hidden">
        <div ref={contentRef} id="smooth-content" className="w-full">
          <div ref={containerRef} style={{ height: '500svh' }} />
        </div>
      </div>

      <canvas ref={canvasRef} className="fixed inset-0 z-0 block" />

      <div className="fixed inset-0 z-10 pointer-events-none">
        {perspectives.map((perspective, index) => (
          <div
            key={perspective.title}
            ref={(el) => {
              perspectiveRefs.current[index] = el;
            }}
            className={`absolute max-w-3xl px-6 opacity-0 ${positionClasses[perspective.position]}`}
          >
            <h2 className="text-5xl md:text-7xl font-light leading-tight text-white">{perspective.title}</h2>
            {perspective.description && (
              <p className="mt-4 text-xl md:text-2xl opacity-50 text-white">{perspective.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 right-8 z-20 flex flex-col items-center gap-2 text-white/70 pointer-events-none">
        <span className="text-xs uppercase tracking-[0.2em]">Scroll</span>
        <svg
          className="h-5 w-5 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <span className="text-sm uppercase tracking-[0.3em] text-white/60">Loading</span>
        </div>
      )}
    </div>
  );
}
