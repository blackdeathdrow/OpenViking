# Case Study: Mobile And PWA Blog Polish

This case study records the responsive and PWA polish pass on the OpenViking blog shell. Use it before shipping blog-wide UI changes, especially when the request mentions phone view, preview screenshots, icons, or installability.

## Scope

- Human page: blog index `/`.
- Representative post page: `/post/openviking-context-database-architecture/`.
- PWA surface: `index.html`, `public/manifest.webmanifest`, and generated icon assets under `public/assets/icons/`.
- Final goal: make the mobile layout content-first while keeping the desktop editorial style intact.

## Method That Worked

1. Start from screenshots, not intuition. Capture the index and a long post with a narrow mobile viewport before editing, then compare again after the build and preview restart.
2. Keep the first mobile viewport focused on content. Large editorial type can work on desktop, but on phones the title, lede, topic selector, and first card compete for the same space.
3. Collapse dense controls by default. The topic selector works better as one horizontal row with a small expand button; the expanded state should still show all topics without hiding the sort control.
4. Prefer short mobile labels over clipped text. If a desktop label like `Newest first` does not fit, provide a real short label such as `New`, not a max-width crop.
5. Use post metadata for shell-facing naming. If a label should read `Arch` in cards, filters, or breadcrumbs, change `meta.category` and `meta.tags`; leave stable slugs and article prose alone unless the user asks for a content rename.
6. Add PWA icon support without introducing stale-cache risk. A manifest plus 16/32/180/192/512 and maskable icons improves install and home-screen behavior; skip a service worker unless the product explicitly wants offline caching and has a cache invalidation plan.

## PWA Icon Notes

- Source from the existing transparent `public/assets/logo.png` so favicon, app icon, and header mark stay visually aligned.
- Generate normal transparent icons for browser/favicon surfaces.
- Generate maskable icons on the light paper background with the logo centered inside the safe area. The icon should not fill the whole canvas; platform masks can crop aggressively.
- Add both light and dark `theme-color` meta tags so browser UI matches the current theme preference before React loads.
- Include iOS meta tags and `apple-touch-icon`; Safari does not rely on the web manifest the same way Chromium does.

## Responsive Checks

Use at least these screenshots:

- Index, mobile viewport around `390x844`.
- Index, topic selector expanded.
- A long post with a large title and byline.
- Optional desktop smoke check to confirm the editorial composition was not flattened.

Review the screenshot for:

- Header controls still fit in one row.
- Hero title does not consume the whole first screen.
- Topic selector defaults to one row and can expand to all tags.
- Sort control is readable and not clipped.
- First card title, metadata, and excerpt fit without awkward truncation.
- Post title is readable without becoming a wall of display type.
- Byline, external-link arrow, and metadata stay aligned on phones.

## Implementation Notes

- Keep mobile CSS in the existing `@media (max-width: 720px)` blocks in `src/themes.css` so blog-wide behavior remains easy to audit.
- Use React state for shell-level expand/collapse behavior in `IndexView`; avoid pure CSS hacks when the expanded state affects ARIA or needs to close after selection.
- When a selected tag is outside the compact mobile list, keep the selector expanded after selection so the active state remains visible.
- Run `npm run build` before preview screenshots. The blog build also renders static routes, so this catches shell and SSG regressions together.
- Restart the 0.0.0.0 preview after build when sharing with a phone on the LAN.

## Verification Used

- `npm run build`.
- `curl -I http://127.0.0.1:5177/`.
- `curl http://127.0.0.1:5177/manifest.webmanifest`.
- Chrome DevTools Protocol screenshots at `390x844` for index collapsed, index expanded, and the architecture post.
- Visual inspection of generated normal and maskable icons.
