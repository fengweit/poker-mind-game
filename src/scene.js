const SCENE_EVENTS = new Set(['deal', 'committed', 'boardReveal', 'showdown']);

/**
 * Serializes purely presentational effects. It intentionally knows nothing
 * about poker state, payouts, or engine actions.
 */
export class SceneController {
  #adapter;
  #epoch = 0;
  #motion;
  #queue = Promise.resolve();
  #disposed = false;

  constructor(adapter, { motion = true } = {}) {
    this.#adapter = adapter;
    this.#motion = Boolean(motion);
    this.#adapter.setMotion?.(this.#motion);
  }

  emit(name, detail = {}) {
    if (this.#disposed || !SCENE_EVENTS.has(name)) return this.#queue;
    const epoch = this.#epoch;
    this.#queue = this.#queue.then(async () => {
      if (this.#disposed || epoch !== this.#epoch) return;
      await this.#adapter.play?.(name, Object.freeze({ ...detail }), {
        epoch,
        motion: this.#motion,
        cancelled: () => this.#disposed || epoch !== this.#epoch
      });
    }).catch(error => console.warn('Scene effect failed:', error));
    return this.#queue;
  }

  setMotion(enabled) {
    this.#motion = Boolean(enabled);
    this.#adapter.setMotion?.(this.#motion);
  }

  reset() {
    if (this.#disposed) return;
    this.#epoch += 1;
    this.#adapter.cancelAll?.();
  }

  idle() { return this.#queue; }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#epoch += 1;
    this.#adapter.cancelAll?.();
    this.#adapter.dispose?.();
  }
}

