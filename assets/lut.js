/* ============================================================
   lut.js — component "QSS lookup table" (heatmap แถว = ค่า READ · คอลัมน์ = จำนวน subpixel ขาว)
   สร้างตอนบท 0045 (Lec 11 · Figure 11-14, 11-15, 11-16, confidence map)

   คำนวณตารางเองด้วยการจำลอง QSS จริง (ไม่ได้พิมพ์ค่ามือ):
     |s⟩ = HAD บน qxy (N subpixel) · flip M ตัว (O) · mirror = I − 2|s⟩⟨s|  · G = mirror·O
     counter C qubit: ค่า k ของ counter ↔ G^k|s⟩ · invQFT บน counter · READ = bit-reverse ของช่อง
     (convention นี้ให้ผลตรงกับ Figure 11-14 ในสไลด์ทุกแถว — ตรวจด้วย numpy ตอนบท 0044/0045)

   วิธีใช้:
   <div class="lut"
        data-sub="16"          จำนวน subpixel ใน tile (N) → คอลัมน์ = N + 1
        data-cnt="4"           จำนวน counter qubit (C)  → แถว = 2^C
        data-cw="20" data-ch="18"   ขนาดช่อง px (กว้าง × สูง)
        data-axes="0"          ซ่อนเลขแกน (ใช้ทำรูปย่อแบบ Figure 11-15/11-16)
        data-hl="10"           ไฮไลต์แถวตั้งต้น
        data-pick="1"          คลิกแถว → บอก "READ r → น่าจะกี่ตัว · มั่นใจกี่ %"
        data-conf="1"          แถบ "ความมั่นใจ" ต่อแถวทางขวา (= confidence map ของค่า READ นั้น)
        data-lab="…" data-cap="…"></div>

   ตรวจตัวเลข: window.qssTable(16, 4)[10][5] → P(READ = 10 | ขาว 5 ตัว) ≈ 0.50
               window.qssConf(16, 4)[0] → { best: 16, conf: 0.90 }
   ============================================================ */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function rev(j, C) { var r = 0; for (var b = 0; b < C; b++) r |= ((j >> b) & 1) << (C - 1 - b); return r; }

  /* T[read][M] = P(READ = read | มี subpixel ขาว M ตัว) · แต่ละคอลัมน์รวมกันได้ 1 */
  var cache = {};
  function table(N, C) {
    var key = N + ":" + C;
    if (cache[key]) return cache[key];
    var K = 1 << C, a = 1 / Math.sqrt(N), T = [];
    for (var r = 0; r < K; r++) { T.push([]); for (var m = 0; m <= N; m++) T[r].push(0); }
    for (var M = 0; M <= N; M++) {
      var st = [], v = [];
      for (var i = 0; i < N; i++) v.push(a);
      for (var k = 0; k < K; k++) {
        st.push(v.slice());
        for (i = 0; i < M; i++) v[i] = -v[i];                  // O: flip M ตัว
        var dot = 0; for (i = 0; i < N; i++) dot += a * v[i];
        for (i = 0; i < N; i++) v[i] = v[i] - 2 * a * dot;       // mirror = I − 2|s⟩⟨s|
      }
      for (var j = 0; j < K; j++) {                              // invQFT บน counter
        var p = 0;
        for (i = 0; i < N; i++) {
          var re = 0, im = 0;
          for (k = 0; k < K; k++) {
            var t = -2 * Math.PI * j * k / K;
            re += st[k][i] * Math.cos(t); im += st[k][i] * Math.sin(t);
          }
          p += (re * re + im * im) / (K * K);
        }
        T[rev(j, C)][M] = p;
      }
    }
    return (cache[key] = T);
  }
  /* ความมั่นใจของแต่ละค่า READ (สมมติว่าทุกจำนวน subpixel มีโอกาสเท่ากันก่อนวัด) */
  function conf(N, C) {
    var T = table(N, C);
    return T.map(function (row) {
      var s = 0, best = 0;
      row.forEach(function (p, m) { s += p; if (p > row[best]) best = m; });
      return { best: best, conf: s ? row[best] / s : 0, post: row.map(function (p) { return s ? p / s : 0; }) };
    });
  }
  window.qssTable = table;
  window.qssConf = function (N, C) { return conf(N, C).map(function (o) { return { best: o.best, conf: o.conf }; }); };

  function gray(p) { var v = Math.round(255 * Math.pow(Math.max(0, Math.min(1, p)), 0.8)); return "rgb(" + v + "," + v + "," + v + ")"; }
  function pct(x) { return Math.round(x * 100) + "%"; }

  function build(node) {
    node.innerHTML = "";
    var N = parseInt(node.dataset.sub || "16", 10);
    var C = parseInt(node.dataset.cnt || "4", 10);
    var K = 1 << C;
    var cw = parseFloat(node.dataset.cw || "20"), ch = parseFloat(node.dataset.ch || "18");
    var axes = node.dataset.axes !== "0";
    var showConf = node.dataset.conf === "1";
    var pick = node.dataset.pick === "1";
    var hl = node.dataset.hl !== undefined ? parseInt(node.dataset.hl, 10) : -1;
    var T = table(N, C), CF = conf(N, C);

    var L = axes ? 46 : 3, Tp = axes ? 6 : 3;
    var gw = (N + 1) * cw, gh = K * ch;
    var R = showConf ? 14 + cw * 1.6 : 3;
    var B = axes ? 40 : 3;
    var W = L + gw + R, H = Tp + gh + B;

    if (node.dataset.lab) node.appendChild(h("div", "lab", node.dataset.lab));
    var holder = h("div", "pad");
    node.appendChild(holder);
    var info = pick ? h("div", "info") : null;

    function draw() {
      holder.innerHTML = "";
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": node.dataset.alt || "QSS lookup table " + K + " แถว × " + (N + 1) + " คอลัมน์" });
      svg.appendChild(el("rect", { x: L, y: Tp, width: gw, height: gh, fill: "#0b0b0b" }));
      for (var r = 0; r < K; r++) {
        for (var m = 0; m <= N; m++) {
          if (T[r][m] < 0.004) continue;
          svg.appendChild(el("rect", { x: L + m * cw, y: Tp + r * ch, width: cw + 0.3, height: ch + 0.3,
            fill: gray(T[r][m]), "data-r": r, "data-m": m, "data-p": T[r][m].toFixed(3) }));
        }
        if (showConf) {
          svg.appendChild(el("rect", { x: L + gw + 10, y: Tp + r * ch, width: cw * 1.6, height: ch + 0.3,
            fill: gray(CF[r].conf), "data-conf": CF[r].conf.toFixed(3) }));
        }
        if (pick) {
          var hit = el("rect", { x: L - (axes ? 40 : 0), y: Tp + r * ch, width: gw + (axes ? 40 : 0) + R,
            height: ch, fill: "transparent", style: "cursor:pointer", "data-row": r });
          (function (rr) { hit.addEventListener("click", function () { hl = rr; draw(); say(); }); })(r);
          svg.appendChild(hit);
        }
      }
      if (hl >= 0 && hl < K) {
        svg.appendChild(el("rect", { x: L - 1, y: Tp + hl * ch, width: gw + 2, height: ch,
          fill: "none", stroke: "#f2a33a", "stroke-width": 2.4, "pointer-events": "none" }));
      }
      if (axes) {
        var fs = Math.min(11, ch * 0.62);
        for (r = 0; r < K; r++) {
          svg.appendChild(el("text", { x: L - 6, y: Tp + r * ch + ch / 2 + fs * 0.36, "text-anchor": "end",
            "font-size": fs, "font-weight": r === hl ? 800 : 600, fill: r === hl ? "#b4531b" : "#4a4a4a",
            "pointer-events": "none" }, r));
        }
        var step = (N + 1) * cw / 17 < 14 ? Math.ceil(14 / cw) : 1;
        for (m = 0; m <= N; m += step) {
          svg.appendChild(el("text", { x: L + m * cw + cw / 2, y: Tp + gh + 13, "text-anchor": "middle",
            "font-size": Math.min(10.5, cw * 0.55), fill: "#4a4a4a" }, m));
        }
        svg.appendChild(el("text", { x: L + gw / 2, y: Tp + gh + 32, "text-anchor": "middle",
          "font-size": 11, "font-weight": 800, fill: "#6a3fb5" }, "จำนวน subpixel ขาว (ดำ → เทา → ขาว)"));
        var yc = Tp + gh / 2;
        svg.appendChild(el("text", { x: 11, y: yc, "text-anchor": "middle", "font-size": 11, "font-weight": 800,
          fill: "#6a3fb5", transform: "rotate(-90 11 " + yc + ")" }, "ค่า READ (QSS result)"));
        if (showConf) {
          var xc = L + gw + 10 + cw * 0.8;
          svg.appendChild(el("text", { x: xc, y: Tp + gh + 13, "text-anchor": "middle", "font-size": 10,
            "font-weight": 800, fill: "#6a3fb5" }, "มั่นใจ"));
        }
      }
      holder.appendChild(svg);
    }

    function say() {
      if (!info) return;
      if (hl < 0) { info.innerHTML = "<span>คลิกแถวไหนก็ได้ = สมมติว่า READ ได้ค่านั้น</span>"; return; }
      var post = CF[hl].post, order = [];
      for (var m = 0; m <= N; m++) if (post[m] >= 0.03) order.push(m);
      order.sort(function (x, y) { return post[y] - post[x]; });
      var list = order.slice(0, 5).map(function (m) { return "<b>" + m + "</b> ตัว (" + pct(post[m]) + ")"; }).join(" · ");
      info.innerHTML = "<code>READ = " + hl + " → เดาว่า " + CF[hl].best + " ตัว · มั่นใจ " + pct(CF[hl].conf) + "</code>" +
        "<span>เป็นไปได้: " + list + "</span>";
    }

    draw();
    if (info) { node.appendChild(info); say(); }
    if (node.dataset.cap) node.appendChild(h("div", "cap", node.dataset.cap));
  }

  function init() { document.querySelectorAll(".lut").forEach(build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
