/* ============================================================
   wave.js — component วาด "สัญญาณ → DFT → spectrum" (คำนวณ DFT ให้เอง)
   สร้างตอนบท 0028 (Lec 07 p22–35: DFT, peak สะท้อน, สัญญาณผสม, square wave)

   วิธีใช้:
   <div class="wave"
        data-sig="sin:8"          สัญญาณ = ผลบวกของเทอม คั่นด้วย " + " (ต้องมีเว้นวรรคขนาบ)
                                  sin:f[:amp[:offset°]] · cos:f[:amp] · sq:f[:amp] (square wave)
                                  dc:amp (ยกเส้นฐาน) · spin:f[:amp] (เชิงซ้อน e^{i2πft} — f ติดลบ = หมุนตามเข็ม)
        data-n="256"              จำนวน sample (default 256)
        data-show="both"          time | freq | both (time → กล่อง DFT → freq)
        data-mark="8,248"         ป้ายเลขบน peak ที่ตำแหน่งเหล่านี้
        data-unit=" Hz"           หน่วยต่อท้ายป้าย peak (ไม่ใส่ = ไม่มี)
        data-half="1"             แรเงาครึ่งขวาของ spectrum = “ภาพสะท้อน”
        data-dots="0"             ซ่อนจุด sample (default แสดง)
        data-ax="k,amplitude,QFT,ค่าที่ READ,ความแรง"   เปลี่ยนป้าย: แกน x/y ซ้าย, กล่องกลาง, แกน x/y ขวา
                                  (ช่องว่าง = ใช้ค่าเดิม Time,Signal,DFT,Frequency,Strength · เพิ่มตอนบท 0044)
        data-lab="หัวข้อ" data-cap="คำบรรยาย"></div>
   ตรวจตัวเลข: window.waveMath("sin:8", 256) → { re, im, mag }  (mag = |DFT| ไม่ normalize)
   ============================================================ */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var PW = 250, PH = 130, GAP = 96, PAD = 22;

  function el(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  function txt(g, x, y, s, size, fill, anchor, weight) {
    var t = el("text", { x: x, y: y, "font-size": size || 11, fill: fill || "#4a4a4a",
      "text-anchor": anchor || "middle", "font-weight": weight || 600 });
    t.textContent = s;
    g.appendChild(t);
    return t;
  }

  function samples(sig, n) {
    var re = new Array(n).fill(0), im = new Array(n).fill(0);
    sig.split(/\s+\+\s+/).forEach(function (term) {
      var p = term.trim().split(":"), kind = p[0];
      var f = parseFloat(p[1] || "0"), amp = p[2] === undefined || p[2] === "" ? 1 : parseFloat(p[2]);
      var off = parseFloat(p[3] || "0") * Math.PI / 180;
      for (var t = 0; t < n; t++) {
        var ang = 2 * Math.PI * f * t / n + off;
        if (kind === "sin") re[t] += amp * Math.sin(ang);
        else if (kind === "cos") re[t] += amp * Math.cos(ang);
        else if (kind === "sq") re[t] += amp * (Math.floor(2 * f * t / n) % 2 === 0 ? 1 : -1);
        else if (kind === "dc") re[t] += parseFloat(p[1] || "0");
        else if (kind === "spin") { re[t] += amp * Math.cos(ang); im[t] += amp * Math.sin(ang); }
        else if (t === 0) console.warn("wave.js: ไม่รู้จักเทอม " + term);
      }
    });
    var mag = [];
    for (var j = 0; j < n; j++) {
      var sr = 0, si = 0;
      for (var t2 = 0; t2 < n; t2++) {
        var a = -2 * Math.PI * j * t2 / n, c = Math.cos(a), s = Math.sin(a);
        sr += re[t2] * c - im[t2] * s;
        si += re[t2] * s + im[t2] * c;
      }
      mag.push(Math.sqrt(sr * sr + si * si));
    }
    return { re: re, im: im, mag: mag };
  }
  window.waveMath = samples;

  var AX = ["Time", "Signal", "DFT", "Frequency", "Strength"];
  function frame(g, x0, yLab, xLab) {
    g.appendChild(el("rect", { x: x0, y: PAD, width: PW, height: PH, fill: "#fff", stroke: "#bdb6a8" }));
    txt(g, x0 + PW / 2, PAD + PH + 15, xLab, 10.5);
    var t = txt(g, 0, 0, yLab, 10.5);
    t.setAttribute("transform", "translate(" + (x0 - 7) + "," + (PAD + PH / 2) + ") rotate(-90)");
  }

  function timePanel(g, x0, d, n, dots) {
    frame(g, x0, AX[1], AX[0]);
    var hasIm = d.im.some(function (v) { return Math.abs(v) > 1e-9; });
    var m = 0;
    d.re.concat(d.im).forEach(function (v) { m = Math.max(m, Math.abs(v)); });
    m = (m || 1) * 1.1;
    var mid = PAD + PH / 2;
    g.appendChild(el("line", { x1: x0, y1: mid, x2: x0 + PW, y2: mid, stroke: "#e3ded3", "stroke-dasharray": "3 3" }));
    function X(t) { return x0 + 6 + (PW - 12) * t / (n - 1); }
    function Y(v) { return mid - (PH / 2 - 4) * v / m; }
    function line(arr, color, dash, w) {
      var pts = arr.map(function (v, t) { return X(t).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
      var a = { points: pts, fill: "none", stroke: color, "stroke-width": w };
      if (dash) a["stroke-dasharray"] = dash;
      g.appendChild(el("polyline", a));
    }
    if (hasIm) line(d.im, "#d08a3c", "4 3", 1.4);
    line(d.re, dots ? "#c9c3b8" : "#1a1a1a", null, dots ? 1 : 1.5);
    if (dots) {
      var r = n >= 128 ? 1.15 : 2;
      d.re.forEach(function (v, t) { g.appendChild(el("circle", { cx: X(t), cy: Y(v), r: r, fill: "#1a1a1a" })); });
    }
    if (hasIm) {
      g.appendChild(el("line", { x1: x0 + 8, y1: PAD - 8, x2: x0 + 24, y2: PAD - 8, stroke: "#1a1a1a", "stroke-width": 1.5 }));
      txt(g, x0 + 28, PAD - 5, "ส่วนจริง", 9.5, null, "start");
      g.appendChild(el("line", { x1: x0 + 84, y1: PAD - 8, x2: x0 + 100, y2: PAD - 8, stroke: "#d08a3c", "stroke-width": 1.4, "stroke-dasharray": "4 3" }));
      txt(g, x0 + 104, PAD - 5, "ส่วนจินตภาพ", 9.5, "#9a5a14", "start");
    }
  }

  function freqPanel(g, x0, d, n, marks, unit, half) {
    frame(g, x0, AX[4], AX[3]);
    function X(j) { return x0 + 6 + (PW - 12) * j / (n - 1); }
    if (half) {
      g.appendChild(el("rect", { x: X(n / 2), y: PAD + 1, width: x0 + PW - 1 - X(n / 2), height: PH - 2, fill: "#f2eee6" }));
      txt(g, (X(n / 2) + x0 + PW) / 2, PAD + 14, "ภาพสะท้อน", 9.5, "#7a746a");
    }
    var mx = Math.max.apply(null, d.mag) || 1, base = PAD + PH - 5;
    d.mag.forEach(function (v, j) {
      var h = (PH - 24) * v / mx;
      if (h < 0.4) return;
      g.appendChild(el("line", { x1: X(j), y1: base, x2: X(j), y2: base - h, stroke: "#6a3fb5", "stroke-width": n > 64 ? 1.6 : 3 }));
    });
    g.appendChild(el("line", { x1: x0 + 3, y1: base, x2: x0 + PW - 3, y2: base, stroke: "#6a3fb5", "stroke-width": 1 }));
    txt(g, X(0), PAD + PH + 15, "0", 9.5, "#7a746a");
    txt(g, X(n - 1), PAD + PH + 15, String(n - 1), 9.5, "#7a746a");
    marks.forEach(function (j) {
      var h = (PH - 24) * (d.mag[j] || 0) / mx;
      var anchor = j < n * 0.15 ? "start" : j > n * 0.85 ? "end" : "middle";
      txt(g, X(j) + (anchor === "start" ? -2 : anchor === "end" ? 2 : 0), base - h - 5, j + unit, 10.5, "#6a3fb5", anchor, 800);
    });
  }

  function build(node) {
    var n = parseInt(node.dataset.n || "256", 10);
    var show = node.dataset.show || "both";
    var d = samples(node.dataset.sig || "sin:1", n);
    var marks = (node.dataset.mark || "").split(",").filter(function (s) { return s.trim() !== ""; })
      .map(function (s) { return parseInt(s, 10); });
    var dots = node.dataset.dots !== "0";
    var ax = (node.dataset.ax || "").split(",");
    AX = ["Time", "Signal", "DFT", "Frequency", "Strength"].map(function (d, i) { return (ax[i] || "").trim() || d; });
    var W = show === "both" ? PAD + PW + GAP + PW + 8 : PAD + PW + 8;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + (PAD + PH + 22), width: W, role: "img",
      "aria-label": node.dataset.cap ? node.dataset.cap.replace(/<[^>]+>/g, "") : "กราฟสัญญาณ" });
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
    var g = el("g", { "font-family": "inherit" });
    svg.appendChild(g);
    if (show !== "freq") timePanel(g, PAD, d, n, dots);
    if (show === "both") {
      var bx = PAD + PW + 6, cy = PAD + PH / 2;
      g.appendChild(el("path", { d: "M" + bx + "," + cy + " h12 m-5,-4 l5,4 l-5,4", fill: "none", stroke: "#7a746a" }));
      g.appendChild(el("rect", { x: bx + 14, y: cy - 14, width: 34, height: 28, rx: 3, fill: "#e8e5de", stroke: "#9b958a" }));
      txt(g, bx + 31, cy + 4, AX[2], 11, "#1a1a1a", "middle", 800);
      g.appendChild(el("path", { d: "M" + (bx + 50) + "," + cy + " h14 m-5,-4 l5,4 l-5,4", fill: "none", stroke: "#7a746a" }));
    }
    if (show !== "time") freqPanel(g, show === "both" ? PAD + PW + GAP : PAD, d, n, marks,
      node.dataset.unit || "", node.dataset.half === "1");

    node.innerHTML = "";
    if (node.dataset.lab) {
      var lab = document.createElement("div");
      lab.className = "lab";
      lab.innerHTML = node.dataset.lab;
      node.appendChild(lab);
    }
    node.appendChild(svg);
    if (node.dataset.cap) {
      var cap = document.createElement("div");
      cap.className = "cap";
      cap.innerHTML = node.dataset.cap;
      node.appendChild(cap);
    }
  }

  function init() { document.querySelectorAll(".wave").forEach(build); }
  window.buildWave = build;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
