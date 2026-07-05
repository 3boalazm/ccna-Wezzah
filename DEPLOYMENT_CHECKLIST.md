# CCNA Platform — Production Deployment Checklist

**Status: ✅ PRODUCTION READY** (Topic Viewer slice)
**Hardened:** 2026-07-05 · **Target:** Vercel (static Vite SPA)

---

## 1. Build & CI gates — all green

Run from the project root (`ccna-platform-scaffold/ccna-platform`):

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 problems |
| Type-check | `npm run type-check` (`tsc --noEmit`, strict) | ✅ 0 errors |
| Production build | `npm run build` (`tsc && vite build`) | ✅ 37 modules, `dist/` emitted |
| Clean install | `rm -rf node_modules dist && npm install` | ✅ exit 0 |

**Build output:** `dist/index.html` (0.34 kB) + `dist/assets/index-*.js` (188 kB / **61 kB gzip**).

---

## 2. Production-hardening review (20-point pass)

| # | Item | Outcome |
|---|---|---|
| 1 | Review entire codebase | ✅ All 30 source files reviewed |
| 2 | Remove duplicated code | ✅ Removed `collectField` generic → inline `flatMap` (2 call sites) |
| 3 | Remove dead code | ✅ Removed unused `getAllCachedTopics()` export in `loader.ts` |
| 4 | Remove unused imports | ✅ Removed unused `CommandExample` import; ESLint now enforces |
| 5 | Remove unused dependencies | ✅ Runtime deps = `react`, `react-dom` only (both used); no unused deps |
| 6 | Fix every TypeScript issue | ✅ `tsc` strict: 0 errors; eliminated the sole `as any` |
| 7 | Fix every ESLint warning | ✅ Added ESLint 9 flat config; 0 problems |
| 8 | Fix every React warning | ✅ react-hooks clean; added `type="button"`, `aria-pressed` |
| 9 | Fix hydration issues | ✅ N/A — client-only SPA (`createRoot`, no SSR); no hydration path |
| 10 | Optimize performance | ✅ Module-level style object (no per-render alloc); KB loaded once pre-render; 61 kB gzip — no splitting needed |
| 11 | Improve folder organization | ✅ Matches Phase D architecture; added `.gitignore`, `eslint.config.js` at root |
| 12 | Ensure responsive behavior | ✅ viewport meta; command tables wrapped in `overflow-x:auto`; `pre` scrolls; header flex-wraps; max-width container |
| 13 | Verify accessibility | ✅ Fixed contrast (`#888`/`#999` → `#595959`/`#616161`, WCAG AA); `aria-pressed` tabs; `role="group"` + `aria-label`; h1/h2 hierarchy; `lang="en"` |
| 14 | Review animations | ✅ N/A — none present |
| 15 | Verify loading states | ✅ TopicPage "Loading…"; `main.tsx` init guard |
| 16 | Verify empty states | ✅ "— none —" for empty fields; content-gaps banner |
| 17 | Verify error states | ✅ TopicPage error block; `main.tsx` init-failure fallback |
| 18 | Review routing | ✅ Single page, state-based topic switch, no router → no routing bugs |
| 19 | Review state management | ✅ Matches Phase D — hooks + in-memory KB cache, no global store |
| 20 | Review architecture consistency | ✅ Layering intact: only Knowledge Engine reads `/knowledge`; engines go through `index.ts`; storage seam isolated |

---

## 3. Vercel configuration

No `vercel.json` required — Vercel auto-detects Vite. Confirm these project settings:

| Setting | Value |
|---|---|
| Framework Preset | **Vite** |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 20.x (or 18.x) |
| Environment Variables | **None** — app is client-only; persistence uses browser `localStorage` |

> ⚠️ If client-side routing (e.g. `react-router`) is added later, add an SPA rewrite
> so deep links resolve: `{"rewrites":[{"source":"/(.*)","destination":"/"}]}` in `vercel.json`.
> Not needed today (single page).

---

## 4. Pre-deploy checklist

- [x] `npm run lint` → 0 problems
- [x] `npm run type-check` → 0 errors
- [x] `npm run build` → succeeds, `dist/` produced
- [x] Production artifact verified rendering via `vite preview` (port 4173) — no console errors
- [x] `.gitignore` present (excludes `node_modules/`, `dist/`, envs, caches)
- [x] Runtime dependencies minimal (`react`, `react-dom`)
- [ ] Commit the lockfile (`package-lock.json`) — Vercel uses it for reproducible installs
- [ ] Confirm repo root for Vercel points at `ccna-platform-scaffold/ccna-platform`

---

## 5. Known issues & intentionally deferred (surfaced, not hidden)

These are **not blockers** for the Topic Viewer, but are documented for transparency:

1. **Four engine stubs throw `Not implemented — Phase E`** — `adaptive-engine`, `exam-engine`,
   `troubleshooting-engine`, and `review-engine.getDueReviews`. These are **locked Phase-E
   scaffolding** (per project contract) and are **tree-shaken out of the shipped bundle**
   (not imported by the app). They were **kept, not deleted**, to respect the locked contracts.
   An ESLint override documents them; remove it as each is implemented.
2. **`searchByTag` / `searchByKeyword`** (knowledge-engine) are deferred stubs — params
   underscore-prefixed to mark them intentionally unused. Not reached by the shipped UI.
3. **`useReviewQueue`** depends on the deferred `review-engine.getDueReviews` and will throw
   if a component mounts it. No shipped page uses it yet.
4. **`npm audit`: 2 findings (esbuild ≤0.24.2 / vite ≤6.4.2)** — a **dev-server-only** advisory
   (GHSA-67mh-4wv8-2f99). It does **not** affect the static production artifact Vercel serves.
   The only remediation is a breaking Vite 5→8 major upgrade; deferred to a separate, tested
   migration rather than forced during this deploy pass.

---

## 6. Post-deploy verification

- [ ] Open the deployment URL; confirm the NAT topic renders (breadcrumb, badges, sections)
- [ ] Switch topics (NAT / OSPF / ACL); confirm OSPF shows the content-gaps banner
- [ ] Check the browser console — expect **no errors**
- [ ] Resize to mobile width (~375px); confirm command tables scroll internally, no page overflow
- [ ] Verify persistence seam: `localStorage` is used for attempt data (no backend/env needed)

---

## Rollback

Static deploy — instant rollback via Vercel's "Promote previous deployment". No DB migrations, no stateful backend.
