/* CaroStage — scena 3D premium per le Box di Natale del Capperificio Caro.
 Due confezioni nella stessa scena:
   'crate' → cassetta di legno chiaro (Box a Gettoni), si riempie a scelta
   'gift'  → scatola verde effetto lino con 3 finestre (Box Racale 20 €)
 API:
   const st = new CaroStage(canvas, { logoUrl, onPick(id) })
   st.setMode('crate' | 'gift')
   st.setItems([...])           // cassetta: { key, id, kind, fill, title, sub, foot, weight, glass, col, row, span }
   st.setReserved(n)            // vani capperi vuoti (0..3)
   st.setBow(bool)              // fiocco sulla cassetta (completa)
   st.playGift(items3)          // scatola: i 3 vasetti entrano, si chiude, compare il fiocco
   st.dispose()
 Modulo ES: three r160, caricato in lazy dalla pagina /box-di-natale.
 Extra rispetto al prototipo: setActive(bool) mette in pausa il render
 fuori viewport; opts.reducedMotion accelera le molle (niente cadute). */
import * as T from "three";

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// legno chiaro (pioppo/faggio), venatura fine
function paleWood(g, w, h, forBump) {
  g.fillStyle = forBump ? '#808080' : '#e9d6b6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * 1.1; i++) {
    const y = rnd() * h, a = 0.03 + rnd() * 0.09;
    g.strokeStyle = forBump ? `rgba(40,40,40,${a * 1.6})` : `rgba(${rnd() < .7 ? '150,112,70' : '120,86,52'},${a})`;
    g.lineWidth = 0.4 + rnd() * 1.4;
    g.beginPath(); g.moveTo(0, y); let yy = y;
    for (let x = 0; x <= w; x += w / 10) { yy += (rnd() - 0.5) * 2.4; g.lineTo(x, yy); }
    g.stroke();
  }
  if (!forBump) for (let i = 0; i < 6; i++) {
    const y = rnd() * h, gr = g.createLinearGradient(0, y - 12, 0, y + 12);
    gr.addColorStop(0, 'rgba(255,250,240,0)'); gr.addColorStop(.5, 'rgba(255,250,240,.25)'); gr.addColorStop(1, 'rgba(255,250,240,0)');
    g.fillStyle = gr; g.fillRect(0, y - 12, w, 24);
  }
}
// curva molla critica (morbida, senza rimbalzi)
function spring(cur, vel, target, k, zeta, dt) {
  const c = 2 * Math.sqrt(k) * zeta;
  const a = (target - cur) * k - vel * c;
  vel += a * dt; cur += vel * dt;
  return [cur, vel];
}
// nastro piatto lungo una curva (per fiocco e nastro)
function ribbonGeo(points, width, upFn) {
  const pos = [], nor = [], uv = [], idx = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i], q = points[Math.min(n - 1, i + 1)], o = points[Math.max(0, i - 1)];
    const tan = new T.Vector3().subVectors(q, o).normalize();
    const up = upFn ? upFn(i / (n - 1)) : new T.Vector3(0, 0, 1);
    const side = new T.Vector3().crossVectors(tan, up).normalize();
    const nrm = new T.Vector3().crossVectors(side, tan).normalize();
    const a = p.clone().addScaledVector(side, width / 2), b = p.clone().addScaledVector(side, -width / 2);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z); nor.push(nrm.x, nrm.y, nrm.z, nrm.x, nrm.y, nrm.z);
    uv.push(i / (n - 1), 0, i / (n - 1), 1);
    if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

