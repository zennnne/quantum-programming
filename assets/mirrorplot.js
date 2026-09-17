/* ============================================================
   mirrorplot.js — วาด "สะท้อนรอบค่าเฉลี่ย" บน circle notation
   สร้างตอนบท 0026 (Lec 06 p37–43 · Figure 6-20 … 6-26)

   แต่ละวงวาดเป็นระนาบ [x, y]: ขอบวงนอก = magnitude 1 · จุดของค่า = mag ห่างจากศูนย์กลาง
   (มุม 0° = ชี้ขึ้น, บวก = ทวนเข็ม → x = −mag·sinθ, y = mag·cosθ ตรงกับพิกัดในสไลด์)
   ค่าเฉลี่ยและค่าหลังสะท้อน (2×avg − ค่าเดิม) คำนวณให้เอง ไม่ต้องใส่

   วิธีใช้:
   <div class="mplot"
        data-amp="0.707@0; 0; 0; 0.707@120"   ค่าแต่ละวง  mag@มุม (ไม่ใส่ @ = มุม 0 · ติดลบ = มุม 180)
        data-mode="mirror"                    state | avg | mirror | after
                                                state  = ค่าเดิมอย่างเดียว
                                                avg    = ค่าเดิม + จุดเฉลี่ย ●
                                                mirror = ค่าเดิม (ประ) + ● + ค่าใหม่ + เส้นเชื่อม
                                                after  = ค่าใหม่อย่างเดียว (+ ● จาง)
        data-coords="after"                   พิมพ์ [x, y] ใต้วง: before | after | none (default none)
        data-sub="47%,,,"                     ข้อความเพิ่มใต้วง (ไม่ใส่ก็ได้)
        data-hl="3"                           วงที่ไฮไลต์สีส้ม
        data-labels="0,1,2,3"                 override label
        data-lab="หัวรูป" data-cap="คำบรรยาย"
        data-r="44"></div>                    รัศมีวงนอก px (default 44)

   window.mirrorMath(amp) → { pts, avg, after } ไว้ใช้ตรวจตัวเลขใน browser_evaluate
   ============================================================ */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  function parse(raw) {
    return raw.split(";").map(function (s) {
      s = s.trim();
      var p = s.split("@"), mag = parseFloat(p[0]) || 0, th = parseFloat(p[1] || "0") || 0;
      if (mag < 0) { mag = -mag; th += 180; }
      var r = th * Math.PI / 180;
      return [-mag * Math.sin(r), mag * Math.cos(r)];
    });
  }
  function math(raw) {
    var pts = typeof raw === "string" ? parse(raw) : raw, n = pts.length, ax = 0, ay = 0;
    pts.forEach(function (p) { ax += p[0]; ay += p[1]; });
    var avg = [ax / n, ay / n];
    var after = pts.map(function (p) { return [2 * avg[0] - p[0], 2 * avg[1] - p[1]]; });
    return { pts: pts, avg: avg, after: after };
  }
  window.mirrorMath = math;

  function fmt(v) { var s = (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3); return s; }
  function mag(p) { return Math.sqrt(p[0] * p[0] + p[1] * p[1]); }

  function one(before, avg, after, mode, R, hl) {
    var pad = 8, size = 2 * R + 2 * pad, c = R + pad;
    var svg = el("svg", { width: size, height: size, viewBox: "0 0 " + size + " " + size });
    function X(p) { return c + p[0] * R; }
    function Y(p) { return c - p[1] * R; }
    svg.appendChild(el("circle", { cx: c, cy: c, r: R, fill: "#fff",
      stroke: hl ? "#b4531b" : "#9aa0a6", "stroke-width": hl ? 2.2 : 1.4 }));
    svg.appendChild(el("line", { x1: c - R, y1: c, x2: c + R, y2: c, stroke: "#e3e6eb", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: c, y1: c - R, x2: c, y2: c + R, stroke: "#e3e6eb", "stroke-width": 1 }));

    function value(p, style) {       // style: solid | ghost
      var m = mag(p);
      if (m < 1e-3) return;
      var ghost = style === "ghost";
      svg.appendChild(el("circle", { cx: c, cy: c, r: m * R,
        fill: ghost ? "none" : (hl ? "#f6c9a8" : "#b9d4ee"), "fill-opacity": ghost ? 0 : 0.75,
        stroke: ghost ? "#9aa0a6" : "none", "stroke-dasharray": ghost ? "3 3" : "" }));
      svg.appendChild(el("line", { x1: c, y1: c, x2: X(p), y2: Y(p),
        stroke: ghost ? "#b8bec6" : "#2b6cb0", "stroke-width": ghost ? 1.3 : 2,
        "stroke-dasharray": ghost ? "3 3" : "" }));
    }
    function dot(p, kind) {           // kind: old | new | avg | avgfaint
      if (kind === "avg" || kind === "avgfaint") {
        svg.appendChild(el("circle", { cx: X(p), cy: Y(p), r: 3.6,
          fill: kind === "avg" ? "#111" : "#9aa0a6", "class": "avg" }));
        return;
      }
      svg.appendChild(el("circle", { cx: X(p), cy: Y(p), r: 3.8, fill: "#fff",
        stroke: kind === "old" ? "#6b7280" : "#111", "stroke-width": 1.5,
        "stroke-dasharray": kind === "old" ? "2 2" : "", "class": kind }));
    }

    if (mode === "state") { value(before, "solid"); dot(before, "new"); }
    else if (mode === "avg") { value(before, "solid"); dot(before, "new"); dot(avg, "avg"); }
    else if (mode === "after") { value(after, "solid"); dot(avg, "avgfaint"); dot(after, "new"); }
    else {
      value(before, "ghost"); value(after, "solid");
      svg.appendChild(el("line", { x1: X(before), y1: Y(before), x2: X(after), y2: Y(after),
        stroke: "#111", "stroke-width": 1.2 }));
      dot(before, "old"); dot(avg, "avg"); dot(after, "new");
    }
    return svg;
  }

  function build(root) {
    if (!root.dataset.amp) return;
    var M = math(root.dataset.amp), n = M.pts.length;
    var mode = root.dataset.mode || "mirror";
    var R = parseFloat(root.dataset.r || "44");
    var hl = (root.dataset.hl || "").split(",").map(function (s) { return s.trim(); });
    var labels = root.dataset.labels ? root.dataset.labels.split(",") : null;
    var sub = (root.dataset.sub || "").split(",");
    var coords = root.dataset.coords || "none";

    root.innerHTML = "";
    if (root.dataset.lab) {
      var lab = document.createElement("div"); lab.className = "lab";
      lab.innerHTML = root.dataset.lab; root.appendChild(lab);
    }
    var row = document.createElement("div"); row.className = "row"; root.appendChild(row);
    for (var i = 0; i < n; i++) {
      var isHl = hl.indexOf(String(i)) >= 0;
      var cell = document.createElement("div"); cell.className = "c" + (isHl ? " hl" : "");
      cell.appendChild(one(M.pts[i], M.avg, M.after[i], mode, R, isHl));
      var cap = document.createElement("small");
      var name = labels ? labels[i].trim() : String(i);
      var html = isHl ? "<b>|" + name + "⟩</b>" : "|" + name + "⟩";
      var p = coords === "before" ? M.pts[i] : coords === "after" ? M.after[i] : null;
      if (p) html += "<br>[" + fmt(p[0]) + ", " + fmt(p[1]) + "]";
      if (sub[i] && sub[i].trim()) html += "<br>" + sub[i].trim();
      cap.innerHTML = html; cell.appendChild(cap); row.appendChild(cell);
    }
    if (mode !== "state") {
      var key = document.createElement("div"); key.className = "key";
      key.innerHTML = mode === "avg" ? "● = ค่าเฉลี่ย [" + fmt(M.avg[0]) + ", " + fmt(M.avg[1]) + "] (ตำแหน่งเดียวกันทุกวง)"
        : mode === "after" ? "● จาง = ค่าเฉลี่ยเดิม [" + fmt(M.avg[0]) + ", " + fmt(M.avg[1]) + "] (ไม่ขยับ)"
        : "◌ เส้นประ = ค่าเดิม · ● = ค่าเฉลี่ย [" + fmt(M.avg[0]) + ", " + fmt(M.avg[1]) + "] · ○ = ค่าใหม่ (สะท้อนผ่าน ●)";
      root.appendChild(key);
    }
    if (root.dataset.cap) {
      var cp = document.createElement("div"); cp.className = "cap";
      cp.innerHTML = root.dataset.cap; root.appendChild(cp);
    }
  }

  function init() { document.querySelectorAll(".mplot").forEach(build); }
  window.buildMirrorPlots = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