function supportsWebGL(canvas) {
  try {
    return Boolean(globalThis.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

export async function createCinematicScene(container, { motion = true } = {}) {
  if (!container || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'cinematic-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);

  if (!supportsWebGL(canvas)) {
    canvas.remove();
    container.dataset.renderer = 'fallback';
    return new SceneController(createFallbackAdapter(container), { motion: false });
  }

  try {
    const THREE = await import('three');
    const adapter = createThreeAdapter(THREE, canvas, container);
    container.dataset.renderer = 'webgl';
    return new SceneController(adapter, { motion });
  } catch (error) {
    console.warn('WebGL scene unavailable; using CSS atmosphere.', error);
    canvas.remove();
    container.dataset.renderer = 'fallback';
    return new SceneController(createFallbackAdapter(container), { motion: false });
  }
}

function createFallbackAdapter(container) {
  let timer;
  let moving = false;
  return {
    setMotion(enabled) {
      moving = Boolean(enabled);
      container.classList.toggle('scene-motion', moving);
    },
    play(name) {
      container.dataset.sceneEvent = name;
      container.classList.remove('scene-pulse');
      if (!moving) return;
      void container.offsetWidth;
      container.classList.add('scene-pulse');
      clearTimeout(timer);
      timer = setTimeout(() => container.classList.remove('scene-pulse'), 240);
    },
    cancelAll() {
      clearTimeout(timer);
      container.classList.remove('scene-pulse');
      delete container.dataset.sceneEvent;
    },
    dispose() { clearTimeout(timer); }
  };
}

function createThreeAdapter(THREE, canvas, container) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05090a, 0.045);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 7.4, 12.5);
  camera.lookAt(0, 0.3, 0);

  const standard = (color, roughness = .7, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const box = (size, material, position) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position); scene.add(mesh); return mesh;
  };
  const roomMat = standard(0x111616, .95);
  box([22, .25, 20], roomMat, [0, -2.2, 0]);
  box([22, 11, .25], roomMat, [0, 3, -7]);
  box([.25, 11, 20], roomMat, [-11, 3, 0]);
  box([.25, 11, 20], roomMat, [11, 3, 0]);

  const windowFrame = standard(0x151b1c, .4, .65);
  box([7.6, .18, .2], windowFrame, [4.1, 6.5, -4.58]);
  box([7.6, .18, .2], windowFrame, [4.1, 1.5, -4.58]);
  box([.18, 5.1, .2], windowFrame, [.3, 4, -4.58]);
  box([.18, 5.1, .2], windowFrame, [7.9, 4, -4.58]);
  box([.12, 5, .2], windowFrame, [4.1, 4, -4.57]);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 4.8), new THREE.MeshBasicMaterial({ color: 0x246a7d, transparent: true, opacity: .24 }));
  glass.position.set(4.1, 4, -4.45); scene.add(glass);

  const felt = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, .45, 72), standard(0x176555, .88));
  felt.scale.z = .62; felt.position.y = -.1; felt.receiveShadow = true; scene.add(felt);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(5.42, .28, 16, 80), standard(0x70451f, .46, .34));
  rail.rotation.x = Math.PI / 2; rail.scale.y = .62; rail.position.y = .16; rail.castShadow = true; scene.add(rail);

  const chipMaterial = [standard(0xb33b34, .42, .1), standard(0x61cbd0, .42, .1), standard(0xd39a47, .42, .1)];
  const chips = [];
  for (let pile = 0; pile < 3; pile++) for (let i = 0; i < 7; i++) {
    const chip = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .065, 24), chipMaterial[pile]);
    chip.position.set(-.55 + pile * .55, .2 + i * .07, .3 + Math.abs(1 - pile) * .12);
    chip.castShadow = true; scene.add(chip); chips.push(chip);
  }

  const lamp = new THREE.PointLight(0xf0aa55, 92, 24, 1.7);
  lamp.position.set(-3.1, 4.9, .3); lamp.castShadow = true; scene.add(lamp);
  const cool = new THREE.DirectionalLight(0x66bbdd, 2.3);
  cool.position.set(6, 5, -5); scene.add(cool);
  scene.add(new THREE.HemisphereLight(0x416d82, 0x1b0f09, 1.15));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.4, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x241810, emissive: 0x5b260b, emissiveIntensity: .7, roughness: .5, metalness: .3 }));
  shade.position.copy(lamp.position); shade.position.y += .35; scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffcf87 }));
  bulb.position.copy(lamp.position); scene.add(bulb);
  box([.05, 4.2, .05], windowFrame, [lamp.position.x, 7.35, lamp.position.z]);

  const silhouetteMaterial = new THREE.MeshStandardMaterial({ color: 0x25373b, emissive: 0x08161a, emissiveIntensity: .65, roughness: .86, metalness: 0 });
  const opponentHead = new THREE.Mesh(new THREE.SphereGeometry(.56, 28, 18), silhouetteMaterial);
  opponentHead.position.set(-2.15, 3.65, -2.8); opponentHead.castShadow = true; scene.add(opponentHead);
  const opponentTorso = new THREE.Mesh(new THREE.SphereGeometry(1.18, 28, 18), silhouetteMaterial);
  opponentTorso.scale.set(1.45, .72, .62); opponentTorso.position.set(-2.15, 2.15, -2.85); opponentTorso.castShadow = true; scene.add(opponentTorso);
  const opponentRim = new THREE.PointLight(0x66bbdd, 9, 7, 2);
  opponentRim.position.set(-.4, 3.5, -3.2); scene.add(opponentRim);

  const rainGeometry = new THREE.BufferGeometry();
  const rainCount = 180;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = .5 + Math.random() * 7.4;
    rainPositions[i * 3 + 1] = 1.6 + Math.random() * 4.8;
    rainPositions[i * 3 + 2] = -6.5 + Math.random() * .15;
  }
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0x9ad8e8, size: .035, transparent: true, opacity: .62 }));
  scene.add(rain);

  let running = true;
  let moving = true;
  let raf = 0;
  let started = performance.now();
  const pulses = [];
  const resize = () => {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const render = now => {
    if (!running) return;
    const t = (now - started) / 1000;
    if (moving) {
      rain.position.y = -(t * 1.4 % 4.8);
      lamp.intensity = 92 + Math.sin(t * 2.1) * 2;
      camera.position.x = Math.sin(t * .16) * .12;
      camera.lookAt(0, .3, 0);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i], p = Math.min(1, (now - pulse.start) / pulse.duration);
      pulse.update(p);
      if (p >= 1) { pulse.resolve(); pulses.splice(i, 1); }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);

  const animate = (duration, update) => {
    if (!moving || duration <= 0) { update(1); return Promise.resolve(); }
    return new Promise(resolve => pulses.push({ start: performance.now(), duration, update, resolve }));
  };
  const baseLamp = 92;
  const resetVisuals = () => {
    lamp.color.setHex(0xf0aa55); lamp.intensity = baseLamp;
    felt.scale.set(1, 1, .62); rail.scale.set(1, .62, 1);
    chips.forEach((chip, i) => { chip.rotation.set(0, 0, 0); chip.position.y = .2 + (i % 7) * .07; });
  };

  return {
    setMotion(enabled) {
      moving = Boolean(enabled);
      if (!moving && pulses.length) {
        for (const pulse of pulses.splice(0)) { pulse.update(1); pulse.resolve(); }
        camera.fov = 38; camera.position.set(0, 7.4, 12.5); camera.updateProjectionMatrix(); resetVisuals();
      }
    },
    async play(name, detail, context) {
      if (context.cancelled()) return;
      if (name === 'deal') {
        await animate(520, p => { camera.fov = 38 - Math.sin(p * Math.PI) * 2.2; camera.updateProjectionMatrix(); });
      } else if (name === 'committed') {
        const amount = Math.max(1, Number(detail.amount) || 1);
        await animate(Math.min(520, 180 + amount * 2), p => {
          chips.forEach((chip, i) => { chip.rotation.z = Math.sin(p * Math.PI) * (i % 2 ? .15 : -.15); });
          lamp.intensity = baseLamp + Math.sin(p * Math.PI) * 16;
        });
      } else if (name === 'boardReveal') {
        await animate(460, p => { felt.scale.x = 1 + Math.sin(p * Math.PI) * .018; felt.scale.y = felt.scale.x; });
      } else if (name === 'showdown') {
        await animate(760, p => {
          const heat = Math.sin(p * Math.PI);
          lamp.color.setRGB(1, .55 + heat * .12, .25);
          camera.position.z = 12.5 - heat * .55;
        });
        camera.position.z = 12.5;
      }
      if (!context.cancelled()) resetVisuals();
    },
    cancelAll() {
      for (const pulse of pulses.splice(0)) pulse.resolve();
      camera.fov = 38; camera.position.set(0, 7.4, 12.5); camera.updateProjectionMatrix(); resetVisuals();
    },
    dispose() {
      running = false; cancelAnimationFrame(raf); observer.disconnect(); renderer.dispose(); canvas.remove();
    }
  };
}
