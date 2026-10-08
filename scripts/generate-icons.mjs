import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'public/brand/cpl-logo.png';
const originalLogo = readFileSync(source);
await mkdir('public/icons', { recursive: true });
for (const size of [32, 48, 180, 192, 512]) {
  await sharp(originalLogo).resize(size, size, { fit: 'fill' }).png().toFile(`public/icons/icon-${size}.png`);
}

// This small web asset derives from the approved artwork without altering its design.
await sharp(originalLogo).resize(160, 160).webp({ lossless: true, effort: 6 }).toFile('public/brand/cpl-logo-160.webp');
const logo = await sharp(originalLogo).resize(80, 80).png().toBuffer();

// Original CPL artwork is preserved; the compass and workflow composition is locally authored.
const artwork = Buffer.from(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse"><stop stop-color="#f4faf5"/><stop offset="1" stop-color="#d7eee4"/></linearGradient>
    <linearGradient id="rim" x1="730" y1="175" x2="1100" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#0c5972"/><stop offset=".55" stop-color="#052b4e"/><stop offset="1" stop-color="#103f57"/></linearGradient>
    <linearGradient id="needle" x1="910" y1="180" x2="967" y2="430" gradientUnits="userSpaceOnUse"><stop stop-color="#c7f5d9"/><stop offset=".48" stop-color="#00ae82"/><stop offset="1" stop-color="#076b8f"/></linearGradient>
    <linearGradient id="hub" x2="1" y2="1"><stop stop-color="#1d7482"/><stop offset="1" stop-color="#052b4e"/></linearGradient>
    <filter id="shadow" x="-35%" y="-35%" width="170%" height="185%"><feDropShadow dx="0" dy="16" stdDeviation="15" flood-color="#052b4e" flood-opacity=".18"/></filter>
    <filter id="small-shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#052b4e" flood-opacity=".15"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#background)"/>
  <path d="M745 0H1200V630H1006C1115 484 1078 153 745 0Z" fill="#c6e5da" opacity=".52"/>
  <circle cx="932" cy="330" r="260" fill="none" stroke="#7cb2ab" stroke-width="1" opacity=".32"/>
  <circle cx="932" cy="330" r="224" fill="none" stroke="#7cb2ab" stroke-width="1" opacity=".25"/>
  <path d="M64 151H1136" stroke="#aacdc2" stroke-width="1"/>
  <rect x="61" y="40" width="86" height="86" rx="14" fill="#fff"/>
  <text x="169" y="82" font-family="Arial,sans-serif" font-size="27" font-weight="700" fill="#052b4e">Cyber Pirate Labs</text>
  <text x="170" y="112" font-family="Arial,sans-serif" font-size="13" font-weight="600" letter-spacing="2.5" fill="#076b8f">SOFTWARE SOLUTIONS FOR BUSINESS</text>

  <text x="62" y="246" font-family="Arial,sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="#052b4e">SOFTWARE</text>
  <text x="62" y="323" font-family="Arial,sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="#076b8f">AUTOMATION.</text>
  <text x="66" y="395" font-family="Arial,sans-serif" font-size="31" font-weight="600" fill="#052b4e">Business problems.</text>
  <text x="66" y="435" font-family="Arial,sans-serif" font-size="31" font-weight="600" fill="#052b4e">Software solutions.</text>
  <text x="67" y="488" font-family="Arial,sans-serif" font-size="20" fill="#375f6e">Platform and tech stack agnostic.</text>
  <path d="M66 531H606" stroke="#aacdc2" stroke-width="1"/>
  <text x="67" y="569" font-family="Arial,sans-serif" font-size="20" fill="#052b4e">cyberpiratelabs.com</text>

  <g filter="url(#shadow)">
    <ellipse cx="932" cy="349" rx="177" ry="146" fill="#052b4e" opacity=".55"/>
    <ellipse cx="932" cy="333" rx="187" ry="161" fill="url(#rim)"/>
    <ellipse cx="932" cy="323" rx="176" ry="149" fill="#ecf7ef" stroke="#0a596c" stroke-width="2"/>
    <ellipse cx="932" cy="323" rx="153" ry="128" fill="#d7eee4" stroke="#9ac9bf" stroke-width="1"/>
    <ellipse cx="932" cy="323" rx="129" ry="106" fill="none" stroke="#8bbfb9" stroke-width="1" stroke-dasharray="3 8"/>
    <path d="M932 177V196M1107 323H1087M932 470V450M757 323H778M808 220L824 233M1056 220L1040 233M1056 425L1040 412M808 425L824 412" stroke="#076b8f" stroke-width="3"/>
    <path d="M932 191L963 297L1078 327L963 358L932 471L901 358L786 327L901 297Z" fill="#052b4e" opacity=".28" transform="translate(0 9)"/>
    <path d="M932 182L964 294L1080 323L964 354L932 465L901 354L784 323L901 294Z" fill="#076b8f"/>
    <path d="M932 182L932 323L901 294Z" fill="#b7efd4"/>
    <path d="M932 182L964 294L932 323Z" fill="url(#needle)"/>
    <path d="M1080 323L932 323L964 294Z" fill="#00ae82"/>
    <path d="M1080 323L964 354L932 323Z" fill="#087388"/>
    <path d="M932 465L932 323L964 354Z" fill="#0a425b"/>
    <path d="M932 465L901 354L932 323Z" fill="#076b8f"/>
    <path d="M784 323L932 323L901 354Z" fill="#00a77d"/>
    <path d="M784 323L901 294L932 323Z" fill="#77d6b4"/>
    <circle cx="932" cy="329" r="33" fill="#052b4e" opacity=".4"/>
    <circle cx="932" cy="323" r="33" fill="url(#hub)" stroke="#c7f5d9" stroke-width="3"/>
    <circle cx="932" cy="323" r="10" fill="#b7efd4"/>
  </g>
  <g font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#376572" text-anchor="middle">
    <text x="932" y="158">N</text><text x="1131" y="328">E</text><text x="932" y="505">S</text><text x="731" y="328">W</text>
  </g>
  <path d="M748 218H704V438H785M1098 225H1140V439H1084" fill="none" stroke="#00a77d" stroke-width="2" stroke-dasharray="6 7" opacity=".65"/>
  <g filter="url(#small-shadow)">
    <rect x="728" y="199" width="42" height="38" rx="9" fill="#052b4e"/><path d="M739 210H759M739 219H751M739 226H756" stroke="#b7efd4" stroke-width="2" stroke-linecap="round"/>
    <rect x="1062" y="208" width="42" height="38" rx="9" fill="#076b8f"/><path d="M1074 219H1092M1074 226H1092M1074 233H1084" stroke="#b7efd4" stroke-width="2" stroke-linecap="round"/>
    <rect x="1062" y="421" width="42" height="38" rx="9" fill="#00a77d"/><path d="M1074 440L1081 447L1094 433" fill="none" stroke="#ecf7ef" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="769" y="421" width="42" height="38" rx="9" fill="#ecf7ef" stroke="#91bdb3"/><path d="M781 434H799M790 434V447M783 447H797" stroke="#076b8f" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="698" y="552" font-family="Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#375f6e">SYSTEMS</text>
  <path d="M779 548H801" stroke="#00a77d" stroke-width="2"/>
  <text x="812" y="552" font-family="Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#375f6e">WORKFLOWS</text>
  <path d="M925 548H947" stroke="#00a77d" stroke-width="2"/>
  <text x="959" y="552" font-family="Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#375f6e">OUTCOMES</text>
</svg>`);
await sharp(artwork).composite([{ input: logo, left: 64, top: 43 }]).png().toFile('public/og.png');
if (!readFileSync(source).equals(originalLogo)) throw new Error('Approved CPL logo source changed.');
