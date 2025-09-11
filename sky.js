const canvas = document.getElementById("skyCanvas");
const ctx = canvas.getContext("2d");
let img = new Image();
img.src = "ocean-horizon.png"; // replace with your file name

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let time = 0;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (img.complete) {
    // Scale to fit screen
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    // Shimmer effect: slice the image into strips and offset slightly
    const stripHeight = 3; // pixels per strip
    for (let sy = 0; sy < img.height; sy += stripHeight) {
      const dx = x;
      const dy = y + sy * scale + Math.sin((time + sy) * 0.02) * 2; // wave offset
      const dHeight = stripHeight * scale;
      ctx.drawImage(
        img,
        0, sy, img.width, stripHeight, // source
        dx, dy, drawWidth, dHeight     // destination
      );
    }
  }

  time += 1;
  requestAnimationFrame(draw);
}

img.onload = () => requestAnimationFrame(draw);

// Parallax interaction (mouse move)
window.addEventListener("mousemove", (e) => {
  const offsetX = (e.clientX / window.innerWidth - 0.5) * 20;
  const offsetY = (e.clientY / window.innerHeight - 0.5) * 10;
  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.02)`;
});
