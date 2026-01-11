# PageSpeed Tradeoffs

Ledger is an internal admin panel. Performance prioritizes clarity over marketing-grade metrics.

Current posture
- Server-rendered pages with lightweight Tailwind styles.
- Minimal client-side interactivity, no heavy animations.
- No image optimization or CDN tuning in v1.

If PageSpeed becomes a priority
- Add image optimization rules.
- Reduce client bundle size (audit client components).
- Cache read-only API responses where safe.
