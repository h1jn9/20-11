const svgUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

const fallbackFlower = svgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <g fill="#e53255">
    <ellipse cx="100" cy="66" rx="25" ry="46"/>
    <ellipse cx="100" cy="66" rx="25" ry="46" transform="rotate(72 100 100)"/>
    <ellipse cx="100" cy="66" rx="25" ry="46" transform="rotate(144 100 100)"/>
    <ellipse cx="100" cy="66" rx="25" ry="46" transform="rotate(216 100 100)"/>
    <ellipse cx="100" cy="66" rx="25" ry="46" transform="rotate(288 100 100)"/>
  </g>
  <circle cx="100" cy="100" r="20" fill="#f3b344"/>
</svg>`);

const fallbackPetal = svgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">
  <path d="M60 4 C104 32 108 96 60 156 C12 96 16 32 60 4Z" fill="#f2385c"/>
</svg>`);

const fallbackBranch = svgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M0 0 C120 70 200 190 320 400" stroke="#7a4832" stroke-width="12" stroke-linecap="round"/>
  <g fill="#e53255">
    <circle cx="95" cy="70" r="26"/><circle cx="170" cy="145" r="22"/>
    <circle cx="235" cy="235" r="24"/><circle cx="295" cy="315" r="20"/>
  </g>
</svg>`);

export const ASSETS = {
  branch: {
    src: "assets/branch/phuong-branch.svg",
    fallback: fallbackBranch,
    replaceWith: "assets/branch/phuong-branch.png"
  },
  petal: { src: "assets/flowers/phuong-petal.svg", fallback: fallbackPetal },
  flowers: [
    { src: "./hoa/hong-do.png", tone: "crimson", fallback: fallbackFlower },
    { src: "./hoa/hong-phan.png", tone: "blush", fallback: fallbackFlower },
    { src: "./hoa/hoa-sen.png", tone: "blush", fallback: fallbackFlower },
    { src: "./hoa/cuc-vang.png", tone: "gold", fallback: fallbackFlower },
    { src: "./hoa/hoa-kem.png", tone: "cream", fallback: fallbackFlower },
    { src: "./hoa/huongduong.png", tone: "gold", fallback: fallbackFlower }
  ],
  petals: ["#e53255", "#f8798e", "#ffb3a7", "#ffd9e0", "#d81b46"]
};

export function applyImageFallback(img, fallbackSrc) {
  if (!img || img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "1";
  img.src = fallbackSrc;
}

export function bindFallback(img, fallbackSrc) {
  if (!img) return;
  img.addEventListener("error", () => applyImageFallback(img, fallbackSrc), { once: true });
}
