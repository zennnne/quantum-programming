/* ============================================================
   canvas.js — component "ผ้าใบควอนตัม" (ตาราง circle notation n×n ของ qx, qy)
   สร้างตอนบท 0041 (Lec 11 · Figure 11-4 ถึง 11-10 ใช้ผ้าใบ 16×16 ซ้ำทั้งคาบ)

   วิธีใช้:
   <div class="qcanvas"
        data-n="16"                 ด้านละกี่ช่อง (default 16)
        data-flip="x >= 8"          นิพจน์ JS ของ x, y → จริง = phase 180° (เขียว ขีดชี้ลง)
                                    ไม่ใส่ = ผ้าใบเปล่า (ชมพู ขีดชี้ขึ้นทุกวง)
        data-mode="phase"           phase (default · วงชมพู/เขียวแบบสไลด์)
                                    pixel (สี่เหลี่ยมขาว/ดำ = ภาพที่ตั้งใจวาด · จริง = ดำ)
                                    gray  (สี่เหลี่ยมไล่เทา · ใช้ data-gray แทน data-flip)
        data-gray="0.5"             นิพจน์ของ x, y → 0 (ดำ) ถึง 1 (ขาว) · ใช้ rnd(x,y) ได้ (สุ่มแบบคงที่ 0–1)
        data-cell="20"              ขนาดช่อง px (default 20)
        data-tiles="4"              ตีเส้นแบ่ง tile ทุกกี่ช่อง (ไม่ใส่ = ไม่ตี)
        data-axes="0"               ซ่อนป้าย qx / qy (default แสดง)
        data-toggle="1"             ปุ่ม PHASE(180) รายบิตของ qx, qy ให้กดเล่น (ใช้กับ n=16)
        data-read="1"               ปุ่ม READ → collapse เหลือวงเดียวแบบสุ่ม + นับสถิติซ้าย/ขวา
        data-lab="…" data-cap="…"></div>

   ตรวจตัวเลข: window.canvasMath("x >= 8", 16) → { flipped: 128, total: 256 }
   ============================================================ */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var PINK = "#f3b3c8", PINK_LN = "#a8325c", GREEN = "#8fd3a6", GREEN_LN = "#17603a";

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
  /* สุ่มแบบคงที่ (hash ของ x, y) — โหลดหน้ากี่รอบก็ได้ภาพเดิม */
  function rnd(x, y) {
    var t = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return t - Math.floor(t);
  }
  function compile(expr) {
    if (!expr) return function () { return 0; };
    try { return new Function("x", "y", "rnd", "return (" + expr + ");"); }
    catch (e) { console.warn("canvas.js: นิพจน์ผิด", expr); return function () { return 0; }; }
  }

  window.canvasMath = function (expr, n) {
    var f = compile(expr), c = 0;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (f(x, y, rnd)) c++;
    return { flipped: c, total: n * n };
  };

  function build(node) {
    node.innerHTML = "";
    var n = parseInt(node.dataset.n || "16", 10);
    var cell = parseInt(node.dataset.cell || "20", 10);
    var mode = node.dataset.mode || "phase";
    var axes = node.dataset.axes !== "0";
    var tiles = parseInt(node.dataset.tiles || "0", 10);
    var flipF = compile(node.dataset.flip);
    var grayF = compile(node.dataset.gray || "1");
    var mask = 0;            // โหมด toggle: บิตของ qx (0–3) และ qy (4–7) ที่โดน PHASE(180)
    var picked = null;       // โหมด read: ช่องที่ collapse ไปแล้ว
    var stat = { n: 0, right: 0 };

    var L = axes ? 34 : 4, T = axes ? 32 : 4;
    var W = L + n * cell + 4, H = T + n * cell + 4;

    if (node.dataset.lab) node.appendChild(h("div", "lab", node.dataset.lab));
    var holder = h("div", "pad");
    node.appendChild(holder);

    function parity(v) { var p = 0; while (v) { p ^= v & 1; v >>= 1; } return p; }
    function isFlip(x, y) {
      if (node.dataset.toggle === "1") return parity((x | (y << 4)) & mask) === 1;
      return !!flipF(x, y, rnd);
    }

    function draw() {
      holder.innerHTML = "";
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H,
        role: "img", "aria-label": node.dataset.alt || "ผ้าใบควอนตัม " + n + "×" + n });
      if (axes) {
        svg.appendChild(el("text", { x: L + n * cell / 2, y: 11, "text-anchor": "middle",
          "font-size": 11, "font-weight": 800, fill: "#6a3fb5" }, "qx →"));
        var qyT = el("text", { x: 10, y: T + n * cell / 2, "text-anchor": "middle",
          "font-size": 11, "font-weight": 800, fill: "#6a3fb5",
          transform: "rotate(-90 10 " + (T + n * cell / 2) + ")" }, "← qy");
        svg.appendChild(qyT);
        for (var i = 0; i < n; i++) {
          svg.appendChild(el("text", { x: L + i * cell + cell / 2, y: T - 5, "text-anchor": "middle",
            "font-size": Math.min(10, cell * 0.5), fill: "#4a4a4a" }, i));
          svg.appendChild(el("text", { x: L - 5, y: T + i * cell + cell / 2 + 3.5, "text-anchor": "end",
            "font-size": Math.min(10, cell * 0.5), fill: "#4a4a4a" }, i));
        }
      }
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          var cx = L + x * cell + cell / 2, cy = T + y * cell + cell / 2;
          if (mode === "pixel" || mode === "gray") {
            var g = mode === "pixel" ? (isFlip(x, y) ? 0 : 1)
                                     : Math.max(0, Math.min(1, grayF(x, y, rnd)));
            var v = Math.round(g * 255);
            svg.appendChild(el("rect", { x: L + x * cell, y: T + y * cell, width: cell, height: cell,
              fill: "rgb(" + v + "," + v + "," + v + ")", stroke: "#b9bec8", "stroke-width": 0.5 }));
            continue;
          }
          var r = cell / 2 - 1.5;
          var isPicked = picked && picked.x === x && picked.y === y;
          if (picked && !isPicked) {            // หลัง READ: วงอื่นว่างหมด
            svg.appendChild(el("circle", { cx: cx, cy: cy, r: r, fill: "#fff",
              stroke: "#d5d8de", "stroke-width": 1 }));
            continue;
          }
          var f = picked ? false : isFlip(x, y);
          svg.appendChild(el("circle", { cx: cx, cy: cy, r: r, fill: f ? GREEN : PINK,
            stroke: isPicked ? "#b4531b" : (f ? GREEN_LN : PINK_LN),
            "stroke-width": isPicked ? 2.4 : 1, "data-f": f ? 1 : 0 }));
          svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx, y2: f ? cy + r - 1 : cy - r + 1,
            stroke: f ? GREEN_LN : PINK_LN, "stroke-width": 1.6 }));
        }
      }
      if (tiles) {
        for (var k = 0; k <= n; k += tiles) {
          svg.appendChild(el("line", { x1: L + k * cell, y1: T, x2: L + k * cell, y2: T + n * cell,
            stroke: "#1a1a1a", "stroke-width": 1.6 }));
          svg.appendChild(el("line", { x1: L, y1: T + k * cell, x2: L + n * cell, y2: T + k * cell,
            stroke: "#1a1a1a", "stroke-width": 1.6 }));
        }
      }
      holder.appendChild(svg);
    }

    /* ---------- โหมด toggle: ปุ่ม PHASE(180) รายบิต ---------- */
    var info = null;
    if (node.dataset.toggle === "1") {
      var bar = h("div", "ctl");
      ["qx", "qy"].forEach(function (reg, ri) {
        var grp = h("span", "grp", "<b>" + reg + "</b>");
        [1, 2, 4, 8].forEach(function (bit, bi) {
          var b = h("button", "tg", "0x" + bit);
          b.type = "button";
          b.setAttribute("aria-pressed", "false");
          b.addEventListener("click", function () {
            mask ^= 1 << (ri * 4 + bi);
            var on = (mask >> (ri * 4 + bi)) & 1;
            b.classList.toggle("on", !!on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
            draw(); say();
          });
          grp.appendChild(b);
        });
        bar.appendChild(grp);
      });
      node.insertBefore(bar, holder);
      info = h("div", "info");
      node.appendChild(info);
    }
    function say() {
      if (!info) return;
      var lines = [], c = 0;
      for (var b = 0; b < 8; b++) if ((mask >> b) & 1) {
        lines.push("qc.phase(180, " + (b < 4 ? "qx" : "qy") + ".bits(0x" + (1 << (b % 4)) + "));");
      }
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (isFlip(x, y)) c++;
      info.innerHTML = (lines.length ? "<code>" + lines.join("<br>") + "</code>" : "<code>// ยังไม่ได้วาดอะไร</code>") +
        "<span>ใช้ <b>" + lines.length + "</b> คำสั่ง · ระบายเขียว <b>" + c + "</b> จาก " + (n * n) + " pixel</span>";
    }

    /* ---------- โหมด read: READ แล้ว collapse ---------- */
    if (node.dataset.read === "1") {
      var bar2 = h("div", "ctl");
      var rb = h("button", "tg go", "READ"), rs = h("button", "tg", "วาดใหม่");
      rb.type = rs.type = "button";
      var out = h("div", "info");
      var half = n / 2;
      rb.addEventListener("click", function () {
        var x, y;
        if (picked) { x = picked.x; y = picked.y; }       // อ่านซ้ำหลัง collapse ได้ค่าเดิม
        else {
          x = Math.floor(Math.random() * n); y = Math.floor(Math.random() * n);
          picked = { x: x, y: y }; stat.n++; if (x >= half) stat.right++;
        }
        draw();
        out.innerHTML = "<code>qx = " + x + " · qy = " + y + " → |" + (x + n * y) + "⟩</code>" +
          "<span>ได้แค่<b>พิกัดสุ่ม 1 จุด</b> · phase ที่วาดไว้หายหมด · อ่านมาแล้ว <b>" + stat.n +
          "</b> รอบ ตกครึ่งขวา <b>" + stat.right + "</b> รอบ</span>";
      });
      rs.addEventListener("click", function () { picked = null; draw(); });
      bar2.appendChild(rb); bar2.appendChild(rs);
      node.insertBefore(bar2, holder);
      out.innerHTML = "<code>// ยังไม่ได้ READ</code><span>กด READ ดูว่าได้อะไรออกมา แล้วกด “วาดใหม่” เพื่อรันโปรแกรมอีกรอบ</span>";
      node.appendChild(out);
    }

    draw(); say();
    if (node.dataset.cap) node.appendChild(h("div", "cap", node.dataset.cap));
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".qcanvas"), build);
  }
  window.buildCanvas = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
