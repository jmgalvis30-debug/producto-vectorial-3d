const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let angleX = -0.5;
let angleY = 0.7;
let zoom = 65;
let dragging = false;
let lastX = 0;
let lastY = 0;
let vectors = { A: [2, 1, 0], B: [1, 2, 1], C: [1, -2, 3] };

const value = id => {
  const raw = document.getElementById(id).value;
  return raw === "" ? 0 : Number(raw);
};
const fmt = n => Number(n.toFixed(4)).toString();

function calculate() {
  const A = [value("ax"), value("ay"), value("az")];
  const B = [value("bx"), value("by"), value("bz")];

  // A × B = (AyBz − AzBy, AzBx − AxBz, AxBy − AyBx)
  const C = [
    A[1] * B[2] - A[2] * B[1],
    A[2] * B[0] - A[0] * B[2],
    A[0] * B[1] - A[1] * B[0]
  ];
  const magnitude = Math.sqrt(C.reduce((sum, component) => sum + component ** 2, 0));
  vectors = { A, B, C };

  document.getElementById("result").innerHTML = `
    <p><strong>Datos iniciales</strong><br>
    A = (${A.map(fmt).join(", ")})<br>
    B = (${B.map(fmt).join(", ")})</p>
    <p><strong>Fórmula</strong></p>
    <div class="step">A × B = (Ay·Bz − Az·By, Az·Bx − Ax·Bz, Ax·By − Ay·Bx)</div>
    <p><strong>Desarrollo de cada componente</strong></p>
    <div class="step">Componente X: (${fmt(A[1])} × ${fmt(B[2])}) − (${fmt(A[2])} × ${fmt(B[1])}) = <b>${fmt(C[0])}</b></div>
    <div class="step">Componente Y: (${fmt(A[2])} × ${fmt(B[0])}) − (${fmt(A[0])} × ${fmt(B[2])}) = <b>${fmt(C[1])}</b></div>
    <div class="step">Componente Z: (${fmt(A[0])} × ${fmt(B[1])}) − (${fmt(A[1])} × ${fmt(B[0])}) = <b>${fmt(C[2])}</b></div>
    <p class="answer">Resultado: A × B = (${C.map(fmt).join(", ")})</p>
    <p><strong>Magnitud del producto:</strong> |A × B| = ${fmt(magnitude)}</p>
    <p>El vector resultante es perpendicular a los vectores A y B.</p>`;
  draw();
}

function rotate([x, y, z]) {
  const y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
  const z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
  const x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
  const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);
  return [x2, y1, z2];
}

function project(point) {
  const [x, y, z] = rotate(point);
  return [canvas.width / 2 + x * zoom, canvas.height / 2 - y * zoom - z * zoom * 0.7];
}

function drawLine(start, end, color, width = 3) {
  const p1 = project(start), p2 = project(end);
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();

  const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  const head = 11;
  ctx.beginPath();
  ctx.moveTo(p2[0], p2[1]);
  ctx.lineTo(p2[0] - head * Math.cos(angle - 0.4), p2[1] - head * Math.sin(angle - 0.4));
  ctx.lineTo(p2[0] - head * Math.cos(angle + 0.4), p2[1] - head * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  const { A, B, C } = vectors;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const origin = [0, 0, 0];
  const max = Math.max(3, ...A.map(Math.abs), ...B.map(Math.abs), ...C.map(Math.abs));
  const axisLength = max * 1.35;
  const sum = A.map((n, i) => n + B[i]);

  // Ejes coordenados
  drawLine(origin, [axisLength, 0, 0], "#64748b", 2);
  drawLine(origin, [0, axisLength, 0], "#64748b", 2);
  drawLine(origin, [0, 0, axisLength], "#64748b", 2);

  // Paralelogramo generado por A y B
  drawLine(A, sum, "#94a3b8", 2);
  drawLine(B, sum, "#94a3b8", 2);

  // Vectores
  drawLine(origin, A, "#e53935", 4);
  drawLine(origin, B, "#16a34a", 4);
  drawLine(origin, C, "#2563eb", 4);

  ctx.font = "bold 17px Arial";
  ctx.fillStyle = "#e53935"; ctx.fillText("A", ...project(A));
  ctx.fillStyle = "#16a34a"; ctx.fillText("B", ...project(B));
  ctx.fillStyle = "#2563eb"; ctx.fillText("A × B", ...project(C));
  ctx.fillStyle = "#475569";
  ctx.fillText("X", ...project([axisLength, 0, 0]));
  ctx.fillText("Y", ...project([0, axisLength, 0]));
  ctx.fillText("Z", ...project([0, 0, axisLength]));
}

canvas.addEventListener("pointerdown", event => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  angleY += (event.clientX - lastX) * 0.01;
  angleX += (event.clientY - lastY) * 0.01;
  lastX = event.clientX;
  lastY = event.clientY;
  draw();
});
canvas.addEventListener("pointerup", () => dragging = false);
canvas.addEventListener("pointercancel", () => dragging = false);
canvas.addEventListener("wheel", event => {
  event.preventDefault();
  zoom *= event.deltaY < 0 ? 1.08 : 0.92;
  zoom = Math.max(15, Math.min(180, zoom));
  draw();
}, { passive: false });

document.getElementById("calculate").addEventListener("click", calculate);
document.getElementById("reset").addEventListener("click", () => {
  const defaults = { ax: 2, ay: 1, az: 0, bx: 1, by: 2, bz: 1 };
  Object.entries(defaults).forEach(([id, number]) => document.getElementById(id).value = number);
  calculate();
});

calculate();
