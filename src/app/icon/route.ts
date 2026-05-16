const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Innovation Portal">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#g)"/>
  <path d="M20 34c0-8 5-14 12-14s12 6 12 14-5 14-12 14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
</svg>`;

export function GET() {
  return new Response(SVG, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
