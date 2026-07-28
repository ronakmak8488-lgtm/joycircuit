"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STAR_PALETTE = ["#ffffff", "#d9ecff", "#9bc8ff", "#c8b8ff", "#89f1ff"];
const EMISSIVE_STAR_PALETTE = ["#ffffff", "#8fc5ff", "#4f8dff", "#ff665c", "#ffd29a"];
const PLANET_PALETTE = [0x77d9ff, 0xb89cff, 0xff9d73, 0x7be0be, 0xdce8ff, 0xf0c96f];
const LONG_PRESS_MS = 2_000;
const AMBIENT_SUPERNOVA_MIN_MS = 3 * 60 * 1_000;
const AMBIENT_SUPERNOVA_MAX_MS = 5 * 60 * 1_000;

export function AmbientGameField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/play/");
  const isHome = pathname === "/";

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) return;

    let disposed = false;
    let teardown = () => undefined;

    const bootTimer = window.setTimeout(() => {
      void import("three").then((THREE) => {
        if (disposed) return;

        try {
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const compact = window.matchMedia("(max-width: 720px)").matches;
          const introEnabled = isHome;
          const introCameraStart = reducedMotion ? 24 : 11;
          const introFovStart = reducedMotion ? 50 : 70;
          const introDuration = reducedMotion ? 520 : 2_400;
          const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !compact,
            powerPreference: "low-power",
          });
          renderer.setClearColor(0x000000, 0);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.1 : 1.4));
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.12;
          renderer.domElement.className = "ambient-game-field-canvas";
          renderer.domElement.setAttribute("aria-hidden", "true");
          host.append(renderer.domElement);
          host.dataset.motion = reducedMotion ? "reduced" : "full";
          if (introEnabled) host.dataset.intro = "true";

          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(introEnabled ? introFovStart : 46, 1, 0.1, 220);
          camera.position.set(0, 0, introEnabled ? introCameraStart : 28);

          scene.add(new THREE.HemisphereLight(0xa9c9ff, 0x120d2b, 1.35));
          const stellarKeyLight = new THREE.DirectionalLight(0xdcecff, 1.1);
          stellarKeyLight.position.set(-8, 12, 18);
          scene.add(stellarKeyLight);

          const root = new THREE.Group();
          root.position.z = -8;
          scene.add(root);

          const glowCanvas = document.createElement("canvas");
          glowCanvas.width = 192;
          glowCanvas.height = 192;
          const glowContext = glowCanvas.getContext("2d");
          if (!glowContext) throw new Error("Canvas textures are unavailable.");
          const glowGradient = glowContext.createRadialGradient(96, 96, 0, 96, 96, 96);
          glowGradient.addColorStop(0, "rgba(255,255,255,1)");
          glowGradient.addColorStop(0.1, "rgba(215,235,255,0.92)");
          glowGradient.addColorStop(0.34, "rgba(98,139,255,0.3)");
          glowGradient.addColorStop(1, "rgba(20,30,92,0)");
          glowContext.fillStyle = glowGradient;
          glowContext.fillRect(0, 0, 192, 192);
          const glowTexture = new THREE.CanvasTexture(glowCanvas);
          glowTexture.colorSpace = THREE.SRGBColorSpace;

          const nebulaGroup = new THREE.Group();
          const nebulaStates: Array<{
            sprite: InstanceType<typeof THREE.Sprite>;
            material: InstanceType<typeof THREE.SpriteMaterial>;
            opacity: number;
            phase: number;
          }> = [];
          const nebulaSpecs = [
            { x: -18, y: 8, z: -58, size: 38, color: 0x3357b8, opacity: 0.13 },
            { x: 21, y: -10, z: -66, size: 44, color: 0x503b9c, opacity: 0.115 },
            { x: 3, y: 16, z: -82, size: 52, color: 0x1f668c, opacity: 0.075 },
          ];
          for (let index = 0; index < nebulaSpecs.length; index += 1) {
            const spec = nebulaSpecs[index];
            const material = new THREE.SpriteMaterial({
              map: glowTexture,
              color: spec.color,
              transparent: true,
              opacity: spec.opacity,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(spec.x, spec.y, spec.z);
            sprite.scale.set(spec.size, spec.size, 1);
            nebulaGroup.add(sprite);
            nebulaStates.push({ sprite, material, opacity: spec.opacity, phase: index * 2.1 });
          }
          root.add(nebulaGroup);

          const farStarCount = compact ? (reducedMotion ? 380 : 520) : (reducedMotion ? 700 : 1_100);
          const farPositions = new Float32Array(farStarCount * 3);
          const farColors = new Float32Array(farStarCount * 3);
          const starColor = new THREE.Color();
          for (let index = 0; index < farStarCount; index += 1) {
            const offset = index * 3;
            farPositions[offset] = (Math.random() - 0.5) * (compact ? 62 : 96);
            farPositions[offset + 1] = (Math.random() - 0.5) * (compact ? 70 : 54);
            farPositions[offset + 2] = 8 - Math.random() * 116;
            starColor.set(STAR_PALETTE[index % STAR_PALETTE.length]);
            starColor.multiplyScalar(0.62 + Math.random() * 0.38);
            farColors[offset] = starColor.r;
            farColors[offset + 1] = starColor.g;
            farColors[offset + 2] = starColor.b;
          }
          const farGeometry = new THREE.BufferGeometry();
          farGeometry.setAttribute("position", new THREE.BufferAttribute(farPositions, 3));
          farGeometry.setAttribute("color", new THREE.BufferAttribute(farColors, 3));
          const farMaterial = new THREE.PointsMaterial({
            size: compact ? 0.14 : 0.19,
            sizeAttenuation: true,
            vertexColors: true,
            map: glowTexture,
            alphaTest: 0.018,
            transparent: true,
            opacity: introEnabled ? 0.25 : 0.86,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          });
          const farStars = new THREE.Points(farGeometry, farMaterial);
          root.add(farStars);

          const galaxyCount = compact ? (reducedMotion ? 220 : 320) : (reducedMotion ? 460 : 760);
          const galaxyPositions = new Float32Array(galaxyCount * 3);
          const galaxyColors = new Float32Array(galaxyCount * 3);
          const spiralArmCount = 4;
          for (let index = 0; index < galaxyCount; index += 1) {
            const offset = index * 3;
            const radius = Math.pow(Math.random(), 0.66) * (compact ? 25 : 38);
            const arm = index % spiralArmCount;
            const armOffset = arm / spiralArmCount * Math.PI * 2;
            const armNoise = (Math.random() - 0.5) * (0.34 + radius * 0.012);
            const angle = armOffset + radius * 0.2 + armNoise;
            const radialNoise = (Math.random() - 0.5) * (0.75 + radius * 0.025);
            const noisyRadius = radius + radialNoise;
            galaxyPositions[offset] = Math.cos(angle) * noisyRadius;
            galaxyPositions[offset + 1] = Math.sin(angle) * noisyRadius;
            galaxyPositions[offset + 2] = -54 + (Math.random() - 0.5) * (1.2 + radius * 0.1);
            starColor.set(EMISSIVE_STAR_PALETTE[(index * 3 + arm) % EMISSIVE_STAR_PALETTE.length]);
            starColor.multiplyScalar(0.68 + Math.random() * 0.44);
            galaxyColors[offset] = starColor.r;
            galaxyColors[offset + 1] = starColor.g;
            galaxyColors[offset + 2] = starColor.b;
          }
          const galaxyGeometry = new THREE.BufferGeometry();
          galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
          galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));
          const galaxyMaterial = new THREE.PointsMaterial({
            size: compact ? 0.14 : 0.19,
            sizeAttenuation: true,
            vertexColors: true,
            map: glowTexture,
            alphaTest: 0.014,
            transparent: true,
            opacity: 0.56,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          });
          const galaxyBand = new THREE.Points(galaxyGeometry, galaxyMaterial);
          galaxyBand.rotation.x = -0.3;
          galaxyBand.rotation.z = -0.34;
          galaxyBand.position.set(compact ? -2 : 3, -4, 0);
          root.add(galaxyBand);

          const matrix = new THREE.Matrix4();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          const interactiveCount = compact ? (reducedMotion ? 36 : 62) : (reducedMotion ? 82 : 148);
          const interactiveGeometry = new THREE.SphereGeometry(0.12, compact ? 8 : 12, compact ? 6 : 9);
          const interactiveMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1.7,
            roughness: 0.28,
            metalness: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.98,
            blending: THREE.NormalBlending,
            depthWrite: false,
          });
          interactiveMaterial.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <emissivemap_fragment>",
              "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= diffuseColor.rgb;",
            );
          };
          interactiveMaterial.customProgramCacheKey = () => "joycircuit-instanced-emissive-stars-v1";
          const interactiveStars = new THREE.InstancedMesh(interactiveGeometry, interactiveMaterial, interactiveCount);
          interactiveStars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          const interactivePalette = EMISSIVE_STAR_PALETTE.map((color) => new THREE.Color(color));
          const glowPalette = [new THREE.Color(0xffffff), new THREE.Color(0x9ed9ff), new THREE.Color(0xff8a78), new THREE.Color(0xffdfae)];
          const instanceColor = new THREE.Color();
          const initialMotion = reducedMotion ? 0.16 : 1;
          const starStates: Array<{
            center: InstanceType<typeof THREE.Vector3>;
            position: InstanceType<typeof THREE.Vector3>;
            offset: InstanceType<typeof THREE.Vector3>;
            velocity: InstanceType<typeof THREE.Vector3>;
            rotation: InstanceType<typeof THREE.Euler>;
            spin: InstanceType<typeof THREE.Vector3>;
            size: number;
            phase: number;
            energy: number;
            orbitAngle: number;
            orbitRadius: number;
            orbitSpeed: number;
            orbitSquash: number;
            glow: number;
            glowTarget: number;
            glowColor: number;
            lastExplosion: number;
          }> = [];
          for (let index = 0; index < interactiveCount; index += 1) {
            const center = new THREE.Vector3(
              (Math.random() - 0.5) * (compact ? 38 : 68),
              (Math.random() - 0.5) * (compact ? 52 : 42),
              2 - Math.random() * 62,
            );
            const position = center.clone();
            const offset = new THREE.Vector3();
            const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.08 * initialMotion,
              (Math.random() - 0.5) * 0.08 * initialMotion,
              (Math.random() - 0.5) * 0.05 * initialMotion,
            );
            const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const spin = new THREE.Vector3(
              (Math.random() - 0.5) * 0.38,
              (Math.random() - 0.5) * 0.38,
              (Math.random() - 0.5) * 0.38,
            );
            const size = (index % 13 === 0 ? 2.75 : 0.78) + Math.random() * 1.3;
            quaternion.setFromEuler(rotation);
            scale.setScalar(size);
            matrix.compose(position, quaternion, scale);
            interactiveStars.setMatrixAt(index, matrix);
            instanceColor.copy(interactivePalette[index % interactivePalette.length]);
            interactiveStars.setColorAt(index, instanceColor);
            starStates.push({
              center,
              position,
              offset,
              velocity,
              rotation,
              spin,
              size,
              phase: Math.random() * Math.PI * 2,
              energy: 0,
              orbitAngle: Math.random() * Math.PI * 2,
              orbitRadius: 0.3 + Math.random() * (compact ? 0.72 : 1.15),
              orbitSpeed: (0.08 + Math.random() * 0.16) * (Math.random() > 0.5 ? 1 : -1),
              orbitSquash: 0.42 + Math.random() * 0.38,
              glow: 0,
              glowTarget: 0,
              glowColor: index % glowPalette.length,
              lastExplosion: 0,
            });
          }
          interactiveStars.instanceMatrix.needsUpdate = true;
          if (interactiveStars.instanceColor) interactiveStars.instanceColor.needsUpdate = true;
          root.add(interactiveStars);

          const nearbySystems = new THREE.Group();
          const nearbyStarGeometry = new THREE.SphereGeometry(1, compact ? 14 : 22, compact ? 10 : 16);
          const nearbyPlanetGeometry = new THREE.SphereGeometry(1, compact ? 10 : 14, compact ? 8 : 10);
          const desktopSystemSpecs = [
            { x: -27, y: 14, z: -9, size: 0.62, color: 0x8fc5ff, phase: 0.2, planets: 2 },
            { x: 28, y: 13, z: -16, size: 0.57, color: 0xff665c, phase: 1.15, planets: 2 },
            { x: -30, y: -12, z: -21, size: 0.5, color: 0xffffff, phase: 2.1, planets: 3 },
            { x: 31, y: -10, z: -27, size: 0.68, color: 0x4f8dff, phase: 3, planets: 2 },
            { x: 4, y: 20, z: -33, size: 0.46, color: 0xffd29a, phase: 4.05, planets: 2 },
            { x: -12, y: -19, z: -13, size: 0.54, color: 0xff665c, phase: 5.15, planets: 2 },
            { x: 17, y: -18, z: -34, size: 0.49, color: 0xffffff, phase: 6.05, planets: 3 },
          ];
          const compactSystemSpecs = [
            { x: -9, y: 16, z: -10, size: 0.52, color: 0x8fc5ff, phase: 0.2, planets: 2 },
            { x: 9, y: 8, z: -17, size: 0.48, color: 0xff665c, phase: 1.55, planets: 2 },
            { x: -8, y: -12, z: -22, size: 0.46, color: 0xffffff, phase: 3.1, planets: 2 },
            { x: 7, y: -18, z: -14, size: 0.54, color: 0x4f8dff, phase: 4.75, planets: 2 },
          ];
          const nearbySpecs = compact
            ? compactSystemSpecs
            : desktopSystemSpecs.slice(0, reducedMotion ? 5 : desktopSystemSpecs.length);
          const nearbySystemStates: Array<{
            group: InstanceType<typeof THREE.Group>;
            basePosition: InstanceType<typeof THREE.Vector3>;
            star: InstanceType<typeof THREE.Mesh>;
            starMaterial: InstanceType<typeof THREE.MeshStandardMaterial>;
            halo: InstanceType<typeof THREE.Sprite>;
            haloMaterial: InstanceType<typeof THREE.SpriteMaterial>;
            size: number;
            phase: number;
            driftRadius: number;
            driftSpeed: number;
            planets: Array<{
              mesh: InstanceType<typeof THREE.Mesh>;
              radius: number;
              speed: number;
              angle: number;
              incline: number;
            }>;
          }> = [];
          let nearbyPlanetCount = 0;
          nearbySpecs.forEach((spec, systemIndex) => {
            const group = new THREE.Group();
            const basePosition = new THREE.Vector3(spec.x, spec.y, spec.z);
            group.position.copy(basePosition);

            const starMaterial = new THREE.MeshStandardMaterial({
              color: spec.color,
              emissive: spec.color,
              emissiveIntensity: 2.8,
              roughness: 0.16,
              metalness: 0.03,
            });
            const star = new THREE.Mesh(nearbyStarGeometry, starMaterial);
            star.scale.setScalar(spec.size);
            const haloMaterial = new THREE.SpriteMaterial({
              map: glowTexture,
              color: spec.color,
              transparent: true,
              opacity: 0.48,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              toneMapped: false,
            });
            const halo = new THREE.Sprite(haloMaterial);
            halo.scale.setScalar(spec.size * 8.4);
            group.add(halo, star);

            const planets: Array<{
              mesh: InstanceType<typeof THREE.Mesh>;
              radius: number;
              speed: number;
              angle: number;
              incline: number;
            }> = [];
            for (let planetIndex = 0; planetIndex < spec.planets; planetIndex += 1) {
              const radius = 1.05 + planetIndex * 0.62 + systemIndex % 2 * 0.12;
              const incline = -0.32 + (systemIndex % 3) * 0.2 + planetIndex * 0.08;
              const planetSize = 0.13 + planetIndex * 0.035 + (systemIndex + planetIndex) % 2 * 0.025;
              const planetColor = PLANET_PALETTE[(systemIndex * 2 + planetIndex) % PLANET_PALETTE.length];
              const orbit = new THREE.Mesh(
                new THREE.TorusGeometry(radius, 0.012, 4, compact ? 48 : 72),
                new THREE.MeshBasicMaterial({
                  color: spec.color,
                  transparent: true,
                  opacity: 0.24,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                  toneMapped: false,
                }),
              );
              orbit.rotation.x = incline;
              group.add(orbit);

              const planet = new THREE.Mesh(
                nearbyPlanetGeometry,
                new THREE.MeshStandardMaterial({
                  color: planetColor,
                  emissive: planetColor,
                  emissiveIntensity: 0.18,
                  roughness: 0.62,
                  metalness: 0.08,
                }),
              );
              planet.scale.setScalar(planetSize);
              if (planetIndex === 1 && systemIndex % 2 === 0) {
                const planetRing = new THREE.Mesh(
                  new THREE.TorusGeometry(1.55, 0.1, 5, 32),
                  new THREE.MeshBasicMaterial({ color: 0xdce8ff, transparent: true, opacity: 0.66, depthWrite: false }),
                );
                planetRing.rotation.x = 1.05;
                planet.add(planetRing);
              }
              group.add(planet);
              planets.push({
                mesh: planet,
                radius,
                speed: (0.16 + planetIndex * 0.055 + systemIndex * 0.008) * (planetIndex % 2 === 0 ? 1 : -1),
                angle: spec.phase + planetIndex * 2.3,
                incline,
              });
              nearbyPlanetCount += 1;
            }

            nearbySystems.add(group);
            nearbySystemStates.push({
              group,
              basePosition,
              star,
              starMaterial,
              halo,
              haloMaterial,
              size: spec.size,
              phase: spec.phase,
              driftRadius: 0.18 + systemIndex * 0.035,
              driftSpeed: 0.014 + systemIndex * 0.002,
              planets,
            });
          });
          root.add(nearbySystems);

          const system = new THREE.Group();
          const systemTarget = new THREE.Vector3(compact ? 8 : 17, compact ? -11 : -10, -34);
          const systemIntroStart = reducedMotion
            ? new THREE.Vector3(systemTarget.x * 0.9, systemTarget.y * 0.9, systemTarget.z + 2)
            : new THREE.Vector3(0, 0, -24);
          const systemBaseScale = compact ? 0.62 : 1;
          const systemIntroScale = reducedMotion ? systemBaseScale * 1.12 : systemBaseScale * 2.35;
          system.position.copy(introEnabled ? systemIntroStart : systemTarget);
          system.scale.setScalar(introEnabled ? systemIntroScale : systemBaseScale);
          const sun = new THREE.Mesh(
            new THREE.SphereGeometry(0.68, 22, 16),
            new THREE.MeshStandardMaterial({
              color: 0xe8f6ff,
              emissive: 0xa9d7ff,
              emissiveIntensity: 3.2,
              roughness: 0.14,
            }),
          );
          const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x6fa8ff,
            transparent: true,
            opacity: 0.56,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }));
          sunGlow.scale.set(7.2, 7.2, 1);
          system.add(sunGlow, sun);

          const planetStates: Array<{
            mesh: InstanceType<typeof THREE.Mesh>;
            radius: number;
            speed: number;
            angle: number;
          }> = [];
          const orbitSpecs = [
            { radius: 2.1, size: 0.21, color: 0x8bdcff, speed: 0.18 },
            { radius: 3.55, size: 0.28, color: 0xa899ff, speed: -0.105 },
            { radius: 5.1, size: 0.19, color: 0xffa277, speed: 0.07 },
          ];
          orbitSpecs.forEach((spec, index) => {
            const orbit = new THREE.Mesh(
              new THREE.TorusGeometry(spec.radius, 0.018, 4, 96),
              new THREE.MeshBasicMaterial({ color: 0x9ec7ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
            );
            orbit.rotation.x = 0.16 + index * 0.04;
            system.add(orbit);
            const planet = new THREE.Mesh(
              new THREE.SphereGeometry(spec.size, 10, 8),
              new THREE.MeshStandardMaterial({
                color: spec.color,
                emissive: spec.color,
                emissiveIntensity: 0.18,
                roughness: 0.58,
                metalness: 0.06,
              }),
            );
            system.add(planet);
            planetStates.push({ mesh: planet, radius: spec.radius, speed: spec.speed, angle: index * 2.2 + 0.4 });
          });
          root.add(system);

          const supernovaCoreMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xc7f6ff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          });
          const supernovaCore = new THREE.Sprite(supernovaCoreMaterial);
          supernovaCore.visible = false;
          scene.add(supernovaCore);
          const supernovaRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x9edcff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
          });
          const supernovaRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 72), supernovaRingMaterial);
          supernovaRing.visible = false;
          scene.add(supernovaRing);
          const supernovaOverlay = document.createElement("div");
          supernovaOverlay.className = "ambient-supernova-flash";
          supernovaOverlay.setAttribute("aria-hidden", "true");
          document.body.append(supernovaOverlay);

          const pointer = new THREE.Vector2();
          const pointerVelocity = new THREE.Vector2();
          const projectedStar = new THREE.Vector3();
          const orbitTarget = new THREE.Vector3();
          const supernovaOrigin = new THREE.Vector2();
          const supernovaWorld = new THREE.Vector3();
          const rayPoint = new THREE.Vector3();
          const rayDirection = new THREE.Vector3();
          const interactionRadius = compact ? 0.44 : 0.34;
          let pointerPresent = false;
          let reacting = false;
          let burst = 0;
          let scrollY = window.scrollY;
          let frame = 0;
          let running = true;
          let previousTime = 0;
          let introStart = 0;
          let introComplete = !introEnabled;
          let pulseTimer = 0;
          let wakeUntil = 0;
          let longPressTimer = 0;
          let pressStateTimer = 0;
          let glowCycleTimer = 0;
          let ambientSupernovaTimer = 0;
          let pressPointerId = -1;
          let pressStartedAt = 0;
          let pressStartX = 0;
          let pressStartY = 0;
          let pressOriginX = 0;
          let pressOriginY = 0;
          let longPressFired = false;
          let supernovaActive = false;
          let supernovaStart = 0;
          let supernovaDuration = 0;
          let supernovaProgress = 0;
          let supernovaSerial = 0;
          let supernovaSourceIndex = -1;
          let lastAmbientStar = -1;
          let ambientDueAt = 0;
          let ambientRemainingMs = 0;
          let glowCycle = 0;

          const wakeAnimation = (duration: number) => {
            if (!reducedMotion) return;
            wakeUntil = Math.max(wakeUntil, performance.now() + duration);
            if (running && frame === 0) frame = window.requestAnimationFrame(renderFrame);
          };

          const clearLongPress = (state = "idle") => {
            window.clearTimeout(longPressTimer);
            longPressTimer = 0;
            pressPointerId = -1;
            pressStartedAt = 0;
            host.dataset.pressState = state;
            delete host.dataset.charging;
          };

          const triggerSupernova = (
            source: "long-press" | "scheduled",
            originX: number,
            originY: number,
            sourceIndex = -1,
            worldPosition?: InstanceType<typeof THREE.Vector3>,
          ) => {
            supernovaSerial += 1;
            supernovaActive = true;
            supernovaStart = performance.now();
            supernovaDuration = reducedMotion ? 1_100 : 3_200;
            supernovaProgress = 0;
            supernovaSourceIndex = sourceIndex;
            supernovaOrigin.set(originX, originY);

            if (worldPosition) {
              supernovaWorld.copy(worldPosition);
            } else {
              rayPoint.set(originX, originY, 0.12).unproject(camera);
              rayDirection.copy(rayPoint).sub(camera.position).normalize();
              supernovaWorld.copy(camera.position).addScaledVector(rayDirection, compact ? 23 : 28);
            }

            supernovaCore.position.copy(supernovaWorld);
            supernovaCore.scale.setScalar(0.1);
            supernovaCore.material.opacity = 1;
            supernovaCore.visible = true;
            supernovaRing.position.copy(supernovaWorld);
            supernovaRing.quaternion.copy(camera.quaternion);
            supernovaRing.scale.setScalar(0.1);
            supernovaRing.material.opacity = 0.9;
            supernovaRing.visible = true;
            supernovaOverlay.style.setProperty("--supernova-x", `${(originX + 1) * 50}%`);
            supernovaOverlay.style.setProperty("--supernova-y", `${(1 - originY) * 50}%`);
            supernovaOverlay.style.setProperty("--supernova-duration", `${supernovaDuration}ms`);
            supernovaOverlay.classList.remove("is-active");
            void supernovaOverlay.offsetWidth;
            supernovaOverlay.classList.add("is-active");

            if (sourceIndex >= 0) starStates[sourceIndex].energy = 1;
            burst = 1;
            host.dataset.explosionState = "active";
            host.dataset.explosionSource = source;
            host.dataset.explosionCount = String(supernovaSerial);
            if (sourceIndex >= 0) host.dataset.explosionStar = String(sourceIndex);
            else delete host.dataset.explosionStar;
            host.dispatchEvent(new CustomEvent("joycircuit:ambient-explosion", {
              bubbles: true,
              detail: { source, starIndex: sourceIndex, count: supernovaSerial },
            }));
            wakeAnimation(supernovaDuration + 180);
          };

          const glowPool = Array.from({ length: interactiveCount }, (_, index) => index);
          const selectGlowStars = () => {
            for (const star of starStates) star.glowTarget = 0;
            const requested = 10 + Math.floor(Math.random() * 6);
            const glowCount = Math.min(requested, interactiveCount);
            const glowingStars: number[] = [];
            for (let index = 0; index < glowCount; index += 1) {
              const swapIndex = index + Math.floor(Math.random() * (interactiveCount - index));
              [glowPool[index], glowPool[swapIndex]] = [glowPool[swapIndex], glowPool[index]];
              starStates[glowPool[index]].glowTarget = 1;
              glowingStars.push(glowPool[index]);
            }
            glowCycle += 1;
            host.dataset.glowCount = String(glowCount);
            host.dataset.glowCycle = String(glowCycle);
            host.dataset.glowStars = glowingStars.join(",");
            if (reducedMotion) {
              for (const star of starStates) star.glow = star.glowTarget;
              wakeAnimation(80);
            }
          };

          const scheduleGlowCycle = () => {
            window.clearTimeout(glowCycleTimer);
            glowCycleTimer = window.setTimeout(() => {
              selectGlowStars();
              scheduleGlowCycle();
            }, 8_000 + Math.random() * 5_000);
          };

          const triggerAmbientSupernova = () => {
            if (document.hidden || starStates.length === 0) return;
            let sourceIndex = Math.floor(Math.random() * starStates.length);
            if (sourceIndex === lastAmbientStar && starStates.length > 1) sourceIndex = (sourceIndex + 1) % starStates.length;
            lastAmbientStar = sourceIndex;
            root.updateMatrixWorld(true);
            camera.updateMatrixWorld(true);
            supernovaWorld.copy(starStates[sourceIndex].position).applyMatrix4(root.matrixWorld);
            projectedStar.copy(supernovaWorld).project(camera);
            triggerSupernova("scheduled", projectedStar.x, projectedStar.y, sourceIndex, supernovaWorld);
          };

          const scheduleAmbientSupernova = (delay?: number) => {
            window.clearTimeout(ambientSupernovaTimer);
            const nextDelay = delay ?? (
              AMBIENT_SUPERNOVA_MIN_MS
              + Math.random() * (AMBIENT_SUPERNOVA_MAX_MS - AMBIENT_SUPERNOVA_MIN_MS)
            );
            ambientRemainingMs = nextDelay;
            ambientDueAt = performance.now() + nextDelay;
            host.dataset.nextSupernovaMs = String(Math.round(nextDelay));
            ambientSupernovaTimer = window.setTimeout(() => {
              triggerAmbientSupernova();
              scheduleAmbientSupernova();
            }, nextDelay);
          };

          const resize = () => {
            const width = Math.max(320, host.clientWidth);
            const height = Math.max(320, host.clientHeight);
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          };

          const pointerMove = (event: PointerEvent) => {
            const nextX = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
            const nextY = -(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1);
            pointerVelocity.x = THREE.MathUtils.clamp((nextX - pointer.x) * 12, -1.35, 1.35);
            pointerVelocity.y = THREE.MathUtils.clamp((nextY - pointer.y) * 12, -1.35, 1.35);
            pointer.set(nextX, nextY);
            pointerPresent = true;
            host.dataset.active = "true";
            if (
              pressPointerId === event.pointerId
              && Math.hypot(event.clientX - pressStartX, event.clientY - pressStartY) > 14
              && !longPressFired
            ) {
              clearLongPress();
            }
            wakeAnimation(520);
          };
          const pointerLeave = () => {
            clearLongPress();
            pointer.set(0, 0);
            pointerVelocity.set(0, 0);
            pointerPresent = false;
            reacting = false;
            delete host.dataset.active;
            delete host.dataset.reacting;
          };
          const pointerDown = (event: PointerEvent) => {
            if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
            const nextX = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
            const nextY = -(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1);
            pointer.set(nextX, nextY);
            pointerPresent = true;
            burst = 1;
            host.dataset.pulse = "true";
            window.clearTimeout(pulseTimer);
            pulseTimer = window.setTimeout(() => delete host.dataset.pulse, 520);
            wakeAnimation(780);

            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest("a, button, input, select, textarea, summary, [role='button'], [data-ambient-ignore]")) return;
            clearLongPress();
            window.clearTimeout(pressStateTimer);
            pressPointerId = event.pointerId;
            pressStartedAt = performance.now();
            pressStartX = event.clientX;
            pressStartY = event.clientY;
            pressOriginX = nextX;
            pressOriginY = nextY;
            longPressFired = false;
            host.dataset.pressState = "pending";
            host.dataset.charging = "true";
            wakeAnimation(LONG_PRESS_MS + 240);
            longPressTimer = window.setTimeout(() => {
              if (pressPointerId !== event.pointerId || longPressFired) return;
              longPressTimer = 0;
              pressStartedAt = 0;
              longPressFired = true;
              host.dataset.pressState = "fired";
              delete host.dataset.charging;
              triggerSupernova("long-press", pressOriginX, pressOriginY);
            }, LONG_PRESS_MS);
          };
          const pointerUp = (event: PointerEvent) => {
            if (event.pointerId !== pressPointerId) return;
            const state = longPressFired ? "fired" : "idle";
            clearLongPress(state);
            if (longPressFired) {
              pressStateTimer = window.setTimeout(() => {
                host.dataset.pressState = "idle";
                longPressFired = false;
              }, 620);
            }
          };
          const pointerCancel = () => {
            longPressFired = false;
            clearLongPress();
          };
          const scroll = () => {
            scrollY = window.scrollY;
            wakeAnimation(240);
          };

          const renderFrame = (time: number) => {
            if (!running) return;
            const elapsed = time * 0.001;
            const delta = previousTime === 0 ? 1 / 60 : Math.min((time - previousTime) * 0.001, 0.034);
            previousTime = time;
            const frameScale = delta * 60;
            const motion = reducedMotion ? 0.16 : 1;
            const interactionMotion = reducedMotion ? 0.36 : 1;
            const holdProgress = pressStartedAt > 0
              ? Math.min(1, Math.max(0, (time - pressStartedAt) / LONG_PRESS_MS))
              : 0;
            burst *= Math.pow(0.9, frameScale);
            pointerVelocity.multiplyScalar(Math.pow(0.89, frameScale));

            let supernovaWave = 0;
            let supernovaFlash = 0;
            let supernovaWaveRadius = 0;
            if (supernovaActive) {
              supernovaProgress = Math.min(1, Math.max(0, (time - supernovaStart) / supernovaDuration));
              const waveEase = 1 - Math.pow(1 - supernovaProgress, 3);
              supernovaWave = Math.sin(supernovaProgress * Math.PI);
              supernovaFlash = Math.exp(-supernovaProgress * 5.2);
              supernovaWaveRadius = 0.04 + waveEase * 3;
              const coreScale = 1.1 + waveEase * (compact ? 13 : 19);
              supernovaCore.scale.setScalar(coreScale);
              supernovaCore.material.opacity = Math.max(0, (1 - supernovaProgress) * (0.72 + supernovaFlash * 0.28));
              supernovaRing.scale.setScalar(0.45 + waveEase * (compact ? 17 : 25));
              supernovaRing.material.opacity = Math.max(0, (1 - supernovaProgress) * 0.82);
              supernovaRing.quaternion.copy(camera.quaternion);
              if (supernovaProgress >= 1) {
                supernovaActive = false;
                supernovaSourceIndex = -1;
                supernovaCore.visible = false;
                supernovaRing.visible = false;
                supernovaCore.material.opacity = 0;
                supernovaRing.material.opacity = 0;
                supernovaOverlay.classList.remove("is-active");
                host.dataset.explosionState = "idle";
              }
            }

            let introEase = 1;
            let farBaseOpacity = 0.86;
            if (introEnabled) {
              if (introStart === 0) introStart = time;
              const introProgress = Math.min(1, (time - introStart) / introDuration);
              introEase = 1 - Math.pow(1 - introProgress, 4);
              camera.position.z = THREE.MathUtils.lerp(introCameraStart, 28, introEase);
              camera.fov = THREE.MathUtils.lerp(introFovStart, 46, introEase);
              camera.updateProjectionMatrix();
              system.position.lerpVectors(systemIntroStart, systemTarget, introEase);
              system.scale.setScalar(THREE.MathUtils.lerp(systemIntroScale, systemBaseScale, introEase));
              farStars.scale.setScalar(THREE.MathUtils.lerp(reducedMotion ? 1.04 : 1.45, 1, introEase));
              farBaseOpacity = THREE.MathUtils.lerp(reducedMotion ? 0.72 : 0.25, 0.86, introEase);
              if (introProgress === 1) {
                introComplete = true;
                delete host.dataset.intro;
              }
            }

            const pointerDepth = introEnabled ? introEase : 1;
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.32 * motion * pointerDepth, 0.035);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.22 * motion * pointerDepth - scrollY * 0.00032, 0.035);
            if (!reducedMotion && supernovaActive) {
              const shake = Math.pow(1 - supernovaProgress, 2) * 0.13;
              camera.position.x += Math.sin(elapsed * 92) * shake;
              camera.position.y += Math.cos(elapsed * 78) * shake * 0.72;
            }
            camera.lookAt(0, 0, -22);
            camera.updateMatrixWorld();

            root.rotation.y = pointer.x * 0.009 * motion + Math.sin(elapsed * 0.045) * 0.004 * motion;
            root.rotation.x = pointer.y * -0.006 * motion + supernovaWave * 0.0025 * interactionMotion;
            root.scale.setScalar(1 + supernovaWave * 0.028 * interactionMotion);
            root.updateMatrixWorld(true);

            farStars.rotation.z = elapsed * 0.0018 * motion;
            farStars.position.x = pointer.x * -0.42 * motion;
            farStars.position.y = pointer.y * -0.24 * motion - scrollY * 0.00045;
            farStars.position.z = burst * 0.9 + supernovaWave * 3.8 * interactionMotion;
            farMaterial.opacity = Math.min(1, farBaseOpacity + holdProgress * 0.06 + supernovaFlash * 0.14);
            galaxyBand.rotation.x = -0.3 + Math.sin(elapsed * 0.025) * 0.018 * motion;
            galaxyBand.rotation.z = -0.34 + elapsed * 0.0034 * motion;
            galaxyBand.position.x = (compact ? -2 : 3) + pointer.x * -0.3 * motion + supernovaWave * 0.32 * interactionMotion;
            galaxyBand.position.y = -4 + pointer.y * -0.18 * motion - scrollY * 0.00028 - supernovaWave * 0.22 * interactionMotion;
            galaxyMaterial.opacity = Math.min(0.92, 0.56 + holdProgress * 0.05 + supernovaWave * 0.26 * interactionMotion);
            nebulaGroup.rotation.z = Math.sin(elapsed * 0.04) * 0.018 * motion;
            nebulaStates.forEach((nebula) => {
              nebula.material.opacity = nebula.opacity * (
                0.92
                + Math.sin(elapsed * 0.16 + nebula.phase) * 0.08 * motion
                + supernovaWave * 0.95 * interactionMotion
              );
            });

            let reactionCount = 0;
            const cursorSpeed = pointerVelocity.length();
            for (let index = 0; index < starStates.length; index += 1) {
              const star = starStates[index];
              star.orbitAngle += star.orbitSpeed * delta * motion;
              orbitTarget.set(
                star.center.x + Math.cos(star.orbitAngle) * star.orbitRadius,
                star.center.y + Math.sin(star.orbitAngle) * star.orbitRadius * star.orbitSquash,
                star.center.z + Math.sin(star.orbitAngle * 0.7 + star.phase) * star.orbitRadius * 0.24,
              );
              star.position.copy(orbitTarget).add(star.offset);

              projectedStar.copy(star.position).applyMatrix4(root.matrixWorld).project(camera);
              const dx = (projectedStar.x - pointer.x) * camera.aspect;
              const dy = projectedStar.y - pointer.y;
              const distance = Math.hypot(dx, dy);
              if (pointerPresent && projectedStar.z > -1.2 && projectedStar.z < 1.2 && distance < interactionRadius) {
                reactionCount += 1;
                const safeDistance = Math.max(distance, 0.008);
                const influence = 1 - distance / interactionRadius;
                const push = (1.25 + cursorSpeed * 5.8 + burst * 8.5) * influence * interactionMotion;
                const swirl = (0.16 + cursorSpeed * 1.25 + burst * 0.4) * influence * interactionMotion;
                const radialX = dx / safeDistance;
                const radialY = dy / safeDistance;
                star.velocity.x += (radialX * push - radialY * swirl) * delta;
                star.velocity.y += (radialY * push + radialX * swirl) * delta;
                star.velocity.x += pointerVelocity.x * influence * 0.12 * frameScale * interactionMotion;
                star.velocity.y += pointerVelocity.y * influence * 0.12 * frameScale * interactionMotion;
                star.velocity.z += (cursorSpeed * 0.28 + burst * 1.8) * influence * delta * interactionMotion;
                star.energy = Math.min(1, star.energy + influence * (0.2 + cursorSpeed * 0.2 + burst * 0.45) * interactionMotion);
              }

              if (holdProgress > 0 && distance < interactionRadius * 1.7) {
                const chargeInfluence = 1 - distance / (interactionRadius * 1.7);
                star.energy = Math.max(star.energy, holdProgress * chargeInfluence * 0.9);
              }

              if (supernovaActive && star.lastExplosion !== supernovaSerial) {
                const explosionDx = (projectedStar.x - supernovaOrigin.x) * camera.aspect;
                const explosionDy = projectedStar.y - supernovaOrigin.y;
                const explosionDistance = Math.hypot(explosionDx, explosionDy);
                if (explosionDistance <= supernovaWaveRadius) {
                  star.lastExplosion = supernovaSerial;
                  const safeDistance = Math.max(explosionDistance, 0.012);
                  const phaseX = Math.cos(star.phase);
                  const phaseY = Math.sin(star.phase);
                  const radialX = explosionDistance < 0.02 ? phaseX : explosionDx / safeDistance;
                  const radialY = explosionDistance < 0.02 ? phaseY : explosionDy / safeDistance;
                  const distanceFalloff = 1 - Math.min(0.72, explosionDistance / 4.2);
                  const force = (reducedMotion ? 0.58 : 5.4) * distanceFalloff;
                  star.velocity.x += radialX * force;
                  star.velocity.y += radialY * force;
                  star.velocity.z += (0.45 + Math.abs(Math.sin(star.phase)) * 1.35) * force * 0.3;
                  star.energy = 1;
                }
              }

              star.velocity.addScaledVector(star.offset, -0.46 * delta);
              star.velocity.multiplyScalar(Math.pow(0.987, frameScale));
              const maxSpeed = (2.4 + burst * 1.8 + supernovaWave * 5.4) * interactionMotion;
              if (star.velocity.lengthSq() > maxSpeed * maxSpeed) star.velocity.setLength(maxSpeed);
              star.offset.addScaledVector(star.velocity, delta);
              if (star.offset.lengthSq() > 100) star.offset.setLength(10);

              star.rotation.x += star.spin.x * delta * (motion + star.energy * 1.6);
              star.rotation.y += star.spin.y * delta * (motion + star.energy * 1.6);
              star.rotation.z += star.spin.z * delta * (motion + star.energy * 1.6);
              star.energy *= Math.pow(0.89, frameScale);
              star.glow += (star.glowTarget - star.glow) * Math.min(1, delta * 1.55);
              quaternion.setFromEuler(star.rotation);
              const twinkle = 1 + Math.sin(elapsed * 1.15 + star.phase) * 0.14 * motion;
              const glowPulse = star.glow * (0.68 + Math.sin(elapsed * 2.1 + star.phase) * 0.32 * motion);
              let sourceScale = 1;
              if (supernovaActive && index === supernovaSourceIndex) {
                if (supernovaProgress < 0.1) sourceScale = 1 + supernovaProgress * 34;
                else if (supernovaProgress < 0.42) sourceScale = 0.08;
                else sourceScale = THREE.MathUtils.lerp(0.08, 1, (supernovaProgress - 0.42) / 0.58);
              }
              scale.setScalar(star.size * twinkle * (1 + star.energy * 1.3 + glowPulse * 1.45) * sourceScale);
              matrix.compose(star.position, quaternion, scale);
              interactiveStars.setMatrixAt(index, matrix);
              instanceColor
                .copy(interactivePalette[index % interactivePalette.length])
                .lerp(glowPalette[star.glowColor], Math.min(1, glowPulse + star.energy * 0.48))
                .multiplyScalar(0.78 + glowPulse * 0.48 + star.energy * 0.24);
              interactiveStars.setColorAt(index, instanceColor);
            }
            interactiveStars.instanceMatrix.needsUpdate = true;
            if (interactiveStars.instanceColor) interactiveStars.instanceColor.needsUpdate = true;
            interactiveMaterial.emissiveIntensity = 1.7 + supernovaFlash * 1.15 + supernovaWave * 0.42;

            nearbySystems.rotation.z = elapsed * 0.0018 * motion;
            nearbySystemStates.forEach((nearby, systemIndex) => {
              const driftAngle = elapsed * nearby.driftSpeed * motion + nearby.phase;
              nearby.group.position.set(
                nearby.basePosition.x + Math.cos(driftAngle) * nearby.driftRadius,
                nearby.basePosition.y + Math.sin(driftAngle) * nearby.driftRadius,
                nearby.basePosition.z + Math.sin(driftAngle * 0.7) * nearby.driftRadius * 0.34 + supernovaWave * 0.35 * interactionMotion,
              );
              nearby.group.rotation.z = Math.sin(elapsed * 0.035 + nearby.phase) * 0.06 * motion;
              const stellarPulse = 0.5 + Math.sin(elapsed * (0.72 + systemIndex * 0.06) + nearby.phase) * 0.5;
              nearby.star.scale.setScalar(nearby.size * (1 + stellarPulse * 0.055 * motion + supernovaFlash * 0.22));
              nearby.starMaterial.emissiveIntensity = 2.8 + stellarPulse * 1.15 + supernovaFlash * 2.2;
              nearby.haloMaterial.opacity = 0.38 + stellarPulse * 0.2 + supernovaWave * 0.16 * interactionMotion;
              nearby.halo.scale.setScalar(nearby.size * (8.1 + stellarPulse * 1.2 + supernovaWave * 2.1));
              nearby.haloMaterial.rotation = elapsed * (0.012 + systemIndex * 0.001) * motion;
              nearby.planets.forEach((planet) => {
                planet.angle += planet.speed * delta * motion;
                const orbitY = Math.sin(planet.angle) * planet.radius;
                planet.mesh.position.set(
                  Math.cos(planet.angle) * planet.radius,
                  orbitY * Math.cos(planet.incline),
                  orbitY * Math.sin(planet.incline),
                );
                planet.mesh.rotation.y += delta * 0.28 * motion;
              });
            });

            const nextReacting = pointerPresent && reactionCount > 0;
            if (nextReacting !== reacting) {
              reacting = nextReacting;
              if (reacting) host.dataset.reacting = "true";
              else delete host.dataset.reacting;
            }

            system.rotation.z = Math.sin(elapsed * 0.08) * 0.035 * motion;
            sun.scale.setScalar(1 + Math.sin(elapsed * 1.1) * 0.04 * motion);
            sunGlow.material.rotation = elapsed * 0.02 * motion;
            planetStates.forEach((planet, index) => {
              planet.angle += planet.speed * delta * motion;
              planet.mesh.position.set(
                Math.cos(planet.angle) * planet.radius,
                Math.sin(planet.angle) * planet.radius * (0.98 - index * 0.04),
                Math.sin(planet.angle * 0.7) * 0.12,
              );
            });

            renderer.render(scene, camera);
            if (!reducedMotion || !introComplete || supernovaActive || pressStartedAt > 0 || performance.now() < wakeUntil) {
              frame = window.requestAnimationFrame(renderFrame);
            } else {
              frame = 0;
              previousTime = 0;
            }
          };

          const visibility = () => {
            if (document.hidden) {
              ambientRemainingMs = Math.max(1_000, ambientDueAt - performance.now());
              window.clearTimeout(ambientSupernovaTimer);
              window.clearTimeout(glowCycleTimer);
              pointerCancel();
              running = false;
              window.cancelAnimationFrame(frame);
              frame = 0;
              previousTime = 0;
            } else if (!running) {
              running = true;
              previousTime = 0;
              frame = window.requestAnimationFrame(renderFrame);
              scheduleAmbientSupernova(ambientRemainingMs || undefined);
              scheduleGlowCycle();
            }
          };

          const resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(host);
          window.addEventListener("pointermove", pointerMove, { passive: true });
          window.addEventListener("pointerdown", pointerDown, { passive: true });
          window.addEventListener("pointerup", pointerUp, { passive: true });
          window.addEventListener("pointercancel", pointerCancel);
          window.addEventListener("pointerleave", pointerLeave);
          window.addEventListener("blur", pointerCancel);
          window.addEventListener("scroll", scroll, { passive: true });
          document.addEventListener("visibilitychange", visibility);
          host.dataset.ambientReady = "true";
          host.dataset.orbitCount = String(interactiveCount);
          host.dataset.starGeometry = "sphere";
          host.dataset.emissiveStars = String(interactiveCount + nearbySystemStates.length + 1);
          host.dataset.nearbySystems = String(nearbySystemStates.length);
          host.dataset.visiblePlanets = String(nearbyPlanetCount + planetStates.length);
          host.dataset.spiralArms = String(spiralArmCount);
          host.dataset.pressState = "idle";
          host.dataset.explosionState = "idle";
          resize();
          renderFrame(0);
          selectGlowStars();
          scheduleGlowCycle();
          scheduleAmbientSupernova();

          teardown = () => {
            running = false;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(pulseTimer);
            window.clearTimeout(longPressTimer);
            window.clearTimeout(pressStateTimer);
            window.clearTimeout(glowCycleTimer);
            window.clearTimeout(ambientSupernovaTimer);
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", pointerMove);
            window.removeEventListener("pointerdown", pointerDown);
            window.removeEventListener("pointerup", pointerUp);
            window.removeEventListener("pointercancel", pointerCancel);
            window.removeEventListener("pointerleave", pointerLeave);
            window.removeEventListener("blur", pointerCancel);
            window.removeEventListener("scroll", scroll);
            document.removeEventListener("visibilitychange", visibility);
            scene.traverse((node) => {
              const drawable = node as InstanceType<typeof THREE.Mesh>;
              drawable.geometry?.dispose?.();
              if (Array.isArray(drawable.material)) drawable.material.forEach((entry) => entry.dispose());
              else drawable.material?.dispose?.();
            });
            glowTexture.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
            supernovaOverlay.remove();
          };
        } catch {
          host.dataset.state = "fallback";
        }
      }).catch(() => {
        host.dataset.state = "fallback";
      });
    }, 180);

    return () => {
      disposed = true;
      window.clearTimeout(bootTimer);
      teardown();
    };
  }, [enabled, isHome]);

  return (
    <div
      ref={hostRef}
      className={`ambient-game-field${enabled ? "" : " is-player-route"}`}
      data-home={isHome ? "true" : undefined}
      aria-hidden="true"
    />
  );
}