class CaroStage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas; this.opts = opts;
    this.items = new Map(); this.leaving = []; this.labelCache = {};
    this.mode = 'crate'; this.disposed = false; this.logoImg = null;
    this.yaw = 0; this.yawV = 0; this.yawTarget = 0;
    this.bowOn = false; this.bowS = 0; this.bowV = 0;
    this.gift = { t: -1, jars: [], flap: 1, flapV: 0, bowS: 0, bowV: 0 };
    const w = canvas.clientWidth || 390, h = canvas.clientHeight || 320;
    const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(w, h, false); this.fit = Math.max(1.06, 1.42 / (w / h));
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.outputColorSpace = T.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    const scene = this.scene = new T.Scene();
    scene.background = new T.Color(0xefe4d0);
    this.camera = new T.PerspectiveCamera(30, w / h, 0.1, 80);
    this.cam = { pos: new T.Vector3(0, 4.3, 7.3), look: new T.Vector3(0, 0.62, 0.25), posV: new T.Vector3(), lookV: new T.Vector3() };
    this.camTarget = { pos: this.cam.pos.clone(), look: this.cam.look.clone() };
    this.camera.position.copy(this.cam.pos); this.camera.lookAt(this.cam.look);

    this._env(); this._lights(); this._studio();
    this.crateG = new T.Group(); scene.add(this.crateG);
    this.giftG = new T.Group(); scene.add(this.giftG);
    this._crate(); this._tissue(); this._stamps(); this._crateRibbon();
    this.boxG = new T.Group(); scene.add(this.boxG); this._windowBox();
    this.holder = this.crateG; this.wineOn = false;
    this._giftBox(3);
    this.setMode('crate');
    if (opts.logoUrl) { const img = new Image(); img.onload = () => { this.logoImg = img; this.labelCache = {}; this._relabelAll(); }; img.src = opts.logoUrl; }
    this._pointer();
    this.last = performance.now();
    this._loop = this._loop.bind(this);
    this.running = true;
    this.raf = requestAnimationFrame(this._loop);
  }

  // ── studio ───────────────────────────────────────────
  _env() {
    const pm = new T.PMREMGenerator(this.renderer);
    const eq = canvasTex(1024, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#fbf6ec'); gr.addColorStop(.45, '#efe2c8'); gr.addColorStop(.55, '#a8957a'); gr.addColorStop(1, '#6e604e');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // softbox
      g.fillStyle = '#ffffff'; g.fillRect(w * .12, h * .1, w * .2, h * .2); g.fillRect(w * .62, h * .14, w * .1, h * .12);
      g.fillStyle = 'rgba(80,70,56,.6)'; g.fillRect(w * .4, h * .05, w * .12, h * .3);
    });
    eq.mapping = T.EquirectangularReflectionMapping;
    this.scene.environment = pm.fromEquirectangular(eq).texture; pm.dispose();
  }
  _lights() {
    const key = this.key = new T.DirectionalLight(0xfff0dc, 2.2);
    key.position.set(-5, 8, 4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera; sc.left = -4.5; sc.right = 4.5; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 25;
    key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 6; key.shadow.blurSamples = 16;
    this.scene.add(key);
    this.scene.add(new T.HemisphereLight(0xfff6e8, 0xb9a284, 0.55));
    // ombra di foglie d'ulivo proiettata (gobo)
    const gobo = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      const leaf = (x, y, len, ang) => { g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .13, len, 0); g.quadraticCurveTo(len * .5, len * .13, 0, 0); g.fill(); g.restore(); };
      g.fillStyle = 'rgba(70,70,70,.85)';
      for (let c = 0; c < 6; c++) {
        let x = rnd() * w, y = rnd() * h, a = rnd() * 6.28;
        for (let i = 0; i < 12; i++) { x += Math.cos(a) * 14; y += Math.sin(a) * 14; a += (rnd() - .5) * .35; leaf(x, y, 26 + rnd() * 12, a - .9); leaf(x, y, 26 + rnd() * 12, a + .9); }
      }
    });
    const spot = this.spot = new T.SpotLight(0xfff2de, 26, 30, 0.6, 0.9, 1.4);
    spot.position.set(4.5, 7, 1.5); spot.target.position.set(-.5, 0, -1.5);
    spot.map = gobo; spot.castShadow = true; spot.shadow.mapSize.set(512, 512);
    this.scene.add(spot, spot.target);
  }
  _studio() {
    // fondale curvo color crema (ciclorama)
    const segs = 80, L = 22, R = 3.2, W = 30;
    const geo = new T.PlaneGeometry(W, L, 4, segs), p = geo.attributes.position;
    const flat = L - (Math.PI / 2) * R - 6;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), t = (p.getY(i) + L / 2);
      let y, z;
      if (t < flat) { y = 0; z = 10 - t; }
      else if (t < flat + Math.PI / 2 * R) { const a = (t - flat) / R; y = R - Math.cos(a) * R; z = 10 - flat - Math.sin(a) * R; }
      else { y = R + (t - flat - Math.PI / 2 * R); z = 10 - flat - R; }
      p.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    const tex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#efe3cd'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '190,170,140'},${rnd() * .07})`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
    });
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(6, 4);
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, roughness: 1, envMapIntensity: .35 }));
    m.receiveShadow = true;
    this.scene.add(m);
  }

  // ── cassetta (come la foto: stecche spesse, montanti, testate con maniglia) ──
  _crate() {
    const W = this.W = 4.6, D = this.D = 1.86, t = 0.1, H = this.H = 0.58;
    const map = canvasTex(1024, 256, (g, w, h) => paleWood(g, w, h, false));
    const bump = canvasTex(1024, 256, (g, w, h) => paleWood(g, w, h, true), false);
    const wood = this.wood = new T.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: .8, roughness: .72, envMapIntensity: .6 });
    const endMap = map.clone(); endMap.needsUpdate = true; endMap.rotation = Math.PI / 2;
    const G = this.crateG;
    const add = (geo, mat, x, y, z, ry) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; G.add(m); return m; };
    const bev = (w, h, d) => {
      // box smussato: ExtrudeGeometry di un rettangolo con bevel
      const s = new T.Shape(); const r = .012;
      s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
      const geo = new T.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2 });
      geo.translate(0, 0, -(d - 2 * r) / 2);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + .5, uv.getY(i) / h + .5);
      return geo;
    };
    // fondo: 3 doghe
    for (let i = 0; i < 3; i++) add(bev(W + 2 * t, .05, D / 3 - .04), wood, 0, .025, -D / 2 + D / 3 * (i + .5));
    // fianchi lunghi: 2 stecche alte con fessura (la cassetta è bassa)
    const sh = .22;
    [.14, .43].forEach(y => {
      add(bev(W + 2 * t, sh, t), wood, 0, y, D / 2 + t / 2);
      add(bev(W + 2 * t, sh, t), wood, 0, y, -D / 2 - t / 2);
    });
    // testate: 1 stecca bassa + traversa alta spessa con tacca maniglia
    [-1, 1].forEach(sx => {
      const x = sx * (W / 2 + t / 2);
      add(bev(t, sh, D), wood, x, .14, 0, 0);
      const cap = new T.Shape(); const cw = D + 2 * t + .02, ch = .2, nw = .5, nh = .07;
      cap.moveTo(-cw / 2, 0); cap.lineTo(-nw / 2, 0); cap.lineTo(-nw / 2, nh); cap.lineTo(nw / 2, nh); cap.lineTo(nw / 2, 0); cap.lineTo(cw / 2, 0); cap.lineTo(cw / 2, ch); cap.lineTo(-cw / 2, ch); cap.lineTo(-cw / 2, 0);
      const cg = new T.ExtrudeGeometry(cap, { depth: .3, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2 });
      cg.translate(0, 0, -.15);
      const uv = cg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / cw + .5, uv.getY(i) / ch);
      const m = add(cg, wood, x - sx * .1, H - .2 + .06, 0, Math.PI / 2);
    });
    // montanti agli angoli
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(bev(.12, H + .04, .12), wood, sx * (W / 2 - .06), (H + .04) / 2 + .02, sz * (D / 2 - .06)));
    // timbro discreto a fuoco sulla stecca alta frontale
    const stamp = canvasTex(1024, 128, (g, w, h) => {
      g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(86,52,24,.75)'; g.textAlign = 'center';
      g.font = 'italic 64px "PP Editorial Old", Georgia, serif'; g.fillText('Capperificio Caro', w / 2, 70);
      g.font = '500 22px "Paralucent", sans-serif'; g.fillText('R A C A L E  ·  S A L E N T O', w / 2, 108);
    });
    const sm = new T.Mesh(new T.PlaneGeometry(1.7, .21), new T.MeshStandardMaterial({ map: stamp, transparent: true, roughness: .8, depthWrite: false }));
    sm.position.set(0, .43, D / 2 + t + .002); G.add(sm);
  }
  _tissue() {
    // carta velina crema, stropicciata, sul fondo
    const geo = new T.PlaneGeometry(this.W - .02, this.D - .02, 100, 40), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const e = Math.min(this.W / 2 - Math.abs(x), this.D / 2 - Math.abs(y));
      p.setZ(i, Math.abs(Math.sin(x * 6.3 + Math.sin(y * 3) * 2)) * .025 + Math.abs(Math.sin(y * 9.1 + x * 1.7)) * .018 + Math.max(0, .12 - e) * .7);
    }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xf4ede0, roughness: .9, envMapIntensity: .5 }));
    m.rotation.x = -Math.PI / 2; m.position.y = .055; m.receiveShadow = true;
    this.crateG.add(m);
  }
  _stamps() {
    const tex = canvasTex(256, 256, (g, w, h) => {
      g.strokeStyle = 'rgba(84,112,84,.55)'; g.lineWidth = 4; g.setLineDash([12, 10]);
      g.beginPath(); g.arc(w / 2, h / 2, 100, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(84,112,84,.8)'; g.textAlign = 'center';
      g.font = 'italic 36px "PP Editorial Old", Georgia, serif'; g.fillText('Capperificio', w / 2, h / 2 + 12);
    });
    this.stampG = new T.Group(); this.crateG.add(this.stampG);
    this.stampMeshes = [0, 1, 2].map(j => {
      const m = new T.Mesh(new T.PlaneGeometry(.78, .78), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 }));
      m.rotation.x = -Math.PI / 2; const p = this.cellPos(j, 1, 1); m.position.set(p.x, .16, p.z); m.renderOrder = 3;
      this.stampG.add(m); m.userData.o = 1; return m;
    });
  }
  _satin() { return new T.MeshPhysicalMaterial({ color: 0x7a0f17, roughness: .42, metalness: 0, sheen: .6, sheenColor: new T.Color(0x6a1018), sheenRoughness: .5, clearcoat: .35, clearcoatRoughness: .3, envMapIntensity: .7, side: T.DoubleSide }); }
  _bow(scale) {
    // fiocco: due asole, due code a V, nodo
    const g = new T.Group(), mat = this._satin(), w = .14;
    const loop = (s) => {
      const pts = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const r = Math.sin(a / 2); pts.push(new T.Vector3(s * (r * .44 + Math.sin(a) * .03), Math.sin(a) * .17 + r * .06, -r * .16 + Math.sin(a) * .03)); }
      return new T.Mesh(ribbonGeo(pts, w, (t) => new T.Vector3(s * .35, .15, 1).normalize()), mat);
    };
    g.add(loop(1), loop(-1));
    const tail = (s) => {
      const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new T.Vector3(s * (t * .32), -t * .5, .04 + Math.sin(t * 3) * .03)); }
      return new T.Mesh(ribbonGeo(pts, w * .9, () => new T.Vector3(0, 0, 1)), mat);
    };
    g.add(tail(1), tail(-1));
    const knot = new T.Mesh(new T.SphereGeometry(.075, 20, 14), mat); knot.scale.set(1.1, 1, .7); g.add(knot);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.scale.setScalar(scale);
    return g;
  }
  _crateRibbon() {
    // nastro rosso attorno alla cassetta + fiocco sul fronte (compare a cassetta completa)
    const R = this.ribbon = new T.Group(), mat = this._satin();
    const W = this.W + .2 + .02, D = this.D + .2 + .02, y = .3, h = .1;
    const band = (w, d, x, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; R.add(m); };
    band(W, .012, 0, D / 2); band(W, .012, 0, -D / 2); band(.012, D, W / 2, 0); band(.012, D, -W / 2, 0);
    const bow = this._bow(1.15); bow.position.set(.9, y + .02, D / 2 + .08); R.add(bow);
    R.scale.setScalar(.001); R.visible = false;
    this.crateG.add(R);
  }

  // ── scatola regalo verde a 3 finestre ────────────────
  _giftBox(n) {
    if (this.giftBoxG) this.giftG.remove(this.giftBoxG);
    const G = this.giftBoxG = new T.Group(); this.giftG.add(G); this.giftN = n;
    const xs = n === 2 ? [-.42, .42] : [-.82, 0, .82];
    const W = n === 2 ? 1.74 : 2.55, D = .86, H = .74, th = .022;
    this.gW = W; this.gH = H;
    const linenDraw = (g, w, h, bumpy) => {
      g.fillStyle = bumpy ? '#808080' : '#1f5435'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) { g.fillStyle = bumpy ? `rgba(255,255,255,${.15 + rnd() * .2})` : `rgba(${rnd() < .5 ? '60,120,80' : '20,60,36'},${.25 + rnd() * .25})`; g.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 3) { g.fillStyle = bumpy ? `rgba(0,0,0,${.12 + rnd() * .15})` : `rgba(${rnd() < .5 ? '70,130,90' : '16,52,30'},${.18 + rnd() * .2})`; g.fillRect(x, 0, 1, h); }
      for (let i = 0; i < 260; i++) { g.strokeStyle = bumpy ? 'rgba(255,255,255,.4)' : 'rgba(110,160,120,.35)'; g.lineWidth = 1; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + rnd() * 40, y + (rnd() - .5) * 2); g.stroke(); }
    };
    const lmap = canvasTex(512, 512, (g, w, h) => linenDraw(g, w, h, false));
    const lbump = canvasTex(512, 512, (g, w, h) => linenDraw(g, w, h, true), false);
    [lmap, lbump].forEach(t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 2); });
    const linen = new T.MeshStandardMaterial({ map: lmap, bumpMap: lbump, bumpScale: 1.2, roughness: .88, envMapIntensity: .5 });
    const kraft = new T.MeshStandardMaterial({ color: 0xc49a68, roughness: .9 });
    const add = (geo, mat, parent, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || G).add(m); return m; };
    const planeUV = (geo, w, h) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + .5, uv.getY(i) / h); };
    // fronte con 3 finestre ad arco
    const front = new T.Shape(); front.moveTo(-W / 2, 0); front.lineTo(W / 2, 0); front.lineTo(W / 2, H); front.lineTo(-W / 2, H); front.lineTo(-W / 2, 0);
    const ww = .5, wb = .14, wh = .38;
    xs.forEach(cx => {
      const hole = new T.Path(); hole.moveTo(cx - ww / 2, wb); hole.lineTo(cx + ww / 2, wb); hole.lineTo(cx + ww / 2, wb + wh); hole.absarc(cx, wb + wh, ww / 2, 0, Math.PI, false); hole.lineTo(cx - ww / 2, wb);
      front.holes.push(hole);
    });
    const fg = new T.ExtrudeGeometry(front, { depth: th, bevelEnabled: false, curveSegments: 24 }); planeUV(fg, W, H);
    add(fg, [linen, kraft], null, 0, 0, D / 2 - th);
    // retro, fianchi, fondo (interno in kraft)
    add(new T.BoxGeometry(W, H, th), [linen, linen, linen, linen, kraft, linen], null, 0, H / 2, -D / 2 + th / 2);
    [-1, 1].forEach(s => add(new T.BoxGeometry(th, H, D), s > 0 ? [linen, kraft, linen, linen, linen, linen] : [kraft, linen, linen, linen, linen, linen], null, s * (W / 2 - th / 2), H / 2, 0));
    add(new T.BoxGeometry(W, th, D), kraft, null, 0, th / 2, 0);
    // falde superiori incernierate (tetto a capanna + maniglia)
    const slopeH = .26, half = D / 2 - .03, slopeLen = Math.hypot(half, slopeH), ang = Math.atan2(slopeH, half);
    this.flaps = [-1, 1].map(s => {
      const hinge = new T.Group(); hinge.position.set(0, H, s * (D / 2 - th / 2)); G.add(hinge);
      const slope = add(new T.BoxGeometry(W, th, slopeLen), [linen, linen, linen, kraft, linen, linen], hinge, 0, 0, 0);
      slope.rotation.x = s * ang; slope.position.set(0, slopeH / 2, -s * half / 2);
      // metà maniglia con foro
      const hw = W * (n === 2 ? .62 : .78), hh = .34, r = .12;
      const hs = new T.Shape(); hs.moveTo(-hw / 2, 0); hs.lineTo(hw / 2, 0); hs.lineTo(hw / 2, hh - r); hs.quadraticCurveTo(hw / 2, hh, hw / 2 - r, hh); hs.lineTo(-hw / 2 + r, hh); hs.quadraticCurveTo(-hw / 2, hh, -hw / 2, hh - r); hs.lineTo(-hw / 2, 0);
      const hole = new T.Path(); const ow = .5, oh = .1, oy = hh - .17;
      hole.moveTo(-ow / 2 + oh / 2, oy - oh / 2); hole.lineTo(ow / 2 - oh / 2, oy - oh / 2); hole.absarc(ow / 2 - oh / 2, oy, oh / 2, -Math.PI / 2, Math.PI / 2, false); hole.lineTo(-ow / 2 + oh / 2, oy + oh / 2); hole.absarc(-ow / 2 + oh / 2, oy, oh / 2, Math.PI / 2, Math.PI * 1.5, false);
      hs.holes.push(hole);
      const hg = new T.ExtrudeGeometry(hs, { depth: th * .7, bevelEnabled: false, curveSegments: 16 }); planeUV(hg, hw, hh);
      const hm = add(hg, [linen, kraft], hinge, 0, slopeH, -s * half + (s > 0 ? -th * .7 : 0));
      hinge.userData.s = s;
      return hinge;
    });
    // orecchie laterali
    this.ears = [-1, 1].map(s => {
      const hinge = new T.Group(); hinge.position.set(s * (W / 2 - th / 2), H, 0); G.add(hinge);
      const es = new T.Shape(); es.moveTo(-D / 2 + .02, 0); es.lineTo(D / 2 - .02, 0); es.absarc(0, 0, D / 2 - .02, 0, Math.PI, false);
      const hole = new T.Path(); hole.absellipse(0, .2, .14, .05, 0, Math.PI * 2, false); es.holes.push(hole);
      const eg = new T.ExtrudeGeometry(es, { depth: th * .7, bevelEnabled: false, curveSegments: 24 }); planeUV(eg, D, D / 2);
      const em = add(eg, [linen, kraft], hinge, 0, 0, 0); em.rotation.y = Math.PI / 2; em.scale.set(1, .62, 1);
      hinge.userData.s = s; return hinge;
    });
    // fiocco natalizio sulla maniglia
    const bow = this.giftBow = this._bow(.75); bow.position.set(0, H + slopeH + .16, .06); bow.scale.setScalar(.001); bow.visible = false; G.add(bow);
    this.giftJarX = xs;
  }

  // ── scatola verde con coperchio a finestra (Box a Gettoni) ──
  _linenMats() {
    if (this._lm) return this._lm;
    const draw = (g, w, h, bumpy) => {
      g.fillStyle = bumpy ? '#808080' : '#1f4f33'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) { g.fillStyle = bumpy ? `rgba(255,255,255,${.15 + rnd() * .2})` : `rgba(${rnd() < .5 ? '58,112,78' : '18,56,34'},${.25 + rnd() * .25})`; g.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 3) { g.fillStyle = bumpy ? `rgba(0,0,0,${.12 + rnd() * .15})` : `rgba(${rnd() < .5 ? '66,124,86' : '14,48,28'},${.18 + rnd() * .2})`; g.fillRect(x, 0, 1, h); }
    };
    const map = canvasTex(512, 512, (g, w, h) => draw(g, w, h, false));
    const bump = canvasTex(512, 512, (g, w, h) => draw(g, w, h, true), false);
    [map, bump].forEach(t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 2); });
    this._lm = {
      linen: new T.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.1, roughness: .88, envMapIntensity: .5 }),
      kraft: new T.MeshStandardMaterial({ color: 0xc8a273, roughness: .92, envMapIntensity: .5 })
    };
    return this._lm;
  }
  _windowBox() {
    // Come la foto: scatola bassa, quasi quadrata, coperchio a filo con grande finestra arrotondata.
    const G = this.boxG, { linen, kraft } = this._linenMats();
    const W = this.bW = 2.4, D = this.bD = 2.45, t = .03, Hb = this.Hb = .56;
    const add = (geo, mat, parent, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || G).add(m); return m; };
    add(new T.BoxGeometry(W + 2 * t, t, D + 2 * t), kraft, null, 0, t / 2, 0);
    // pareti a doppio spessore (bordo arrotolato come le scatole fustellate)
    add(new T.BoxGeometry(W + 2 * t, Hb, t), [linen, linen, kraft, linen, linen, kraft], null, 0, Hb / 2, D / 2 + t / 2);
    add(new T.BoxGeometry(W + 2 * t, Hb, t), [linen, linen, kraft, linen, kraft, linen], null, 0, Hb / 2, -D / 2 - t / 2);
    add(new T.BoxGeometry(t, Hb, D), [linen, kraft, kraft, linen, linen, linen], null, W / 2 + t / 2, Hb / 2, 0);
    add(new T.BoxGeometry(t, Hb, D), [kraft, linen, kraft, linen, linen, linen], null, -W / 2 - t / 2, Hb / 2, 0);
    // interno: fondo scuro (come nella foto) e carta crespa
    const geo = new T.PlaneGeometry(W - .02, D - .02, 70, 56), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const e = Math.min(W / 2 - Math.abs(x), D / 2 - Math.abs(y)); p.setZ(i, Math.abs(Math.sin(x * 7.3 + Math.sin(y * 3) * 2)) * .02 + Math.abs(Math.sin(y * 8.1 + x * 1.7)) * .015 + Math.max(0, .1 - e) * .6); }
    geo.computeVertexNormals();
    const tissue = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x5a4030, roughness: .85, envMapIntensity: .4 }));
    tissue.rotation.x = -Math.PI / 2; tissue.position.y = .035; tissue.receiveShadow = true; G.add(tissue);
    // coperchio: piano con finestra + bordo che scende sulle pareti, cerniera sul retro
    const LW = W + 2 * t + .04, LD = D + 2 * t + .04, sk = .14, tt = .028;
    const hinge = this.lid = new T.Group(); hinge.position.set(0, Hb - sk + .02, -LD / 2); G.add(hinge);
    const body = new T.Group(); body.position.z = LD / 2; hinge.add(body);
    const top = new T.Shape(); top.moveTo(-LW / 2, -LD / 2); top.lineTo(LW / 2, -LD / 2); top.lineTo(LW / 2, LD / 2); top.lineTo(-LW / 2, LD / 2); top.lineTo(-LW / 2, -LD / 2);
    const ix = LW / 2 - .28, iz = LD / 2 - .3, r = .1, hole = new T.Path();
    hole.moveTo(-ix + r, -iz); hole.lineTo(ix - r, -iz); hole.quadraticCurveTo(ix, -iz, ix, -iz + r); hole.lineTo(ix, iz - r); hole.quadraticCurveTo(ix, iz, ix - r, iz); hole.lineTo(-ix + r, iz); hole.quadraticCurveTo(-ix, iz, -ix, iz - r); hole.lineTo(-ix, -iz + r); hole.quadraticCurveTo(-ix, -iz, -ix + r, -iz);
    top.holes.push(hole);
    const tg = new T.ExtrudeGeometry(top, { depth: tt, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 12 });
    const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / LW + .5, uv.getY(i) / LD + .5);
    const topM = add(tg, [linen, kraft], body, 0, sk, 0); topM.rotation.x = -Math.PI / 2;
    // acetato: leggermente imbarcato, con riflessi
    const ag = new T.PlaneGeometry(ix * 2 + .04, iz * 2 + .04, 12, 12), ap = ag.attributes.position;
    for (let i = 0; i < ap.count; i++) { const x = ap.getX(i), y = ap.getY(i); ap.setZ(i, -(1 - (x / ix) ** 2) * (1 - (y / iz) ** 2) * .012); }
    ag.computeVertexNormals();
    const glass = new T.Mesh(ag, new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .03, transparent: true, opacity: .14, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2.2, depthWrite: false, side: T.DoubleSide }));
    glass.rotation.x = -Math.PI / 2; glass.position.y = sk + .004; glass.renderOrder = 4; body.add(glass);
    add(new T.BoxGeometry(LW, sk, .018), [linen, linen, kraft, linen, linen, kraft], body, 0, sk / 2, LD / 2 - .009);
    add(new T.BoxGeometry(LW, sk, .018), [linen, linen, kraft, linen, kraft, linen], body, 0, sk / 2, -LD / 2 + .009);
    add(new T.BoxGeometry(.018, sk, LD - .036), [linen, kraft, kraft, linen, linen, linen], body, LW / 2 - .009, sk / 2, 0);
    add(new T.BoxGeometry(.018, sk, LD - .036), [kraft, linen, kraft, linen, linen, linen], body, -LW / 2 + .009, sk / 2, 0);
    // nastro rosso che abbraccia il coperchio sul lato destro + fiocco sul fronte
    const R = this.lidRibbon = new T.Group(), sat = this._satin(), bx = LW / 2 - .2;
    [[.12, .012, LD + .03, bx, sk + tt + .008, 0], [.12, sk + .03, .012, bx, sk / 2, LD / 2 + .008], [.12, sk + .03, .012, bx, sk / 2, -LD / 2 - .008]].forEach(([a, b, c, x, y, z]) => { const m = new T.Mesh(new T.BoxGeometry(a, b, c), sat); m.position.set(x, y, z); m.castShadow = true; R.add(m); });
    const bow = this._bow(.95); bow.position.set(bx, sk * .5, LD / 2 + .06); R.add(bow);
    R.scale.setScalar(.001); R.visible = false; body.add(R);
    this.lidA = -1.85; this.lidV = 0; this.lidClosed = false;
    this._carrier();
  }
  _carrier() {
    const C = this.carrier = new T.Group(), cw = .66, ch = 1.62, th = .02;
    const cor = (g, w, h, bumpy) => {
      g.fillStyle = bumpy ? '#808080' : '#c4a277'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 5) { g.fillStyle = bumpy ? 'rgba(255,255,255,.5)' : 'rgba(232,206,166,.6)'; g.fillRect(x, 0, 2, h); g.fillStyle = bumpy ? 'rgba(0,0,0,.4)' : 'rgba(140,108,70,.45)'; g.fillRect(x + 2, 0, 1, h); }
      for (let y = 40; y < h; y += 70) { g.fillStyle = bumpy ? 'rgba(255,255,255,.2)' : 'rgba(246,232,206,.35)'; g.fillRect(0, y, w, 1); }
    };
    const map = canvasTex(256, 512, (g, w, h) => cor(g, w, h, false)), bump = canvasTex(256, 512, (g, w, h) => cor(g, w, h, true), false);
    const k = new T.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.4, roughness: .9, envMapIntensity: .5 });
    const inner = new T.MeshStandardMaterial({ color: 0x8a6a46, roughness: 1 });
    const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; C.add(m); return m; };
    const fr = new T.Shape(); fr.moveTo(-cw / 2, 0); fr.lineTo(cw / 2, 0); fr.lineTo(cw / 2, ch); fr.lineTo(-cw / 2, ch); fr.lineTo(-cw / 2, 0);
    const hw = .13, hole = new T.Path(); hole.moveTo(-hw, .12); hole.lineTo(hw, .12); hole.lineTo(hw, .82); hole.absarc(0, .82, hw, 0, Math.PI, false); hole.lineTo(-hw, .12); fr.holes.push(hole);
    const fg = new T.ExtrudeGeometry(fr, { depth: th, bevelEnabled: false, curveSegments: 16 });
    const uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / cw + .5, uv.getY(i) / ch);
    add(fg, [k, inner], 0, 0, cw / 2 - th);
    add(new T.BoxGeometry(cw, ch, th), [k, k, k, k, inner, k], 0, ch / 2, -cw / 2 + th / 2);
    add(new T.BoxGeometry(th, ch, cw), [k, inner, k, k, k, k], cw / 2 - th / 2, ch / 2, 0);
    add(new T.BoxGeometry(th, ch, cw), [inner, k, k, k, k, k], -cw / 2 + th / 2, ch / 2, 0);
    add(new T.BoxGeometry(cw, th, cw), inner, 0, th / 2, 0);
    // tetto a capanna e linguetta con maniglia
    const rise = .26, slope = Math.hypot(cw / 2, rise), a = Math.atan2(rise, cw / 2);
    [-1, 1].forEach(s => { const m = add(new T.BoxGeometry(cw, th, slope), k, 0, ch + rise / 2, s * cw / 4); m.rotation.x = s * a; });
    [-1, 1].forEach(s => { const tri = new T.Shape(); tri.moveTo(-cw / 2, 0); tri.lineTo(cw / 2, 0); tri.lineTo(0, rise); tri.lineTo(-cw / 2, 0); const m = add(new T.ExtrudeGeometry(tri, { depth: th, bevelEnabled: false }), k, s * (cw / 2) - (s > 0 ? th : 0), ch, 0); m.rotation.y = Math.PI / 2; });
    const tg = new T.Shape(); const tw = cw * .92, tl = .42; tg.moveTo(-tw / 2, 0); tg.lineTo(tw / 2, 0); tg.lineTo(tw / 2, tl); tg.lineTo(-tw / 2, tl); tg.lineTo(-tw / 2, 0);
    const oh = new T.Path(); oh.absellipse(0, tl * .6, .12, .06, 0, Math.PI * 2, false); tg.holes.push(oh);
    const tgg = new T.ExtrudeGeometry(tg, { depth: th, bevelEnabled: false, curveSegments: 16 });
    const tm = add(tgg, [k, inner], 0, ch + rise - tl + .02, cw / 2 * .15); tm.rotation.x = -.18;
    C.userData.y = 3.2; C.userData.v = 0; C.position.set(this.bW / 2 + .5, 3.2, -this.bD / 2 + .25); C.rotation.y = .35; C.scale.setScalar(.92); C.visible = false;
    this.boxG.add(C);
    this.carrierBottle = null;
  }
  _tin(d) {
    const g = new T.Group(), R = .35;
    const body = new T.Mesh(new T.CylinderGeometry(R, R, .24, 48), new T.MeshPhysicalMaterial({ color: d.tin || 0x8c1c24, metalness: .55, roughness: .35, clearcoat: .6 })); body.position.y = .12;
    const lid = new T.Mesh(new T.CylinderGeometry(R + .012, R + .012, .08, 48), new T.MeshPhysicalMaterial({ color: 0xc9a24e, metalness: 1, roughness: .3 })); lid.position.y = .27;
    const lab = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#f3ead6'; c.beginPath(); c.arc(w / 2, h / 2, 126, 0, 6.28); c.fill(); c.strokeStyle = '#8c1c24'; c.lineWidth = 5; c.beginPath(); c.arc(w / 2, h / 2, 112, 0, 6.28); c.stroke(); c.fillStyle = '#5a1418'; c.textAlign = 'center'; const words = d.title.split(' '); const mid = Math.ceil(words.length / 2); const l1 = words.slice(0, mid).join(' '), l2 = words.slice(mid).join(' '); let fs = 40; c.font = `italic ${fs}px "PP Editorial Old", Georgia, serif`; const mw = Math.max(c.measureText(l1).width, c.measureText(l2).width); if (mw > 196) { fs = Math.floor(fs * 196 / mw); c.font = `italic ${fs}px "PP Editorial Old", Georgia, serif`; } c.fillText(l1, w / 2, 122); c.fillText(l2, w / 2, 162); });
    const top = new T.Mesh(new T.CircleGeometry(R * .78, 40), new T.MeshStandardMaterial({ map: lab, roughness: .7 })); top.rotation.x = -Math.PI / 2; top.position.y = .312;
    g.add(body, lid, top); return g;
  }
  setLid(closed) { this.lidClosed = !!closed; }
  setWine(d) {
    const C = this.carrier;
    if (!d) { this.wineOn = false; return; }
    this.wineOn = true;
    if (!this.carrierBottle) {
      const b = this._bottle(d), pivot = b.children[0], inner = pivot.children[0];
      pivot.rotation.z = 0; pivot.position.y = 0; inner.position.y = .02;
      b.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      C.add(b); this.carrierBottle = b;
    }
  }

  _labelTex(d) {
    const key = [d.id, d.kind, !!this.logoImg].join('|');
    if (this.labelCache[key]) return this.labelCache[key];
    const kraft = d.label === 'kraft';
    const t = canvasTex(2048, 270, (g, w, h) => {
      g.fillStyle = kraft ? '#e2c995' : '#2E4B36'; g.fillRect(0, 0, w, h);
      // grana carta
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .035})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
      const x0 = w / 2 - 256, ink = kraft ? '#2C4A2C' : '#F3EEE2';
      g.fillStyle = ink; g.textAlign = 'left';
      const titleSize = d.title.length > 16 ? 34 : 40;
      g.font = `500 ${titleSize}px "Paralucent", "Helvetica Neue", Arial, sans-serif`;
      g.fillText(d.title, x0 + 22, 92);
      g.font = '300 25px "Paralucent", "Helvetica Neue", Arial, sans-serif';
      g.fillText(d.sub || '', x0 + 22, 128);
      g.font = '300 21px "Paralucent", "Helvetica Neue", Arial, sans-serif';
      g.fillText(d.foot || '', x0 + 22, 232);
      g.textAlign = 'right'; g.font = '500 24px "Paralucent", "Helvetica Neue", Arial, sans-serif';
      g.fillText(d.weight || '', x0 + 490, 232);
      // logo CARO
      g.textAlign = 'center'; g.font = '500 17px "Paralucent", sans-serif';
      g.fillText('·CARO·', x0 + 440, 52);
      if (this.logoImg && !kraft) g.drawImage(this.logoImg, x0 + 410, 58, 60, 86);
      else { g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 412, 64); g.lineTo(x0 + 468, 64); g.lineTo(x0 + 468, 120); g.lineTo(x0 + 440, 146); g.lineTo(x0 + 412, 120); g.closePath(); g.stroke(); }
    });
    this.labelCache[key] = t; return t;
  }
  _fillTex(kind) {
    const key = 'fill|' + kind;
    if (this.labelCache[key]) return this.labelCache[key];
    const P = {
      capers: ['#4a5432', [[96, 104, 62], [122, 128, 78], [74, 82, 46]], 15, 650, true],
      powder: ['#7b7a4c', [[110, 108, 70], [92, 92, 58], [140, 136, 92]], 2.2, 9000, false],
      leaves: ['#3e4d2c', [[52, 70, 38], [84, 100, 58], [40, 52, 30]], 16, 500, false],
      cucunci: ['#6f7a46', [[110, 122, 70], [138, 146, 92], [90, 100, 56]], 16, 520, true],
      honey: ['#d79a24', [[230, 170, 50], [200, 130, 20]], 30, 60, false],
      jam: ['#7d2228', [[120, 30, 36], [150, 46, 50]], 22, 120, false],
      taralli: ['#d7a868', [[220, 176, 112], [196, 150, 90]], 24, 160, true]
    }[kind] || ['#5d6640', [[86, 96, 56]], 10, 1200, true];
    const t = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = P[0]; g.fillRect(0, 0, w, h);
      for (let i = 0; i < P[3]; i++) {
        const c = P[1][Math.floor(rnd() * P[1].length)], r = P[2] * (.6 + rnd() * .6), x = rnd() * w, y = rnd() * h;
        if (P[4]) {
          const gr = g.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r);
          gr.addColorStop(0, `rgb(${c[0] + 40},${c[1] + 40},${c[2] + 30})`); gr.addColorStop(1, `rgb(${c[0] - 20},${c[1] - 20},${c[2] - 14})`);
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
        } else { g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.8)`; g.beginPath(); g.ellipse(x, y, r, r * .55, rnd() * 3, 0, 6.28); g.fill(); }
      }
      if (kind === 'capers') for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3); }
    });
    t.wrapS = T.RepeatWrapping;
    this.labelCache[key] = t; return t;
  }
  _jar(d, tall) {
    const g = new T.Group();
    const H = tall ? 0.7 : 0.54, R = 0.36;
    const prof = [[0, 0], [R - .04, 0], [R - .005, .015], [R, .05], [R, H - .09], [R - .02, H - .045], [R - .05, H - .03], [R - .05, H - .01]].map(p => new T.Vector2(p[0], p[1]));
    const glass = new T.Mesh(new T.LatheGeometry(prof, 48), new T.MeshPhysicalMaterial({ color: 0xf2f7f4, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide }));
    glass.renderOrder = 2;
    const fill = new T.Mesh(new T.CylinderGeometry(R - .035, R - .035, H - .14, 40), new T.MeshStandardMaterial({ map: this._fillTex(d.fill), roughness: 0.55 }));
    fill.position.y = (H - .14) / 2 + .02;
    const labH = tall ? 0.36 : 0.3;
    const label = new T.Mesh(new T.CylinderGeometry(R + .003, R + .003, labH, 64, 1, true), new T.MeshStandardMaterial({ map: this._labelTex(d), roughness: 0.85 }));
    label.position.y = .07 + labH / 2 + (tall ? .04 : 0); label.rotation.y = Math.PI; label.userData.isLabel = true;
    const lidMat = new T.MeshPhysicalMaterial({ color: 0xc4c7c4, metalness: 1, roughness: 0.3, clearcoat: .25, envMapIntensity: 1.1 });
    const lid = new T.Group();
    const band = new T.Mesh(new T.CylinderGeometry(R + .022, R + .022, .12, 64), lidMat); band.position.y = H + .03;
    const top = new T.Mesh(new T.CylinderGeometry(R - .005, R + .018, .025, 64), lidMat); top.position.y = H + .1;
    const rim = new T.Mesh(new T.TorusGeometry(R + .006, .014, 10, 64), lidMat); rim.rotation.x = Math.PI / 2; rim.position.y = H + .09;
    lid.add(band, top, rim);
    g.add(fill, label, glass, lid);
    g.userData.height = H + .14;
    return g;
  }
  _bottle(d) {
    // bottiglia sdraiata su due vani
    const g = new T.Group(), pivot = new T.Group();
    const prof = [[0, 0], [.25, 0], [.28, .03], [.28, .82], [.24, .95], [.13, 1.08], [.11, 1.15], [.11, 1.36], [.125, 1.38], [.125, 1.44], [0, 1.44]].map(p => new T.Vector2(p[0], p[1]));
    const col = d.glass || 0x3b4a22;
    const body = new T.Mesh(new T.LatheGeometry(prof, 40), new T.MeshPhysicalMaterial({ color: col, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5 }));
    const cap = new T.Mesh(new T.CylinderGeometry(.13, .13, .18, 24), new T.MeshStandardMaterial({ color: d.cap || 0x2c4a2c, roughness: .6 }));
    cap.position.y = 1.36;
    const label = new T.Mesh(new T.CylinderGeometry(.284, .284, .44, 48, 1, true), new T.MeshStandardMaterial({ map: this._labelTex({ ...d, label: 'kraft' }), roughness: .9 }));
    label.position.y = .42; label.rotation.y = -Math.PI / 2; label.userData.isLabel = true;
    const inner = new T.Group(); inner.add(body, cap, label); inner.position.y = -0.72;
    pivot.add(inner); pivot.rotation.z = Math.PI / 2; pivot.position.y = .28 + .02;
    g.add(pivot); g.userData.height = .6;
    return g;
  }
  _bag(d) {
    // sacchetto di carta kraft (pasta, taralli) sdraiato
    const g = new T.Group();
    const geo = new T.BoxGeometry(1.5, .34, .78, 12, 4, 8);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - Math.pow(Math.abs(x) / .75, 6) * .35; p.setY(i, y * k + (y > 0 ? Math.sin(x * 9 + z * 7) * .012 : 0)); p.setZ(i, z * (1 - Math.pow(Math.abs(x) / .75, 8) * .12)); }
    geo.computeVertexNormals();
    const bag = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xc8a06a, roughness: .95 }));
    bag.position.y = .17;
    const card = canvasTex(512, 256, (g2, w, h) => {
      g2.fillStyle = '#f1e4c6'; g2.fillRect(0, 0, w, h); g2.strokeStyle = '#547054'; g2.lineWidth = 6; g2.strokeRect(10, 10, w - 20, h - 20);
      g2.fillStyle = '#2C4A2C'; g2.textAlign = 'center'; g2.font = 'italic 64px "PP Editorial Old", Georgia, serif'; g2.fillText(d.title, w / 2, 126);
      g2.font = '500 22px "Paralucent", sans-serif'; g2.fillText((d.sub || '').toUpperCase(), w / 2, 188);
    });
    const lab = new T.Mesh(new T.PlaneGeometry(.8, .4), new T.MeshStandardMaterial({ map: card, roughness: .9 }));
    lab.rotation.x = -Math.PI / 2; lab.position.y = .345;
    g.add(bag, lab); g.userData.height = .36;
    return g;
  }

  _build(d) {
    const root = new T.Group(); root.userData.itemId = d.id;
    const body = d.kind === 'bottle' ? this._bottle(d) : d.kind === 'bag' ? this._bag(d) : d.kind === 'tin' ? this._tin(d) : this._jar(d, d.kind === 'tall' && this.mode !== 'box');
    root.add(body); root.userData.body = body;
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return root;
  }
  _relabelAll() {
    const re = (root, d) => root.traverse(o => { if (o.userData.isLabel) { o.material.map = this._labelTex(d.kind === 'bottle' ? { ...d, label: 'kraft' } : d); o.material.needsUpdate = true; } });
    this.items.forEach(it => re(it.root, it.d));
    this.gift.jars.forEach(j => re(j.root, j.d));
  }
  cellPos(col, row, span) {
    if (this.mode === 'box') {
      const px = this.bW / 3, pz = this.bD / 3, rr = row;
      return { x: -this.bW / 2 + px * (col + .5), z: this.bD / 2 - pz * (rr + .5) };
    }
    const px = this.W / 5, pz = this.D / 2, c = span === 2 ? col + .5 : col;
    return { x: -this.W / 2 + px * (c + .5), z: -this.D / 2 + pz * (row + .5) };
  }

  // ── API ──────────────────────────────────────────────
  setMode(m) {
    this.mode = m;
    const h = m === 'box' ? this.boxG : this.crateG;
    if (h !== this.holder) { this.holder = h; h.add(this.stampG); this.items.forEach(it => h.add(it.root)); }
    this.stampMeshes.forEach((st, j) => { const q = this.cellPos(j, m === 'box' ? 0 : 1, 1); st.position.set(q.x, m === 'box' ? .09 : .16, q.z); st.scale.setScalar(m === 'box' ? .85 : 1); });
    if (m === 'gift') { const two = this.giftN === 2; this.camTarget.pos.set(0, two ? 2.3 : 2.5, two ? 4.1 : 5.0); this.camTarget.look.set(0, .78, 0); }
    else if (m === 'box') { this.camTarget.pos.set(0, 4.4, 5.6); this.camTarget.look.set(.3, .66, -.3); }
    else { this.camTarget.pos.set(0, 4.3, 7.3); this.camTarget.look.set(0, .62, .25); }
  }
  setItems(list) {
    const want = new Map(list.map(d => [d.key, d]));
    this.items.forEach((it, key) => { if (!want.has(key)) { this.items.delete(key); it.t = 0; this.leaving.push(it); } });
    let stagger = 0;
    list.forEach(d => {
      const p = this.cellPos(d.col, d.row, d.span || 1), it = this.items.get(d.key);
      if (it) { it.tx = p.x; it.tz = p.z; return; }
      const root = this._build(d);
      let ts = 1;
      if (this.mode === 'box') {
        const b = root.userData.body; ts = .78;
        if (d.kind === 'squat' || d.kind === 'tall') { b.rotation.x = -Math.PI / 2; b.position.set(0, .38, (b.userData.height || .68) / 2); }
        else if (d.kind === 'bottle') { b.scale.setScalar(.66); }
      }
      const ry = this.mode === 'box' ? (rnd() - .5) * .12 : d.kind === 'bottle' || d.kind === 'bag' ? (rnd() - .5) * .08 : (rnd() - .5) * .35;
      const nit = { d, root, x: p.x, z: p.z, tx: p.x, tz: p.z, y: 1.5, vy: 0, ry: ry + .5, rv: 0, tRy: ry, delay: stagger, s: ts * .92, sv: 0, ts };
      stagger += .07;
      root.position.set(p.x, nit.y, p.z); root.visible = false;
      this.holder.add(root); this.items.set(d.key, nit);
    });
  }
  setReserved(n) { this.stampMeshes.forEach((m, j) => { m.userData.target = j >= 3 - n ? 1 : 0; }); }
  setBow(on) { this.bowOn = !!on; }
  playGift(list) {
    // svuota e ricomincia: i vasetti entrano uno per volta, poi si chiude, poi il fiocco
    if (list.length !== this.giftN) this._giftBox(list.length === 2 ? 2 : 3);
    this.gift.jars.forEach(j => this.giftG.remove(j.root));
    this.gift.jars = list.slice(0, this.giftN).map((d, i) => {
      const root = this._build(d); root.position.set(this.giftJarX[i], 2.2, 0); root.visible = false; this.giftG.add(root);
      return { d, root, y: 2.2, vy: 0, start: .35 + i * .42 };
    });
    this.gift.t = 0; this.gift.flap = 1; this.gift.flapV = 0; this.gift.bowS = 0; this.gift.bowV = 0;
    this.giftBow.visible = false; this.giftBow.scale.setScalar(.001);
    this.setMode(this.mode);
  }

  _pointer() {
    const el = this.canvas; let down = null;
    this._pd = e => { down = { x: e.clientX, yaw: this.yawTarget, moved: false }; };
    this._pm = e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) down.moved = true; this.yawTarget = Math.max(-.6, Math.min(.6, down.yaw + dx * .005)); };
    this._pu = e => {
      if (!down) return; const was = down; down = null;
      if (was.moved || this.mode === 'gift' || this.lidClosed || !this.opts.onPick) return;
      const r = el.getBoundingClientRect();
      const ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const rc = new T.Raycaster(); rc.setFromCamera(ndc, this.camera);
      const roots = []; this.items.forEach(it => roots.push(it.root));
      const hit = rc.intersectObjects(roots, true)[0]; if (!hit) return;
      let o = hit.object; while (o && !o.userData.itemId) o = o.parent;
      if (o) this.opts.onPick(o.userData.itemId);
    };
    el.addEventListener('pointerdown', this._pd); el.addEventListener('pointermove', this._pm);
    el.addEventListener('pointerup', this._pu); el.addEventListener('pointercancel', this._pu); el.addEventListener('pointerleave', this._pu);
  }

  _loop(now) {
    if (this.disposed || !this.running) return;
    this.raf = requestAnimationFrame(this._loop);
    const dt = Math.min((now - this.last) / 1000, 1 / 30); this.last = now;
    if (this.opts.reducedMotion) { for (let i = 0; i < 40; i++) this._tick(1 / 60, now / 1000); }
    else this._tick(dt, now / 1000);
    this.renderer.render(this.scene, this.camera);
  }
  setActive(on) {
    if (this.disposed) return;
    if (on && !this.running) { this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this._loop); }
    else if (!on && this.running) { this.running = false; cancelAnimationFrame(this.raf); }
  }
  step(sec) { for (let t = 0; t < sec; t += 1 / 60) this._tick(1 / 60, t); }
  _tick(dt, time) {
    // camera morbida tra le due inquadrature
    ['pos', 'look'].forEach(k => {
      const c = this.cam[k], v = this.cam[k + 'V'], tg = this.camTarget[k];
      ['x', 'y', 'z'].forEach(a => { const r = spring(c[a], v[a], tg[a], 22, 1, dt); c[a] = r[0]; v[a] = r[1]; });
    });
    // scena stretta (mobile, verticale): la camera arretra per non tagliare la scatola
    const fit = this.fit || 1;
    this.camera.position.copy(this.cam.look).addScaledVector(this.cam.pos.clone().sub(this.cam.look), fit); this.camera.lookAt(this.cam.look);
    // rotazione col dito, ritorno dolce
    this.yawTarget *= Math.pow(.25, dt);
    [this.yaw, this.yawV] = spring(this.yaw, this.yawV, this.yawTarget, 40, 1, dt);
    const idle = Math.sin(time * .3) * .025;
    // visibilità/ingresso delle due confezioni
    const gOn = this.mode === 'gift';
    this.crateG.visible = this.mode === 'crate'; this.boxG.visible = this.mode === 'box'; this.giftG.visible = gOn;
    this.crateG.rotation.y = -.42 + this.yaw + idle;
    this.boxG.rotation.y = -.32 + this.yaw + idle;
    // coperchio della scatola: si apre all'indietro, si chiude a scatola completa
    [this.lidA, this.lidV] = spring(this.lidA, this.lidV, this.lidClosed ? 0 : -1.85, 34, .92, dt);
    this.lid.rotation.x = this.lidA;
    const rb = this.bowS * Math.max(0, 1 - Math.abs(this.lidA) * 3);
    this.lidRibbon.visible = rb > .01; this.lidRibbon.scale.setScalar(Math.max(.001, rb));
    // portabottiglia del vino: scende accanto alla scatola
    const C = this.carrier; let cy = C.userData.y, cv = C.userData.v;
    [cy, cv] = spring(cy, cv, this.wineOn ? 0 : 3.2, 70, .85, dt); C.userData.y = cy; C.userData.v = cv;
    C.position.y = cy; C.visible = cy < 3.1;
    this.giftG.rotation.y = -.38 + this.yaw + idle;

    // prodotti nella cassetta: discesa morbida (molla quasi critica), leggera rotazione
    this.items.forEach(it => {
      if (it.delay > 0) { it.delay -= dt; return; }
      it.root.visible = true;
      [it.y, it.vy] = spring(it.y, it.vy, this.mode === 'box' ? .04 : .06, 90, .82, dt);
      [it.ry, it.rv] = spring(it.ry, it.rv, it.tRy, 60, .9, dt);
      [it.s, it.sv] = spring(it.s, it.sv, it.ts || 1, 120, .7, dt);
      it.x += (it.tx - it.x) * Math.min(1, dt * 10); it.z += (it.tz - it.z) * Math.min(1, dt * 10);
      it.root.position.set(it.x, it.y, it.z); it.root.rotation.y = it.ry; it.root.scale.setScalar(it.s);
    });
    for (let i = this.leaving.length - 1; i >= 0; i--) {
      const it = this.leaving[i]; it.t += dt; const k = Math.min(1, it.t / .32), e = k * k * (3 - 2 * k);
      it.root.position.y = it.y + e * .9; it.root.scale.setScalar(Math.max(.001, 1 - e));
      if (k >= 1) { if (it.root.parent) it.root.parent.remove(it.root); this.leaving.splice(i, 1); }
    }
    this.stampMeshes.forEach(m => { const tg = m.userData.target ?? 1; m.userData.o += (tg - m.userData.o) * Math.min(1, dt * 8); m.material.opacity = m.userData.o; m.visible = m.userData.o > .02; });
    // nastro e fiocco della cassetta
    [this.bowS, this.bowV] = spring(this.bowS, this.bowV, this.bowOn ? 1 : 0, 70, .62, dt);
    this.ribbon.visible = this.mode === 'crate' && this.bowS > .01; this.ribbon.scale.setScalar(Math.max(.001, this.bowS));

    // sequenza della scatola regalo
    const g = this.gift;
    if (g.t >= 0) {
      g.t += dt;
      g.jars.forEach(j => {
        if (g.t < j.start) return; j.root.visible = true;
        [j.y, j.vy] = spring(j.y, j.vy, .025, 80, .85, dt);
        j.root.position.y = j.y;
      });
      const closeAt = .35 + (g.jars.length - 1) * .42 + .9;
      [g.flap, g.flapV] = spring(g.flap, g.flapV, g.t > closeAt ? 0 : 1, 45, .9, dt);
      const bowAt = closeAt + .7;
      [g.bowS, g.bowV] = spring(g.bowS, g.bowV, g.t > bowAt ? 1 : 0, 80, .55, dt);
    }
    this.flaps.forEach(h => { h.rotation.x = h.userData.s * g.flap * 1.3; });
    this.ears.forEach(h => { h.rotation.z = -h.userData.s * g.flap * 1.0; });
    this.giftBow.visible = g.bowS > .01; this.giftBow.scale.setScalar(Math.max(.001, g.bowS * 1.05));
    this.giftBow.rotation.z = (1 - Math.min(1, g.bowS)) * .5;
  }
  resize() { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.fit = Math.max(1.06, 1.42 / (w / h)); this.camera.updateProjectionMatrix(); }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); const el = this.canvas;
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave'].forEach((n, i) => el.removeEventListener(n, [this._pd, this._pm, this._pu, this._pu, this._pu][i]));
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(mm => { Object.values(mm).forEach(v => { if (v && v.isTexture) v.dispose(); }); mm.dispose(); }); });
    this.renderer.dispose();
  }
}
export default CaroStage;
