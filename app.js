(() => {
  const D = window.DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'tahun2-bc-kantu:v1';
  const qs = new URLSearchParams(location.search);
  const DEBUG = qs.has('debug');
  const CN = ['g', 'b', 'p', 'y', 'l'];          // 五指颜色：草绿 天蓝 蜜桃 奶黄 薰衣草
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── 舞台等比缩放 ───────── */
  const stage = $('#stage');
  let scale = 1;
  function fit() {
    const w = innerWidth, h = innerHeight;
    scale = Math.min(w / 1600, h / 900);
    stage.style.transform = `translate(${(w - 1600 * scale) / 2}px,${(h - 900 * scale) / 2}px) scale(${scale})`;
  }
  addEventListener('resize', fit); fit();

  /* ───────── 状态 ───────── */
  const fresh = () => ({
    step: 0, found: [], light: false,
    sel: {}, cur: 0,
    order: null, slots: [null, null, null, null, null], ok: [false, false, false, false, false],
    masked5: false, show6: false, checks: [false, false, false],
    timer: { remain: 780 }, sound: true
  });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  let saveT = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  const cnt = (t) => (t.match(/[一-鿿]/g) || []).length;

  /* ───────── 句子积木 ───────── */
  const blank = { k: 'b' };
  function sentence(fi) {
    const s = S.sel, o = (v, h) => v ? { t: v, k: 'o', h } : { k: 'b', h };
    switch (fi) {
      case 0: return [o(s.t, '时间'), { t: '，我在' }, o(s.p, '地点'), { t: '发现一个心愿瓶。' }];
      case 1: return [{ t: '它是' }, o(s.shape, '形状'), { t: '的，瓶口系着' }, o(s.ribbon, '丝带'), { t: '，里面装着' }, o(s.inside, '里面有什么'), { t: '。' }];
      case 2: return [{ t: '我在纸条上写下' }, o(s.wish, '什么愿望'), { t: '，然后把纸条放进瓶里。' }];
      case 3: {
        const r = s.wish && s.reason != null ? D.REASONS[s.wish][s.reason] : null;
        return [{ t: '因为', k: 'w' }, r ? { t: r[0], k: 'o', h: '为什么' } : { k: 'b', h: '为什么' }, { t: '，' }, { t: '所以', k: 'w' }, r ? { t: r[1], k: 'o', h: '想怎样' } : { k: 'b', h: '想怎样' }, { t: '。' }];
      }
      default: return [{ t: '如果愿望实现了，我会' }, o(s.mood, '心情'), { t: '，也会' }, o(s.act, '会做什么'), { t: '。' }];
    }
  }
  const complete = (segs) => !segs.some((x) => x.k === 'b');
  const fingerDone = (fi) => complete(sentence(fi));
  const allDone = () => [0, 1, 2, 3, 4].every(fingerDone);
  const text = (segs) => segs.map((x) => x.k === 'b' ? '' : x.t).join('');
  function segsHTML(segs, mask, hint) {
    const hs = hint || mask;
    segs = segs.map((x) => Object.assign({}, x));
    return segs.map((x, i) => {
      if (x.k === 'b' || (mask && x.k === 'o')) {
        if (!hs) return '<span class="blank"></span>';
        let tail = '';
        const nx = segs[i + 1];
        if (nx && !nx.k && /^[，。]/.test(nx.t)) { tail = nx.t[0]; nx.t = nx.t.slice(1); }   // 空格和后面的标点不拆行
        return `<span class="nb"><span class="blank hint"><em>（${x.h || ''}）</em></span>${tail}</span>`;
      }
      if (x.k === 'w') return `<b class="kw">${x.t}</b>`;
      if (x.k === 'o') return `<span class="opt">${x.t}</span>`;
      return x.t;
    }).join('');
  }
  // 段落：第 3 步用已完成的句子；第 5 步全做完才用全班的，否则范文
  function paraDone() { return [0, 1, 2, 3, 4].filter(fingerDone).map((i) => ({ i, segs: sentence(i) })); }
  function paraFull() {
    if (allDone()) return { model: false, items: [0, 1, 2, 3, 4].map((i) => ({ i, segs: sentence(i) })) };
    return { model: true, items: D.MODEL_SEGS.map((segs, i) => ({ i, segs })) };
  }
  function paraHTML(items, mask, nodot) {
    return '<span class="indent"></span>' + items.map((x) => `<span class="sent c-${CN[x.i]}">${nodot ? '' : `<sup class="pdot c-${CN[x.i]}">${x.i + 1}</sup>`}${segsHTML(x.segs, mask)}</span>`).join('');
  }
  const lastN = {};
  function barHTML(n, key) {
    const pop = n >= 40 && (lastN[key] || 0) < 40;
    lastN[key] = n;
    const pct = Math.min(100, n / 60 * 100);
    return `<div class="count ${n >= 40 ? 'done' : ''} ${pop ? 'pop' : ''}">
      <div class="track"><div class="fill" style="width:${pct}%"></div><div class="tick" style="left:${40 / 60 * 100}%"><em>40</em></div></div>
      <div class="num"><i class="ph-fill ph-star"></i><b>${n}</b> 字</div></div>`;
  }

  /* ───────── 各步画面 ───────── */
  const head = (i, extra = '') => `<header class="hd"><div class="no">${i + 1}</div><h1>${D.STEPS[i]}</h1><div class="hd-r">${extra}</div></header>`;
  const icon = (n) => `<i class="ph-fill ph-${n}"></i>`;

  function r0() {
    const reqs = ['根据图画', '写成一个段落', '不少于40个字'];
    return `${head(0)}
    <div class="s0">
      <div class="s0-l">
        <div class="tag">看图写一个段落</div>
        <h2 class="s0-title">心愿瓶</h2>
        <div class="task">${D.TASK}</div>
        <div class="reqs">${reqs.map((t, i) => `<div class="req c-${CN[[0, 1, 4][i]]}"><i class="ph-fill ph-${['image', 'paragraph', 'text-aa'][i]}"></i>${t}</div>`).join('')}</div>
      </div>
      <div class="s0-r"><img src="assets/scene.jpg" alt=""></div>
    </div>`;
  }

  /* 第 1 步：手电筒 */
  const L = { x: 500, y: 370, fly: null, bounce: null, fx: [], fxn: 0 };
  const W0 = D.SCENE.w, H0 = D.SCENE.h;
  const pc = (v, t) => (v / t * 100).toFixed(2) + '%';
  function hotFound(w) { return S.found.includes(w); }
  function center(h) { const r = h.r[0]; return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]; }   // 原图像素
  function nextHint() { return [...D.HOTSPOTS].sort((a, b) => a.pri - b.pri).find((h) => !hotFound(h.w)); }
  // 临时效果（浮现的词、提示文字、脉动光环）：记开始时间，重画时接着播
  function fxHTML() {
    const now = Date.now();
    L.fx = L.fx.filter((f) => now - f.start < f.dur);
    return L.fx.map((f) => {
      const st = `left:${f.pctx ? pc(f.x, W0) : f.x + 'px'};top:${f.pctx ? pc(f.y, H0) : f.y + 'px'};animation-delay:${-(now - f.start)}ms`;
      return `<div class="${f.cls}" data-fx="${f.id}" style="${st}">${f.text || ''}</div>`;
    }).join('');
  }
  function addFx(o) {
    o.id = ++L.fxn; o.start = Date.now(); o.pctx = o.cls !== 's1-toast';
    L.fx.push(o);
    setTimeout(() => { L.fx = L.fx.filter((f) => f.id !== o.id); const n = document.querySelector(`[data-fx="${o.id}"]`); if (n) n.remove(); }, o.dur + 60);
  }
  function r1() {
    let ov = '';
    D.HOTSPOTS.forEach((h, n) => {
      const show = S.light || DEBUG;
      if (show) h.r.forEach((r) => { ov += `<div class="hot ${hotFound(h.w) ? 'got' : ''}" style="left:${pc(r[0], W0)};top:${pc(r[1], H0)};width:${pc(r[2] - r[0], W0)};height:${pc(r[3] - r[1], H0)}"></div>`; });
      if (S.light) ov += `<div class="hlab" style="left:${pc(h.a[0], W0)};top:${pc(h.a[1], H0)}"><i>${n + 1}</i>${h.w}</div>`;
      if (hotFound(h.w)) ov += `<div class="hchk" style="left:${pc(h.a[0], W0)};top:${pc(h.a[1], H0)}">${icon('check-circle')}</div>`;
    });
    const cells = [];
    for (let i = 0; i < 12; i++) cells.push(S.found[i] ? `<div class="wc c-${CN[i % 5]}" data-w="${S.found[i]}">${S.found[i]}</div>` : '<div class="wc qm">？</div>');
    const n = S.found.length;
    return `<div class="s1">
      <div class="s1-wrap ${S.light ? 'light' : ''}" id="s1wrap" style="--x:${L.x}px;--y:${L.y}px">
        <img src="assets/scene.jpg" alt="">${ov}<div class="s1-mask"></div><div class="s1-ring"></div>${fxHTML()}
      </div>
      <aside class="s1-lib">
        <div class="lib-h"><span class="no">2</span><h1>看图找一找</h1></div>
        <h2>我们找到了</h2>
        <div class="lib-n">已找到 <b>${n}</b> / 12</div>
        <div class="lib-grid">${cells.join('')}</div>
        <div class="lib-btns">
          <button class="btn" data-act="light">${icon(S.light ? 'lightbulb-filament' : 'flashlight')}${S.light ? '关灯' : '开灯'}</button>
          <button class="btn ghost" data-act="hint1">${icon('crosshair')}提示</button>
          <button class="btn ghost" data-act="redo1">${icon('arrow-counter-clockwise')}重来</button>
        </div>
      </aside>
    </div>`;
  }
  function placeSpot() {
    const w = $('#s1wrap'); if (w) { w.style.setProperty('--x', L.x + 'px'); w.style.setProperty('--y', L.y + 'px'); }
  }
  // 重叠时：未找到的里面面积最小的；全都找过了才回报已找到的
  function hit(px, py) {
    const k = W0 / 1000, x = px * k, y = py * k;
    const c = [];
    D.HOTSPOTS.forEach((h) => {
      let a = Infinity;
      h.r.forEach((r) => { if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) a = Math.min(a, (r[2] - r[0]) * (r[3] - r[1])); });
      if (a < Infinity) c.push({ h, a });
    });
    if (!c.length) return null;
    const un = c.filter((o) => !hotFound(o.h.w)), pool = un.length ? un : c;
    pool.sort((p, q) => p.a - q.a || p.h.pri - q.h.pri);
    return { h: pool[0].h, already: !un.length };
  }
  function toast(text) {
    const R = 150, x = Math.max(200, Math.min(800, L.x));
    let y = L.y + R + 12; if (y > 690) y = L.y - R - 64;
    addFx({ cls: 's1-toast', text, x, y: Math.max(8, y), dur: 1200 });
  }
  function onS1Click(e, wrap) {
    const rc = wrap.getBoundingClientRect();
    const px = (e.clientX - rc.left) / rc.width * 1000, py = (e.clientY - rc.top) / rc.width * 1000;
    L.x = px; L.y = py;
    const r = hit(px, py);
    if (!r) { toast('这里没有，换个地方照照'); return render(); }
    const h = r.h;
    if (r.already) { toast('找过了：' + h.w); L.bounce = h.w; return render(); }
    S.found.push(h.w);
    const c = center(h);
    addFx({ cls: 's1-pop', text: h.w, x: c[0], y: c[1], dur: 1000 });
    L.fly = { w: h.w, cx: c[0], cy: c[1] };
    render();
  }

  /* 第 2 步 */
  function chips(slot, opts, cls) {
    return opts.map((v) => `<button class="chip ${cls} ${S.sel[slot] === v ? 'on' : ''}" data-act="pick" data-slot="${slot}" data-v="${v}">${v}</button>`).join('');
  }
  function r2() {
    const segs = sentence(1), t = text(segs), n = cnt(t);
    return `${head(2)}
    <div class="s2">
      <div class="jar"><img src="assets/scene.jpg" alt=""></div>
      <div class="s2-r">
        <div class="grp c-b"><label>形状</label><div class="row">${chips('shape', D.SHAPE, 'c-b')}</div></div>
        <div class="grp c-g"><label>丝带</label><div class="row">${chips('ribbon', D.RIBBON, 'c-g')}</div></div>
        <div class="grp c-p"><label>里面</label><div class="row">${chips('inside', D.INSIDE, 'c-p')}</div></div>
      </div>
      <div class="s2-sent"><div class="sent-big">${segsHTML(segs)}</div><div class="sent-n">${n} 字</div></div>
    </div>`;
  }

  /* 第 3 步 */
  function actsFor() { const e = D.ACT_EXTRA[S.sel.wish]; return e ? [...D.ACTS_BASE, e] : D.ACTS_BASE; }
  function panel3() {
    const fi = S.cur, f = D.FINGERS[fi], segs = sentence(fi);
    let body = '';
    const g = (lab, inner, c) => `<div class="grp c-${c}"><label>${lab}</label><div class="row">${inner}</div></div>`;
    if (fi === 0) body = g('时间', chips('t', D.T.时间, 'c-g'), 'g') + g('地点', chips('p', D.T.地点, 'c-g'), 'g');
    if (fi === 1) body = g('形状', chips('shape', D.SHAPE, 'c-b'), 'b') + g('丝带', chips('ribbon', D.RIBBON, 'c-b'), 'b') + g('里面', chips('inside', D.INSIDE, 'c-b'), 'b');
    if (fi === 2) body = g('愿望', chips('wish', D.WISHES, 'c-p'), 'p');
    if (fi === 3) {
      if (!S.sel.wish) body = `<div class="need">${icon('arrow-fat-left')}先选愿望</div>`;
      else body = D.REASONS[S.sel.wish].map((r, i) => `<button class="chip c-y long ${S.sel.reason === i ? 'on' : ''}" data-act="pick" data-slot="reason" data-v="${i}">因为${r[0]}，所以${r[1]}。</button>`).join('');
    }
    if (fi === 4) body = g('心情', chips('mood', D.MOOD, 'c-l'), 'l') + g('行动', chips('act', actsFor(), 'c-l'), 'l');
    return `<div class="q c-${CN[fi]}"><span>${fi + 1}</span>${f.q}</div>
      <div class="pat">${segsHTML(segs)}</div><div class="opts">${body}</div>`;
  }
  function r3() {
    const items = paraDone(), t = items.map((x) => text(x.segs)).join(''), n = cnt(t);
    const fing = D.FINGERS.map((f, i) => `<button class="fg c-${CN[i]} ${S.cur === i ? 'cur' : ''} ${fingerDone(i) ? 'done' : ''}" data-act="finger" data-i="${i}">
      <span class="fn">${i + 1}</span><span class="fl"><small>${f.name}</small><b>${f.label}</b></span><i class="ph-fill ph-check-circle ck"></i></button>`).join('');
    return `${head(3, `<button class="btn sm" data-act="shuffle3">${icon('dice-five')}换一组</button><button class="btn sm ghost" data-act="clear3">${icon('arrow-counter-clockwise')}清空</button>`)}
    <div class="s3">
      <div class="fgs">${fing}</div>
      <div class="p3 c-${CN[S.cur]}">${panel3()}</div>
      <div class="para-card"><div class="para ${items.length ? '' : 'empty'}">${items.length ? paraHTML(items, false, true) : '选好一根手指的答案，我们的段落就会长出来'}</div>${barHTML(n, 3)}</div>
    </div>`;
  }
  function changeSel(slot, v) {
    if (slot === 'reason') v = +v;
    S.sel[slot] = v;
    if (slot === 'wish') {
      delete S.sel.reason;
      if (S.sel.act && !actsFor().includes(S.sel.act)) delete S.sel.act;
    }
  }
  function randomAll() {
    const pk = (a) => a[Math.floor(Math.random() * a.length)];
    const s = { t: pk(D.T.时间), p: pk(D.T.地点), shape: pk(D.SHAPE), ribbon: pk(D.RIBBON), inside: pk(D.INSIDE), wish: pk(D.WISHES), mood: pk(D.MOOD) };
    s.reason = Math.floor(Math.random() * 2);
    S.sel = s; s.act = pk(actsFor());
  }

  /* 第 4 步 */
  function shuffleOrder() {
    let a;
    do { a = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5); } while (a.every((v, i) => v === i));
    S.order = a; S.slots = [null, null, null, null, null]; S.ok = [false, false, false, false, false]; wrong = new Set();
  }
  let wrong = new Set();
  const solved4 = () => S.slots.every((v, i) => v === i && S.ok[i]);
  function r4() {
    if (!S.order) shuffleOrder();
    const btns = `<button class="btn sm" data-act="check4">${icon('check-fat')}检查</button><button class="btn sm ghost" data-act="shuffle4">${icon('shuffle')}重新打乱</button>`;
    if (solved4()) {
      const html = D.MODEL.map((s, i) => `<span class="sent c-${CN[i]}">${s.replace(/(然后|因为|所以|如果)/g, '<mark>$1</mark>')}</span>`).join('');
      return `${head(4, btns)}<div class="s4 win"><div class="para big"><span class="indent"></span>${html}</div><div class="win-msg">${icon('sparkle')}用这些词，句子就连起来了。</div></div>`;
    }
    const placed = new Set(S.slots.filter((v) => v != null));
    const pool = S.order.filter((id) => !placed.has(id)).map((id) => `<div class="strip" draggable="true" data-act="place" data-id="${id}">${D.MODEL[id]}</div>`).join('');
    const slots = S.slots.map((v, i) => {
      const w = wrong.has(i);
      if (v == null) return `<div class="slot ${w ? 'bad' : ''}" data-slot="${i}"><span class="sd c-${CN[i]}">${i + 1}</span>${w ? '<span class="again">再想想</span>' : ''}</div>`;
      return `<div class="slot has ${S.ok[i] ? 'good' : ''}" data-slot="${i}" data-act="unplace" data-i="${i}"><span class="sd c-${CN[i]}">${i + 1}</span><span class="st">${D.MODEL[v]}</span>${S.ok[i] ? icon('check-circle') : ''}</div>`;
    }).join('');
    return `${head(4, btns)}<div class="s4"><div class="col"><h3>打乱的句子</h3><div class="pool">${pool || '<div class="pool-empty">句子都放好了</div>'}</div></div>
      <div class="col"><h3>排成一段</h3><div class="slots">${slots}</div></div></div>`;
  }

  /* 第 5 步 */
  function r5() {
    const p = paraFull(), n = cnt(p.items.map((x) => text(x.segs)).join(''));
    return `${head(5, `<button class="switch ${S.masked5 ? 'on' : ''}" data-act="mask5"><span class="knob"></span>盖住</button>`)}
    <div class="s5">${p.model ? '<div class="model-tag">范文</div>' : ''}
      <div class="para big ${S.masked5 ? 'masked' : ''}">${paraHTML(p.items, S.masked5)}</div>
      ${barHTML(n, 5)}</div>`;
  }

  /* 第 6 步 */
  const fmt = (s) => { s = Math.ceil(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  let tm = { running: false, end: 0 };
  function wordsBank() {
    const ws = [...S.found];
    ['shape', 'ribbon', 'inside'].forEach((k) => { if (S.sel[k]) ws.push(S.sel[k]); });
    return ws;
  }
  function r6() {
    const sk = `<div class="s6-para">${[0, 1, 2, 3, 4].map((i) => `<span class="s6-sen">${segsHTML(sentence(i).map((x) => x.k === 'o' ? { k: 'b', h: x.h } : x), false, true)}</span>`).join('')}</div>`;
    const r = S.timer.remain;
    const ws = wordsBank();
    const p = paraFull();
    return `${head(6, `<button class="switch ${S.show6 ? 'on' : ''}" data-act="show6"><span class="knob"></span>看我们的段落</button>`)}
    <div class="s6">
      <div class="sks">${sk}</div>
      <div class="s6-r">
        <div class="clock ${r <= 60 && r > 0 ? 'warn' : ''} ${r <= 0 ? 'zero' : ''}"><div class="tnum" id="tnum">${fmt(r)}</div>
          <div class="tbtn"><button class="btn sm ghost" data-act="tdec">${icon('minus')}1 分</button>
          <button class="btn" data-act="tgo" id="tgo">${icon(tm.running ? 'pause' : 'play')}${tm.running ? '暂停' : '开始'}</button>
          <button class="btn sm ghost" data-act="tinc">${icon('plus')}1 分</button>
          <button class="btn sm ghost" data-act="treset">${icon('arrow-counter-clockwise')}重设</button>
          <button class="btn sm ghost sq" data-act="snd" title="提示音">${icon(S.sound ? 'speaker-high' : 'speaker-slash')}</button></div></div>
        <div class="bank"><h3>词语库</h3><div class="bank-w ${ws.length > 10 ? 'tight' : ''}">${ws.length ? ws.map((w) => `<span class="wc plain">${w}</span>`).join('') : '<span class="lib-empty">第 1、2 步找到的词会在这里</span>'}</div></div>
      </div>
      <div class="tips"><span class="c-g">抄句型，换上你的词</span><span class="c-b">用句型，自己写</span><span class="c-p">多写一点心愿瓶的样子</span></div>
      ${S.show6 ? `<div class="over" data-act="show6"><div class="over-in"><div class="over-t">我们的段落${p.model ? '（范文）' : ''}</div><div class="para big">${paraHTML(p.items)}</div></div></div>` : ''}
    </div>`;
  }

  /* 第 7 步 */
  function r7() {
    const items = [
      ['五根手指都写到了吗？', '<div class="five">' + CN.map((c, i) => `<span class="fn c-${c}">${i + 1}</span>`).join('') + '</div>'],
      ['每一句都有标点吗？', '<div class="pun">，。</div>'],
      ['数一数，够 40 个字吗？', '<div class="pun">40<small>字</small></div>']
    ];
    return `${head(7)}<div class="s7">${items.map((it, i) => `<button class="chk ${S.checks[i] ? 'on' : ''}" data-act="chk" data-i="${i}"><span class="box">${icon('check-fat')}</span><span class="ct">${it[0]}</span>${it[1]}</button>`).join('')}
      <div class="last">把作业本举到镜头前。</div></div>`;
  }

  const RENDER = [r0, r1, r2, r3, r4, r5, r6, r7];

  /* ───────── 渲染 ───────── */
  const screens = $('#screens');
  let shown = -1;
  function render() {
    const i = S.step;
    const enter = shown !== i; shown = i;
    screens.innerHTML = `<section class="step st${i} ${enter ? 'enter' : ''}">${RENDER[i]()}</section>`;
    placeSpot();
    renderNav();
    if (i === 1) {
      if (L.fly) {
        const f = L.fly; L.fly = null;
        const card = $(`.wc[data-w="${f.w}"]`), wrap = $('#s1wrap');
        if (card && wrap && !reduced) {
          const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
          const sx = (wr.left + f.cx / D.SCENE.w * wr.width - sr.left) / scale, sy = (wr.top + f.cy / D.SCENE.h * wr.height - sr.top) / scale;
          const dx = sx - ((cr.left + cr.width / 2 - sr.left) / scale), dy = sy - ((cr.top + cr.height / 2 - sr.top) / scale);
          card.animate([{ transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0 }, { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0, offset: .64 }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 1, offset: .66 }, { transform: 'translate(0,0) scale(1.12)', opacity: 1, offset: .92 }, { transform: 'none' }], { duration: 1450, easing: 'cubic-bezier(.2,.8,.3,1)' });
        }
      }
      if (L.bounce) {
        const card = $(`.wc[data-w="${L.bounce}"]`); L.bounce = null;
        if (card && !reduced) card.animate([{ transform: 'none' }, { transform: 'scale(1.28)', offset: .35 }, { transform: 'scale(.94)', offset: .65 }, { transform: 'none' }], { duration: 480 });
      }
    }
    fitAll();
    clearTimeout(saveT); saveT = setTimeout(save, 60);
  }
  // 句子放不下就把字号 44 -> 38 -> 34，不靠绝对定位叠放
  function fitAll() {
    const p3 = $('.p3');
    if (p3) { const pat = $('.pat', p3); for (const z of [44, 38, 34]) { pat.style.fontSize = z + 'px'; if (p3.scrollHeight <= p3.clientHeight + 1) break; } }
    const s2 = $('.s2-sent');
    if (s2) { const t = $('.sent-big', s2); for (const z of [48, 40, 34]) { t.style.fontSize = z + 'px'; if (s2.scrollHeight <= s2.clientHeight + 1) break; } }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  function renderNav() {
    $('#nav').innerHTML = `<div class="dots">${D.STEPS.map((n, i) => `<button class="dot ${i === S.step ? 'on' : ''} ${i < S.step ? 'past' : ''}" data-act="go" data-i="${i}"><i>${i + 1}</i><span>${n}</span></button>`).join('')}</div>
      <div class="nav-r"><button class="nbtn" data-act="again" title="全部重来">${icon('arrow-counter-clockwise')}</button><button class="nbtn q" data-act="hint" title="提示">${icon('question')}</button></div>`;
  }
  function go(i) {
    i = Math.max(0, Math.min(7, i));
    if (i === S.step) return;
    S.step = i; hideHint(); render();
  }

  /* ───────── 提示、确认 ───────── */
  function hideHint() { $('#hintCard').hidden = true; }
  function toggleHint() {
    const c = $('#hintCard');
    if (!c.hidden) return hideHint();
    c.innerHTML = `<h4>${icon('chalkboard-teacher')}给老师</h4><p>${D.HINTS[S.step]}</p>`;
    c.hidden = false;
  }
  function askAgain() {
    const m = $('#modal');
    m.innerHTML = `<div class="dlg"><p>全部重来？</p><small>已找到的词、选好的句子、计时都会清空。</small><div><button class="btn ghost" data-act="mno">取消</button><button class="btn" data-act="myes">全部重来</button></div></div>`;
    m.hidden = false;
  }

  /* ───────── 计时 ───────── */
  let ac = null;
  function beep() {
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 1.3);
    } catch (e) { }
  }
  function tstop() { if (tm.running) { S.timer.remain = Math.max(0, (tm.end - Date.now()) / 1000); tm.running = false; } }
  setInterval(() => {
    if (!tm.running) return;
    const r = Math.max(0, (tm.end - Date.now()) / 1000);
    S.timer.remain = r;
    const el = $('#tnum');
    if (el) {
      el.textContent = fmt(r);
      const clock = el.parentElement; clock.classList.toggle('warn', r <= 60 && r > 0); clock.classList.toggle('zero', r <= 0);
    }
    if (r <= 0) {
      tm.running = false; save();
      const t = $('#timesup'); t.hidden = false; beep();
      if (S.step === 6) render();
    }
  }, 250);
  setInterval(() => { if (tm.running) save(); }, 3000);

  /* ───────── 动作 ───────── */
  const A = {
    go: (el) => go(+el.dataset.i),
    hint: toggleHint,
    again: askAgain,
    mno: () => { $('#modal').hidden = true; },
    myes: () => { tstop(); const sound = S.sound; S = fresh(); S.sound = sound; Object.keys(lastN).forEach((k) => delete lastN[k]); wrong = new Set(); $('#modal').hidden = true; render(); },
    hint1: () => { const h = nextHint(); if (h) { const c = center(h); addFx({ cls: 's1-pulse', x: c[0], y: c[1], dur: 2000 }); render(); } },
    light: () => { S.light = !S.light; render(); },
    redo1: () => { S.found = []; render(); },
    pick: (el) => { changeSel(el.dataset.slot, el.dataset.v); render(); },
    finger: (el) => { S.cur = +el.dataset.i; render(); },
    shuffle3: () => { randomAll(); render(); },
    clear3: () => { S.sel = {}; S.cur = 0; render(); },
    place: (el) => { const k = S.slots.indexOf(null); if (k >= 0) { S.slots[k] = +el.dataset.id; S.ok[k] = false; render(); } },
    unplace: (el) => { const i = +el.dataset.i; S.slots[i] = null; S.ok[i] = false; render(); },
    check4: () => {
      wrong = new Set();
      S.slots.forEach((v, i) => { if (v == null) return; if (v === i) S.ok[i] = true; else { wrong.add(i); S.slots[i] = null; S.ok[i] = false; } });
      render();
      if (wrong.size) setTimeout(() => { wrong = new Set(); if (S.step === 4) render(); }, 1500);
    },
    shuffle4: () => { shuffleOrder(); render(); },
    mask5: () => { S.masked5 = !S.masked5; render(); },
    show6: () => { S.show6 = !S.show6; render(); },
    tgo: () => {
      if (tm.running) tstop();
      else { if (S.timer.remain <= 0) S.timer.remain = 780; tm.end = Date.now() + S.timer.remain * 1000; tm.running = true; $('#timesup').hidden = true; }
      render();
    },
    tinc: () => adj(60), tdec: () => adj(-60),
    treset: () => { tstop(); S.timer.remain = 780; $('#timesup').hidden = true; render(); },
    snd: () => { S.sound = !S.sound; render(); },
    chk: (el) => { const i = +el.dataset.i; S.checks[i] = !S.checks[i]; render(); }
  };
  function adj(d) {
    if (tm.running) { tm.end += d * 1000; S.timer.remain = Math.max(0, (tm.end - Date.now()) / 1000); }
    else S.timer.remain = Math.max(0, S.timer.remain + d);
    render();
  }

  stage.addEventListener('click', (e) => {
    if (!$('#timesup').hidden) { $('#timesup').hidden = true; return; }
    const w = e.target.closest('#s1wrap');
    if (w) return onS1Click(e, w);
    const el = e.target.closest('[data-act]');
    if (!el) { if (!e.target.closest('#hintCard')) hideHint(); return; }
    if (el.dataset.act !== 'hint') hideHint();
    const f = A[el.dataset.act]; if (f) f(el);
  });

  /* 手电筒跟着指针 */
  stage.addEventListener('pointermove', (e) => {
    if (S.step !== 1) return;
    const w = $('#s1wrap'); if (!w) return;
    const rc = w.getBoundingClientRect();
    L.x = Math.max(0, Math.min(1000, (e.clientX - rc.left) / rc.width * 1000));
    L.y = Math.max(0, Math.min(747, (e.clientY - rc.top) / rc.width * 1000));
    placeSpot();
  });
  stage.addEventListener('pointerdown', (e) => { if (S.step === 1 && e.target.closest('#s1wrap')) stage.dispatchEvent(new PointerEvent('pointermove', e)); });

  /* 拖拽（第 4 步） */
  let dragId = null;
  stage.addEventListener('dragstart', (e) => {
    const s = e.target.closest('.strip'); if (!s) return;
    dragId = +s.dataset.id; e.dataTransfer.setData('text/plain', String(dragId)); e.dataTransfer.effectAllowed = 'move';
    s.classList.add('drag');
  });
  stage.addEventListener('dragend', () => { dragId = null; document.querySelectorAll('.drag,.over-slot').forEach((n) => n.classList.remove('drag', 'over-slot')); });
  stage.addEventListener('dragover', (e) => {
    const sl = e.target.closest('.slot'); if (!sl || dragId == null) return;
    e.preventDefault(); document.querySelectorAll('.over-slot').forEach((n) => n.classList.remove('over-slot')); sl.classList.add('over-slot');
  });
  stage.addEventListener('drop', (e) => {
    const sl = e.target.closest('.slot'); if (!sl || dragId == null) return;
    e.preventDefault();
    const i = +sl.dataset.slot;
    S.slots.forEach((v, k) => { if (v === dragId) { S.slots[k] = null; S.ok[k] = false; } });
    // 该位置已有句子：退回
    S.slots[i] = dragId; S.ok[i] = false; dragId = null; render();
  });

  /* 键盘 */
  addEventListener('keydown', (e) => {
    if (document.body.classList.contains('splashing')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(S.step + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(S.step - 1); }
    else if (e.key === 'Escape') { hideHint(); $('#modal').hidden = true; }
  });
  addEventListener('beforeunload', () => { tstop(); save(); });

  /* ───────── 开场封面：至少 2.5 秒且图片载完，载完后点一下可跳过 ───────── */
  const splashEl = $('#splash');
  document.body.classList.add('splashing');
  function loaded() {
    const im = $('img', splashEl);
    return new Promise((res) => { if (im.complete) res(); else { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); } });
  }
  async function splashWait() {
    await loaded();
    return new Promise((res) => {
      const left = Math.max(0, 2500 - performance.now());
      const t = setTimeout(res, left);
      splashEl.addEventListener('pointerdown', () => { clearTimeout(t); res(); }, { once: true });
    });
  }
  render();
  splashWait().then(() => {
    splashEl.classList.add('out'); document.body.classList.remove('splashing');
    setTimeout(() => splashEl.remove(), 600);
  });
  window.__kantu = { get S() { return S; }, render, go, cnt };
})();
