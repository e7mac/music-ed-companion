# Landing Page — Design

**Date:** 2026-05-29
**Project:** music-ed-companion (Vite + React 19 + TS), live at https://textbook.realmusictheory.com/

## Goal

The app currently boots straight into the player (defaulting to *Creative Orchestration*).
Add a **landing page as the new home**: a bare visit to `/` shows an intro page with a
hero, a browsable grid of all books, and a short "how it works" strip. Picking a book
enters the player. The player stays directly deep-linkable via `?book=<title>`.

## Entry flow

| URL | View |
|---|---|
| `/` (no `?book=`) | **Landing** |
| `/?book=Creative%20Orchestration` | **Player** for that book |

- Clicking a book on the landing page sets `?book=<title>` (pushState) and shows the player.
- A "home"/brand click in the player clears the param (pushState) and returns to the landing page.
- `popstate` is handled so browser back/forward moves between landing and player.

## Architecture

`App.tsx` becomes a thin **route shell** that owns the URL/view state. The current player
body is extracted into a `Player` component so its hooks (soundfont engine, player, keyboard
nav) only mount when a book is open — the landing page must **not** download the soundfont.

```
App.tsx          — reads ?book= → renders <Landing> or <Player>; owns nav + SEO
  Landing.tsx    — hero + book grid + "how it works" + footer (new)
  Player.tsx     — the existing player UI/state, moved out of App (with a "home" affordance)
data/bookMeta.ts — title → category map for the grid (new)
Landing.css      — landing-only styles, reuses the existing CSS variables (new)
```

- **SEO:** `useSeo` moves up to `App` and is called unconditionally with the current book
  title (empty string when home). It already keys off the presence of `?book=` in the URL,
  so it sets the generic home title/canonical on the landing page and the per-book title in
  the player — and resets correctly when navigating player → home. The build-time
  `seoPrerender` plugin (book links injected into `#root`) is unchanged; it remains the
  no-JS/crawler fallback that React replaces on mount.

## Landing content

**Hero** — serif headline + subhead + primary CTA ("Browse the library", scrolls to grid).
Reuses the warm-paper / clay theme already in `App.css` (`--bg`, `--clay`, fonts).

**Book grid** — a card per entry in `BOOK_TITLES` (all 15). Each card shows the title (serif)
and a **category tag** derived from `bookMeta.ts`. No authors or example counts (not reliably
known without fetching). Categories assigned by title:

- Counterpoint — Applied Counterpoint, Elementary Counterpoint
- Harmony — Contemporary Harmony, Structural Functions of Harmony, Twentieth Century Harmony,
  Modulation, Japanese Music Harmony Vol. 1
- Orchestration — Creative Orchestration
- Composition & Form — Musical Composition Craft and Art, The Shaping Forces in Music,
  Fundamentals of Musical Composition
- Analysis — Brahms and the Principle of Developing Variation
- Jazz & Latin Piano — Latin Jazz Piano, Play Latin Piano Like a Pro, Jazz Piano: The Left Hand

A whole card is a button → `onSelectBook(title)`.

**How it works** — three short steps: pick a book → choose an example → press play
(orchestral MIDI alongside the score).

**Footer** — reuse the existing "More tools" footer (Real Ear Trainer · Real Sight Reader).

## Testing

- `Landing.test.tsx` — renders the hero heading; renders all 15 book titles; clicking a book
  card invokes `onSelectBook` with that title.
- `App.test.tsx` — no `?book=` renders the landing (hero present, player absent); with
  `?book=` renders the player.
- Existing player/data tests are unaffected (player logic only moves files, not behavior).

## Out of scope (YAGNI)

- Per-book cover art / thumbnails (no asset source today).
- A client-side router library — plain `?book=` + `pushState`/`popstate` is enough.
- Search/filter over the grid (15 items fit on one screen).
