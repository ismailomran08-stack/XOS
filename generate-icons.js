// Generate PWA icons as SVG files (works for Chrome/Android install prompts)
// For production, replace with proper PNG icons from a design tool
import { writeFileSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVG(size) {
  const fontSize = Math.round(size * 0.28);
  const subSize = Math.round(size * 0.09);
  const r = Math.round(size * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0f1e3c"/>
  <text x="${size/2}" y="${size*0.48}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff" letter-spacing="-1">XOS</text>
  <text x="${size/2}" y="${size*0.48 + subSize*1.6}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="500" font-size="${subSize}" fill="#f97316">TRIVEX</text>
</svg>`;
}

sizes.forEach(size => {
  writeFileSync(`icons/icon-${size}x${size}.svg`, generateSVG(size));
  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log('All icons generated.');
