import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const directory = fileURLToPath(new URL('../public/brand/', import.meta.url));
mkdirSync(directory, { recursive: true });
const colors = ['#8b529e', '#71958a', '#be89a0', '#d99758', '#8a93b8', '#7862a7', '#73a7ac'];
const names = [
  'Pure Balance',
  'Daily Essentials',
  'Derma Calm',
  'Bright C',
  'Gentle Care',
  'Vital Complex',
  'Hydra Plus',
];
names.forEach((name, i) => {
  const color = colors[i];
  const bottle = i === 2 || i === 4 || i === 6;
  const shape = bottle
    ? `<rect x="134" y="66" width="92" height="52" rx="8" fill="url(#cap)"/><rect x="118" y="111" width="124" height="228" rx="24" fill="url(#paper)"/><rect x="119" y="165" width="122" height="130" fill="${color}" opacity=".13"/><path d="M130 169 Q180 204 230 169" fill="none" stroke="${color}" opacity=".35"/><rect x="138" y="72" width="84" height="3" rx="2" fill="#ffffff80"/>`
    : `<path d="M103 75 L229 56 L255 76 L255 329 L229 349 L103 329Z" fill="${color}" opacity=".25"/><path d="M103 75 L229 76 L229 349 L103 329Z" fill="url(#paper)"/><path d="M229 76 L255 76 L255 329 L229 349Z" fill="${color}" opacity=".55"/><path d="M103 75 L229 56 L255 76 L229 91Z" fill="#faf7fc"/><path d="M103 239 Q167 201 229 241 L229 311 L103 291Z" fill="${color}" opacity=".22"/><path d="M103 256 Q167 218 229 258" fill="none" stroke="${color}" stroke-width="2" opacity=".4"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="420" viewBox="0 0 360 420"><defs><linearGradient id="paper"><stop stop-color="#fff"/><stop offset=".5" stop-color="#faf9fc"/><stop offset="1" stop-color="#e2dce9"/></linearGradient><linearGradient id="cap"><stop stop-color="${color}"/><stop offset=".45" stop-color="#b99ec9"/><stop offset="1" stop-color="${color}"/></linearGradient><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs><ellipse cx="180" cy="354" rx="79" ry="12" fill="#60416f" opacity=".13" filter="url(#shadow)"/>${shape}<g text-anchor="middle" font-family="Arial,sans-serif"><text x="173" y="145" font-size="20" font-weight="bold" fill="${color}">Bio<tspan font-size="11"> NL</tspan></text><text x="173" y="160" font-size="5.5" letter-spacing="1.7" fill="#8c7a96">PHARMACEUTICALS</text><text x="173" y="202" font-size="${name.length > 14 ? 12 : 15}" font-weight="bold" fill="#493552">${name}</text><text x="173" y="219" font-size="6" letter-spacing="2" fill="#8b7696">THE CARE COLLECTION</text><circle cx="173" cy="263" r="17" fill="none" stroke="${color}" opacity=".6"/><path d="M166 263 H180 M173 256 V270" stroke="${color}" stroke-width="1.5"/><text x="173" y="316" font-size="5.5" letter-spacing="1" fill="#8d7b97">ILLUSTRATIVE SAMPLE · 0${i + 1}</text></g></svg>`;
  writeFileSync(`${directory}/product-${i + 1}.svg`, svg);
});
