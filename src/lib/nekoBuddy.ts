/** Floating dancing neko mascot for the store `effect-neko` equip. */

const NEKO_ID = 'pensieve-neko-buddy';

const NEKO_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="32" cy="46" rx="16" ry="12" fill="#ffc8dd"/>
  <ellipse cx="32" cy="28" rx="14" ry="13" fill="#ffc8dd"/>
  <path d="M18 20 L14 6 L26 16 Z" fill="#ffc8dd"/>
  <path d="M46 20 L50 6 L38 16 Z" fill="#ffc8dd"/>
  <path d="M20 18 L16 9 L25 15 Z" fill="#ffafcc"/>
  <path d="M44 18 L48 9 L39 15 Z" fill="#ffafcc"/>
  <circle cx="26" cy="27" r="2.2" fill="#3d2c2e"/>
  <circle cx="38" cy="27" r="2.2" fill="#3d2c2e"/>
  <circle cx="26.6" cy="26.4" r="0.7" fill="#fff"/>
  <circle cx="38.6" cy="26.4" r="0.7" fill="#fff"/>
  <ellipse cx="32" cy="32" rx="2" ry="1.4" fill="#ff8fab"/>
  <path d="M32 33.5 Q28 36 24 34" stroke="#3d2c2e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M32 33.5 Q36 36 40 34" stroke="#3d2c2e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M18 31 H10 M18 34 H9 M46 31 H54 M46 34 H55" stroke="#ff8fab" stroke-width="1.1" stroke-linecap="round"/>
  <path class="neko-tail" d="M46 48 Q58 42 56 30" stroke="#ffc8dd" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse class="neko-paw-l" cx="24" cy="56" rx="4" ry="3" fill="#ffafcc"/>
  <ellipse class="neko-paw-r" cx="40" cy="56" rx="4" ry="3" fill="#ffafcc"/>
</svg>
`.trim();

export function syncNekoBuddy(active: boolean) {
  const existing = document.getElementById(NEKO_ID);
  if (!active) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const el = document.createElement('div');
  el.id = NEKO_ID;
  el.className = 'pensieve-neko-buddy';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = NEKO_SVG;
  document.body.appendChild(el);
}
