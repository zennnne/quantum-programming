/* ============================================================
   circuit.js — component วาดวงจรควอนตัม (สไตล์ QCEngine ตามที่อาจารย์ใช้)
   สร้างตอนบท 0011 — เดิมวาด SVG มือทุกครั้ง ทั้งใน lesson และ cheat sheet

   วิธีใช้:
   <div class="circuit"
        data-wires="3"
        data-wire-labels="0x1,0x2,0x4"     ป้ายซ้ายมือ (ไม่ใส่ก็ได้)
        data-init="0,0,1"                  ค่าเริ่มต้นบนเส้น |0⟩ |0⟩ |1⟩ (ไม่ใส่ก็ได้)
        data-names="alice,ep,bob"          ชื่อ qubit หน้าป้าย (ไม่ใส่ก็ได้ — เพิ่มตอนบท 0014)
        data-groups="0-1:entangle; 2-4:prep payload:45°"   กล่องมีชื่อคร่อมคอลัมน์ (0-based)
        data-out="0-2:abs(a); 3:sign(a)"   ปีกกา + ป้ายเอาต์พุตฝั่งขวา (คร่อมสาย, 0-based)
        data-ops="H:0; CNOT:0,1; READ:0"></div>

   ops ที่รองรับ (คั่นด้วย ; — แต่ละ op = 1 คอลัมน์, ใช้ "_" เป็นช่องว่าง):
     ใช้ + เชื่อมถ้าต้องการหลาย gate ใน "คอลัมน์เดียวกัน"  เช่น  H:0 + H:1
     ⚠ ต้องมีเว้นวรรคขนาบ + เสมอ ("H:0 + H:1" ไม่ใช่ "H:0+H:1")
       เพราะ + ที่ติดกับตัวอักษรถือเป็นข้อความปกติ — ทำให้ label ของ BOX
       อย่าง "BOX:0,2:+1:2" (กล่อง +1) ใช้งานได้

     H:w              Hadamard
     X:w[,w2,...]     NOT (⊕) — ใส่หลายสายได้ = ⊕ หลายตัวในคอลัมน์เดียว
     P:w:45           PHASE 45° (φ)
     Y:w              Pauli-Y (กล่อง Y)
     RX:w:45          ROTX 45° (กล่อง RX + ป้ายองศา)
     RY:w:45          ROTY 45° (กล่อง RY + ป้ายองศา)
     Z:w              Z gate (กล่อง Z)
     RNOT:w           root-of-NOT
     CNOT:c,t         control c → target t (⊕)
     CZ:a,b[,c,...]   ●—● สมมาตร (ใส่กี่สายก็ได้ — Lec 05 มีแบบ 3 จุด)
     CP:a,b:45        CPHASE(45°) φ—φ
     CCNOT:c1,c2,t    Toffoli
     CTRL:c[,c2,...]  จุดควบคุม ● ล้วน — ใช้คู่กับ gate ตัวอื่นใน "คอลัมน์เดียวกัน" ผ่าน +
                      เส้นตั้งเชื่อมทุกอย่างในคอลัมน์นั้นวาดให้อัตโนมัติ (เพิ่มตอนบท Lec 05)
                        NOT ที่มี 3 control : "CTRL:0,1,3 + X:2"
                        multi-target CNOT   : "CTRL:3 + X:0,1,2"
                        control คุม gate อื่น: "CTRL:0 + H:1"
     SWAP:a,b         ×—×
     CSWAP:c,a,b      control c + swap a,b
     XWIRE:a,b        SWAP แบบ "สายไขว้" (ไม่มี ×) — เส้นสาย a กับ b ไขว้กันในคอลัมน์นั้น
                      ใช้คู่ SWAP ในคอลัมน์เดียวกันได้ เช่น "SWAP:0,3 + XWIRE:1,2" (QFT Lec07 p15 · เพิ่มตอนบท 0027)
     READ:w           detector (อ่านค่า)
     READ:w:1 / READ:w:0   detector แสดงค่าที่อ่านได้ (เหลือง+ขีด = 1 · เทา+วง = 0) · Lec09 Fig 9-3 (บท 0034)
     QRAM:lo,hi:ตาราง:กว้าง  กล่องเทา QRAM คร่อมสาย lo..hi · ตาราง "00>011|01>110" (ไม่ใส่ได้) · Fig 9-4 (บท 0034)
     RAM:lo,hi:ตาราง:กว้าง   เหมือน QRAM แต่ชื่อกล่อง "RAM" (RAM ธรรมดา Fig 9-2)
     QRAMDA:lo,hi:k   กล่อง QRAM แบ่ง D (k สายบน) / A (ที่เหลือ) + จุดครึ่งวงที่ขอบ · Fig 9-5 (บท 0034)
     WRITE:w          สัญลักษณ์ write ▷ หัวสาย (เส้นก่อนหน้านี้จะจางลงอัตโนมัติ)
     WRITE:w:1        write 1 = สามเหลี่ยมเหลืองทึบ (ไม่ใส่ :1 = write 0 วงฟ้า) · เพิ่มตอนบท 0029
     BOX:wlo,whi:?:2  กล่องโปร่งคร่อมสาย wlo..whi มีข้อความข้างใน (เพิ่มตอนบท 0021)
                      พารามิเตอร์ที่ 4 = กว้างกี่คอลัมน์ (ไม่ใส่ = 1) — ต้องเว้น "_" ต่อท้ายให้ครบ
     ELL:w[,w2,...]   สายขาดเป็น "···" (ละช่วงกลาง) · Fig 9-9 (บท 0036)
     data-dash="0-4; 6-10"        กรอบแดงเส้นประคร่อมคอลัมน์ (ทุกสาย) · บท 0036
     data-under="0-16:m times"    ปีกกาแดงใต้วงจร + ป้ายตัวเอียง · บท 0036 · หลายอันคั่น ";" ได้ (บท 0043)
     CC:src,tgt       ควบคุมด้วยบิตคลาสสิก = ลูกศรประฟ้าจากสาย src ลงไปที่ gate บนสาย tgt
                      ใช้คู่กับ gate ในคอลัมน์เดียวกันเสมอ เช่น  "CC:1,2 + X:2"

   หมายเหตุ: หลัง READ:w เส้นสาย w จะกลายเป็นเส้นจางอัตโนมัติ (= qubit ถูกทำลายแล้ว)
   ============================================================ */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var GAP = 40, TOP = 24, COLW = 52, PAD_R = 18;
  /* ตัวคั่น gate ใน "คอลัมน์เดียวกัน" = เครื่องหมาย + ที่มีเว้นวรรคขนาบสองข้าง
     (ต้องมีช่องว่าง ไม่งั้น label ของ BOX อย่าง "BOX:0,2:+1:2" จะโดนหั่นกลางคัน) */
  var COLSEP = /\s+\+\s+/;

  function el(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  function txt(x, y, s, size, weight, anchor) {
    var t = el("text", {
      x: x, y: y, "font-size": size || 13, "font-weight": weight || 700,
      "text-anchor": anchor || "middle", fill: "#1a1a1a"
    });
    t.textContent = s;
    return t;
  }

  /* ---------- ชิ้นส่วนพื้นฐาน ---------- */
  function box(g, x, y, label) {
    g.appendChild(el("rect", { x: x - 13, y: y - 13, width: 26, height: 26,
      fill: "#fff", stroke: "#1a1a1a", "stroke-width": 2 }));
    g.appendChild(txt(x, y + 5, label, 13, 800));
  }
  function ctrl(g, x, y) {
    g.appendChild(el("circle", { cx: x, cy: y, r: 6, fill: "#1a1a1a" }));
  }
  function xor(g, x, y) {
    g.appendChild(el("circle", { cx: x, cy: y, r: 11, fill: "#fff",
      stroke: "#1a1a1a", "stroke-width": 2.2 }));
    g.appendChild(el("line", { x1: x - 11, y1: y, x2: x + 11, y2: y,
      stroke: "#1a1a1a", "stroke-width": 2.2 }));
    g.appendChild(el("line", { x1: x, y1: y - 11, x2: x, y2: y + 11,
      stroke: "#1a1a1a", "stroke-width": 2.2 }));
  }
  function phi(g, x, y) {
    g.appendChild(el("circle", { cx: x, cy: y, r: 10, fill: "#fff",
      stroke: "#1a1a1a", "stroke-width": 2.2 }));
    g.appendChild(txt(x, y + 5, "φ", 13, 700));
  }
  function cross(g, x, y) {
    var d = 8;
    g.appendChild(el("line", { x1: x - d, y1: y - d, x2: x + d, y2: y + d,
      stroke: "#1a1a1a", "stroke-width": 2.6 }));
    g.appendChild(el("line", { x1: x - d, y1: y + d, x2: x + d, y2: y - d,
      stroke: "#1a1a1a", "stroke-width": 2.6 }));
  }
  /* val = "1" → detector เหลือง + ขีดฟ้า (อ่านได้ 1) · "0" → เทา + วงฟ้า (อ่านได้ 0)
     สไตล์ QCEngine Lec09 Fig 9-3 · ไม่ใส่ = detector ม่วงอ่อนแบบเดิม (เพิ่มตอนบท 0034) */
  function detector(g, x, y, val) {
    var fill = val === "1" ? "#f3ef9a" : val === "0" ? "#d4d6da" : "#efe9fb";
    g.appendChild(el("path", { d: "M" + x + "," + (y - 12) + " A12,12 0 0 1 " + x + "," + (y + 12),
      fill: fill, stroke: "#1a1a1a", "stroke-width": 1.8 }));
    g.appendChild(el("line", { x1: x, y1: y - 12, x2: x, y2: y + 12,
      stroke: "#1a1a1a", "stroke-width": 1.8 }));
    if (val === "1") g.appendChild(el("line", { x1: x + 5, y1: y - 5, x2: x + 5, y2: y + 5,
      stroke: "#29a3d9", "stroke-width": 2.6 }));
    if (val === "0") g.appendChild(el("circle", { cx: x + 5.5, cy: y, r: 3.2, fill: "#fff",
      stroke: "#29a3d9", "stroke-width": 2 }));
  }

  /* กล่อง QRAM สีเทา คร่อมสาย yTop..yBot + ตาราง Address→Value ข้างใน (Lec09 Fig 9-4 · บท 0034)
     table = "00>011|01>110|10>100|11>111" (ไม่ใส่ = กล่องเปล่ามีแค่คำว่า QRAM) */
  function qramBox(g, x, yTop, yBot, table, span, title) {
    title = title || "QRAM";
    var w = (span || 1) * COLW - 10, bx = x - COLW / 2 + 5, cx = bx + w / 2;
    var y = yTop - 17, h = (yBot - yTop) + 34;
    g.appendChild(el("rect", { x: bx, y: y, width: w, height: h,
      rx: 8, fill: "#e2e3e5", stroke: "#1a1a1a", "stroke-width": 2.4 }));
    var rows = table ? table.split("|").map(function (r) { return r.split(">"); }) : [];
    if (!rows.length) { g.appendChild(txt(cx, (yTop + yBot) / 2 + 9, title, 24, 800)); return; }
    g.appendChild(txt(cx, y + 30, title, 24, 800));
    var RH = 20, tw = Math.min(w - 16, 150), tx = cx - tw / 2, ty = y + 42, th = RH * (rows.length + 1) + 6;
    g.appendChild(el("rect", { x: tx, y: ty, width: tw, height: th, rx: 5,
      fill: "#fff", stroke: "#1a1a1a", "stroke-width": 1.6 }));
    g.appendChild(el("line", { x1: cx, y1: ty, x2: cx, y2: ty + th, stroke: "#1a1a1a", "stroke-width": 1.2 }));
    g.appendChild(el("line", { x1: tx, y1: ty + RH + 2, x2: tx + tw, y2: ty + RH + 2, stroke: "#1a1a1a", "stroke-width": 1 }));
    g.appendChild(txt(cx - tw / 4, ty + 15, "Address", 11, 600));
    g.appendChild(txt(cx + tw / 4, ty + 15, "Value", 11, 600));
    rows.forEach(function (r, i) {
      var ry = ty + RH * (i + 2) - 1;
      var a = txt(cx - tw / 4, ry, (r[0] || "").split("").join(" "), 14, 800);
      var v = txt(cx + tw / 4, ry, (r[1] || "").split("").join(" "), 14, 800);
      a.setAttribute("font-family", "monospace"); v.setAttribute("font-family", "monospace");
      g.appendChild(a); g.appendChild(v);
    });
  }

  /* กล่อง QRAM แบบแบ่ง D / A (Lec09 Fig 9-5 · บท 0034) — ys = ทุกสายที่คร่อม, k = จำนวนสายฝั่ง D (บน)
     จุดดำครึ่งวงที่ขอบซ้าย-ขวาของกล่องบนทุกสาย */
  function qramDA(g, x, ys, k) {
    var hw = 17, yTop = ys[0] - 17, yBot = ys[ys.length - 1] + 17;
    var ySplit = (ys[k - 1] + ys[k]) / 2;
    ys.forEach(function (yy) {
      [x - hw, x + hw].forEach(function (ex) {
        g.appendChild(el("circle", { cx: ex, cy: yy, r: 6, fill: "#1a1a1a" }));
      });
    });
    g.appendChild(el("rect", { x: x - hw, y: yTop, width: 2 * hw, height: yBot - yTop,
      rx: 4, fill: "#fff", stroke: "#1a1a1a", "stroke-width": 2.4 }));
    g.appendChild(el("line", { x1: x - hw, y1: ySplit, x2: x + hw, y2: ySplit,
      stroke: "#1a1a1a", "stroke-width": 1.4 }));
    g.appendChild(txt(x, (yTop + ySplit) / 2 + 7, "D", 20, 800));
    g.appendChild(txt(x, (ySplit + yBot) / 2 + 7, "A", 20, 800));
  }
  /* สัญลักษณ์ write ▷ — วงกลมเล็กสีฟ้า + สามเหลี่ยมเปิด (QCEngine วางไว้หัวสาย) */
  /* one = true → เขียน 1: สามเหลี่ยมเหลืองทึบ + ขีดฟ้า (สไตล์ QCEngine Lec07 p49) · ไม่ใส่ = เขียน 0: วงฟ้า + สามเหลี่ยมโปร่ง */
  function write(g, x, y, one) {
    if (one) g.appendChild(el("line", { x1: x - 13, y1: y - 5, x2: x - 13, y2: y + 5,
      stroke: "#29a3d9", "stroke-width": 3 }));
    else g.appendChild(el("circle", { cx: x - 13, cy: y, r: 3.2, fill: "#fff",
      stroke: "#29a3d9", "stroke-width": 2 }));
    g.appendChild(el("path", { d: "M" + (x - 8) + "," + (y - 11) + " L" + (x + 7) + "," + y +
      " L" + (x - 8) + "," + (y + 11) + (one ? " Z" : ""), fill: one ? "#f3ef9a" : "none",
      stroke: one ? "#8a8a3a" : "#1a1a1a", "stroke-width": one ? 1.4 : 2 }));
  }

  /* ควบคุมด้วยบิตคลาสสิก — ลูกศรประสีฟ้าชี้ลงจากสายที่ถูก READ ไปยัง gate */
  function cclassic(g, x, ySrc, yTgt) {
    var C = "#29a3d9", top = ySrc + 5, bot = yTgt - 15;
    g.appendChild(el("circle", { cx: x, cy: ySrc, r: 4.5, fill: C }));
    g.appendChild(el("line", { x1: x, y1: top, x2: x, y2: bot,
      stroke: C, "stroke-width": 2.6, "stroke-dasharray": "3 4", "stroke-linecap": "round" }));
    g.appendChild(el("path", { d: "M" + (x - 5) + "," + bot + " L" + (x + 5) + "," + bot +
      " L" + x + "," + (bot + 7) + " Z", fill: C }));
  }

  /* กล่องโปร่งคร่อมหลายสาย (เช่นกล่อง "?" ของโจทย์ abs) — เพิ่มตอนบท 0021 */
  function wideBox(g, x, yTop, yBot, label, span) {
    var w = (span || 1) * COLW - 10;
    var y = yTop - 17, h = (yBot - yTop) + 34;
    g.appendChild(el("rect", { x: x - COLW / 2 + 5, y: y, width: w, height: h,
      rx: 6, fill: "#fff", stroke: "#1a1a1a", "stroke-width": 2.4 }));
    /* ป้ายยาว (เช่น "Phase estimation" บท 0031) ล้นกล่อง → ย่อฟอนต์ให้พอดีความกว้าง (≈0.6em ต่อตัวอักษร) */
    var fs = Math.min(30, Math.floor((w - 14) / (0.6 * label.length)));
    g.appendChild(txt(x - COLW / 2 + 5 + w / 2, (yTop + yBot) / 2 + fs * 0.37, label, fs, 800));
  }

  /* ปีกกา } ฝั่งขวา สำหรับป้ายเอาต์พุต — เพิ่มตอนบท 0021 */
  function brace(g, x, y1, y2) {
    var r = 6, ym = (y1 + y2) / 2;
    g.appendChild(el("path", {
      d: "M" + x + "," + y1 + " q" + r + ",0 " + r + "," + r +
         " V" + (ym - r) + " q0," + r + " " + r + "," + r +
         " q-" + r + ",0 -" + r + "," + r +
         " V" + (y2 - r) + " q0," + r + " -" + r + "," + r,
      fill: "none", stroke: "#1a1a1a", "stroke-width": 1.8 }));
  }

  function link(g, x, ys, thick) {
    var a = Math.min.apply(null, ys), b = Math.max.apply(null, ys);
    g.appendChild(el("line", { x1: x, y1: a, x2: x, y2: b,
      stroke: "#1a1a1a", "stroke-width": thick || 2.4 }));
  }

  /* ---------- วาด op หนึ่งตัว ---------- */
  function drawOp(g, name, ws, arg, x, yOf, angleY, arg2) {
    var y = ws.map(yOf);
    switch (name) {
      case "H": box(g, x, y[0], "H"); break;
      case "Z": box(g, x, y[0], "Z"); break;
      case "RNOT": box(g, x, y[0], "√X"); break;
      case "Y": box(g, x, y[0], "Y"); break;
      case "RX":
        box(g, x, y[0], "RX");
        if (arg) g.appendChild(txt(x, angleY, arg + "°", 11, 700));
        break;
      case "RY":
        box(g, x, y[0], "RY");
        if (arg) g.appendChild(txt(x, angleY, arg + "°", 11, 700));
        break;
      case "X": y.forEach(function (yy) { xor(g, x, yy); }); break;
      case "CTRL": y.forEach(function (yy) { ctrl(g, x, yy); }); break;
      case "P":
        phi(g, x, y[0]);
        if (arg) g.appendChild(txt(x, angleY, arg + "°", 11, 700));
        break;
      case "CNOT": link(g, x, y); ctrl(g, x, y[0]); xor(g, x, y[1]); break;
      case "CZ":
        link(g, x, y, 3); y.forEach(function (yy) { ctrl(g, x, yy); }); break;
      case "CP":
        link(g, x, y); phi(g, x, y[0]); phi(g, x, y[1]);
        if (arg) g.appendChild(txt(x, angleY, arg + "°", 11, 700));
        break;
      case "CCNOT":
        link(g, x, y); ctrl(g, x, y[0]); ctrl(g, x, y[1]); xor(g, x, y[2]); break;
      case "SWAP": link(g, x, y); cross(g, x, y[0]); cross(g, x, y[1]); break;
      case "XWIRE":
        [[y[0], y[1]], [y[1], y[0]]].forEach(function (p) {
          g.appendChild(el("path", { d: "M" + (x - COLW / 2) + "," + p[0] + " L" + (x - 12) + "," + p[0] +
            " L" + (x + 12) + "," + p[1] + " L" + (x + COLW / 2) + "," + p[1],
            fill: "none", stroke: "#1a1a1a", "stroke-width": 2 }));
        });
        break;
      case "CSWAP":
        link(g, x, y); ctrl(g, x, y[0]); cross(g, x, y[1]); cross(g, x, y[2]); break;
      case "READ": y.forEach(function (yy) { detector(g, x, yy, arg); }); break;
      case "QRAM":
        qramBox(g, x, y[0], y[y.length - 1], arg, parseInt(arg2, 10) || 1); break;
      case "RAM":   /* RAM ธรรมดา (Fig 9-2) — หน้าตาเดียวกับ QRAM ต่างแค่ชื่อ */
        qramBox(g, x, y[0], y[y.length - 1], arg, parseInt(arg2, 10) || 1, "RAM"); break;
      case "QRAMDA": {
        var ys = [];
        for (var wi = ws[0]; wi <= ws[ws.length - 1]; wi++) ys.push(yOf(wi));
        qramDA(g, x, ys, parseInt(arg, 10) || 1); break;
      }
      case "WRITE": y.forEach(function (yy) { write(g, x, yy, arg === "1"); }); break;
      case "BOX":
        wideBox(g, x, y[0], y[y.length - 1], arg || "?", parseInt(arg2, 10) || 1); break;
      case "CC": cclassic(g, x, y[0], y[1]); break;
      case "_": break;
      case "ELL":   /* สายขาดเป็น "···" (ละไว้ในฐานที่เข้าใจ) — Fig 9-9 บท 0036 */
        y.forEach(function (yy) {
          g.appendChild(el("rect", { x: x - COLW / 2 + 6, y: yy - 4, width: COLW - 12, height: 8, fill: "#fff" }));
          g.appendChild(txt(x, yy + 4, "···", 15, 800));
        });
        break;
      default: console.warn("circuit.js: ไม่รู้จัก op", name);
    }
  }

  function build(node) {
    var nw = parseInt(node.dataset.wires || "2", 10);
    var wlabels = node.dataset.wireLabels ? node.dataset.wireLabels.split(",") : null;
    var init = node.dataset.init ? node.dataset.init.split(",") : null;
    var ops = (node.dataset.ops || "").split(";")
      .map(function (s) { return s.trim(); }).filter(Boolean);

    var names = node.dataset.names ? node.dataset.names.split(",") : null;
    var groups = node.dataset.groups
      ? node.dataset.groups.split(";").map(function (s) { return s.trim(); }).filter(Boolean)
      : null;

    var outs = node.dataset.out
      ? node.dataset.out.split(";").map(function (t) { return t.trim(); }).filter(Boolean)
        .map(function (spec) {
          var p = spec.split(":");
          var r = p[0].split("-");
          return { a: parseInt(r[0], 10),
                   b: parseInt(r[1] !== undefined ? r[1] : r[0], 10),
                   label: (p[1] || "").trim() };
        })
      : null;
    var outW = 0;
    if (outs) {
      var longest = 0;
      outs.forEach(function (o) { longest = Math.max(longest, o.label.length); });
      outW = 20 + longest * 7.2;
    }

    var nameW = names ? 44 : 0;
    var labW = wlabels ? 46 : 0;
    var initW = init ? 26 : 0;
    var x0 = nameW + labW + initW + 22;
    var W = x0 + ops.length * COLW + PAD_R + outW;
    var OY = groups ? 40 : 0;              // ที่ว่างด้านบนสำหรับป้ายชื่อกล่อง
    /* กรอบแดงเส้นประคร่อมคอลัมน์ + ปีกกาแดงด้านล่าง (Fig 9-9 "m times") — เพิ่มตอนบท 0036 */
    var spanOf = function (spec) {
      var p = spec.split(":"), r = p[0].split("-");
      return { a: parseInt(r[0], 10), b: parseInt(r[1] !== undefined ? r[1] : r[0], 10),
               label: (p[1] || "").trim() };
    };
    var dashes = node.dataset.dash
      ? node.dataset.dash.split(";").map(function (s) { return s.trim(); }).filter(Boolean).map(spanOf)
      : null;
    /* data-under หลายช่วงคั่นด้วย ";" ได้ (Fig 11-10 มีปีกกา 2 อัน) — บท 0043 */
    var unders = node.dataset.under
      ? node.dataset.under.split(";").map(function (s) { return s.trim(); }).filter(Boolean).map(spanOf)
      : null;
    var UY = unders ? 44 : 0;
    var H = TOP + OY + (nw - 1) * GAP + 30 + UY;
    var angleY = groups ? 42 : 10;

    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H,
      role: "img", "aria-label": node.dataset.alt || "วงจรควอนตัม" });
    var yOf = function (i) { return TOP + OY + i * GAP; };
    var xOf = function (j) { return x0 + j * COLW; };

    /* กล่องมีชื่อกำกับ (entangle / prep payload / ...) — วาดก่อนเส้นสาย จะได้อยู่ชั้นล่างสุด */
    if (groups) {
      groups.forEach(function (spec) {
        var p = spec.split(":");
        var r = p[0].split("-");
        var a = parseInt(r[0], 10), b = parseInt(r[1] !== undefined ? r[1] : r[0], 10);
        var gx = xOf(a) - COLW / 2 + 5, gw = (b - a) * COLW + COLW - 10;
        var gy = 22, gh = H - gy - 12 - UY;   // ไม่ลงไปทับปีกกา data-under (บท 0043)
        svg.appendChild(el("rect", { x: gx, y: gy, width: gw, height: gh,
          rx: 12, fill: "#eef1f5" }));
        svg.appendChild(el("path", {                    // วงเล็บโค้งสีเขียวน้ำเงิน บน+ล่าง
          d: "M" + gx + "," + (gy + 12) + " q0,-12 12,-12 H" + (gx + gw - 12) +
             " q12,0 12,12 M" + gx + "," + (gy + gh - 12) + " q0,12 12,12 H" +
             (gx + gw - 12) + " q12,0 12,-12",
          fill: "none", stroke: "#116370", "stroke-width": 1.8 }));
        var gt = txt(gx + gw / 2, 15, p[1] || "", 12, 700);
        gt.setAttribute("fill", "#116370");
        svg.appendChild(gt);
        if (p[2]) svg.appendChild(txt(gx + gw / 2, gy + 16, p[2], 11, 800));
      });
    }

    /* หาจุด write / read ของแต่ละสาย → ช่วงนอกนั้นวาดเป็นเส้นจาง */
    var wCol = [], rCol = [], gaps = [];
    ops.forEach(function (col, j) {
      col.split(COLSEP).forEach(function (spec) {
        var q = spec.trim().split(":");
        var nm = q[0].trim().toUpperCase();
        var w = parseInt((q[1] || "").split(",")[0], 10);
        if (isNaN(w)) return;
        if (nm === "WRITE") wCol[w] = j;
        if (nm === "READ") (q[1] || "").split(",").forEach(function (v) {
          var wi = parseInt(v, 10);
          if (!isNaN(wi)) rCol[wi] = j;
        });
        if (nm === "XWIRE") (q[1] || "").split(",").forEach(function (v) {
          var wi = parseInt(v, 10);
          if (!isNaN(wi)) (gaps[wi] = gaps[wi] || []).push(j);
        });
      });
    });

    function wire(x1, x2, y, faint, gp) {
      if (x2 <= x1) return;
      if (gp && gp.length) {   /* เว้นช่องคอลัมน์ XWIRE ให้เส้นไขว้วาดแทน */
        var cut = gp.map(function (j) { return xOf(j); }).sort(function (a, b) { return a - b; })
          .filter(function (cx) { return cx - COLW / 2 < x2 && cx + COLW / 2 > x1; });
        if (cut.length) {
          var cx = cut[0];
          wire(x1, cx - COLW / 2, y, faint);
          wire(cx + COLW / 2, x2, y, faint, gp.filter(function (j) { return xOf(j) !== cx; }));
          return;
        }
      }
      svg.appendChild(el("line", { x1: x1, y1: y, x2: x2, y2: y,
        stroke: faint ? "#c9ced6" : "#1a1a1a", "stroke-width": faint ? 1.5 : 2 }));
    }

    for (var i = 0; i < nw; i++) {
      var y = yOf(i);
      var xs = nameW + labW + initW + 4, xe = W - 6 - outW;
      var wc = wCol[i], rc = rCol[i];
      var solidA = wc === undefined ? xs : xOf(wc) - 14;
      var solidB = rc === undefined ? xe : xOf(rc) + 13;
      wire(xs, solidA, y, true, gaps[i]);
      wire(solidA, solidB, y, false, gaps[i]);
      wire(solidB, xe, y, true, gaps[i]);
      if (names && names[i]) {
        var tn = txt(nameW - 4, y + 4, names[i].trim(), 12, 800, "end");
        tn.setAttribute("fill", "#1a1a1a");
        svg.appendChild(tn);
      }
      if (wlabels && wlabels[i]) {
        var t = txt(nameW + labW - 6, y + 4, wlabels[i].trim(), 11, 700, "end");
        t.setAttribute("fill", "#4a4a4a");
        svg.appendChild(t);
      }
      if (init && init[i] !== undefined && init[i].trim() !== "") {
        var t2 = txt(nameW + labW + 12, y - 5, "|" + init[i].trim() + "⟩", 11, 400);
        t2.setAttribute("fill", "#666");
        svg.appendChild(t2);
      }
    }

    var RED = "#c62828";
    if (dashes) dashes.forEach(function (d) {
      var dx = xOf(d.a) - COLW / 2 + 1, dy = yOf(0) - 22;
      svg.appendChild(el("rect", { x: dx, y: dy, width: (d.b - d.a + 1) * COLW - 2,
        height: yOf(nw - 1) - yOf(0) + 44, fill: "none", stroke: RED,
        "stroke-width": 1.6, "stroke-dasharray": "5 4" }));
    });
    if (unders) unders.forEach(function (under) {
      var ux1 = xOf(under.a) - COLW / 2 + 1, ux2 = xOf(under.b) + COLW / 2 - 1;
      var uy = yOf(nw - 1) + 28, um = (ux1 + ux2) / 2, ur = 6;
      svg.appendChild(el("path", {
        d: "M" + ux1 + "," + uy + " q0," + ur + " " + ur + "," + ur + " H" + (um - ur) +
           " q" + ur + ",0 " + ur + "," + ur + " q0,-" + ur + " " + ur + ",-" + ur +
           " H" + (ux2 - ur) + " q" + ur + ",0 " + ur + ",-" + ur,
        fill: "none", stroke: RED, "stroke-width": 1.8 }));
      var ut = txt(um, uy + 32, under.label, 15, 700);
      ut.setAttribute("fill", RED);
      ut.setAttribute("font-style", "italic");
      svg.appendChild(ut);
    });

    /* ปีกกา + ป้ายเอาต์พุตฝั่งขวา */
    if (outs) {
      var bx = W - outW + 4;
      outs.forEach(function (o) {
        var ya = yOf(o.a), yb = yOf(o.b);
        if (yb > ya) brace(svg, bx, ya, yb);
        var t3 = txt(bx + 16, (ya + yb) / 2 + 5, o.label, 13, 800, "start");
        svg.appendChild(t3);
      });
    }

    ops.forEach(function (col, j) {
      // "+" = หลาย gate ในคอลัมน์เดียวกัน เช่น "H:0 + H:1"
      var specs = col.split(COLSEP).map(function (spec) {
        var parts = spec.trim().split(":");
        return {
          name: parts[0].trim().toUpperCase(),
          ws: (parts[1] || "").split(",")
            .map(function (s) { return parseInt(s.trim(), 10); })
            .filter(function (v) { return !isNaN(v); }),
          arg: (parts[2] || "").trim(),
          arg2: (parts[3] || "").trim()
        };
      });

      /* มี CTRL ในคอลัมน์ = control หนึ่ง/หลายจุดคุม gate อื่นในคอลัมน์เดียวกัน
         → ลากเส้นตั้งเส้นเดียวคลุมทุกสายที่เกี่ยวข้อง (วาดก่อน gate จะได้อยู่ใต้สัญลักษณ์)
         CC (ลูกศรคลาสสิก) กับ WRITE/READ ไม่นับ เพราะไม่ได้อยู่ในเส้นควบคุมเดียวกัน */
      if (specs.some(function (s) { return s.name === "CTRL"; })) {
        var linked = [];
        specs.forEach(function (s) {
          if (s.name === "CC" || s.name === "WRITE" || s.name === "READ") return;
          s.ws.forEach(function (w) { linked.push(yOf(w)); });
        });
        if (linked.length > 1) link(svg, xOf(j), linked);
      }

      specs.forEach(function (s) {
        drawOp(svg, s.name, s.ws, s.arg, xOf(j), yOf, angleY, s.arg2);
      });
    });

    node.innerHTML = "";
    node.appendChild(svg);
    if (node.dataset.cap) {
      var c = document.createElement("div");
      c.className = "cap";
      c.innerHTML = node.dataset.cap;
      node.appendChild(c);
    }
  }

  /* build ซ้ำได้หลัง inject HTML ใหม่ (gate-drill.html) — root ไม่ใส่ = ทั้งหน้า
     ไม่กระทบ auto-init เดิม (build อ่านจาก dataset อย่างเดียว เรียกซ้ำได้) */
  function buildAll(root) {
    (root || document).querySelectorAll(".circuit").forEach(build);
  }
  window.buildCircuits = buildAll;

  function init() { buildAll(document); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
