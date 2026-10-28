# vibecheck: Project Summary

## Overview

**vibecheck** ("Games. People. You.") is a web application built for the SCSA software engineering course. It maps a player's **Big Five (OCEAN) personality profile** onto gaming preferences, then uses that profile to recommend games, surface Steam playtime insights, and (as planned future work) match compatible players. The pitch to the client is that games feel better when they fit who you are.

## Technology Stack

The frontend is a **Vite + React** single-page application using **React Router** with a `ProtectedRoute` wrapper that supplies the authenticated Firebase user through `useOutletContext`. **Firebase Authentication** handles email/password login with selectable persistence (local versus session, driven by "Remember me"). **Firebase Realtime Database** stores per-user data under `users/<uid>/profile`, `users/<uid>/steam`, `users/<uid>/steamSnapshots` and `users/<uid>/questResults/latest`. A separate **Node/Express backend** (`server/`, port 3001) performs Steam OpenID linking and playtime sync using a Firebase Admin service account, authorised by the caller's Firebase ID token as a Bearer header. External data comes from the **RAWG.io API** (game metadata, screenshots, artwork) and the **Steam Web API** (library and playtime).

## Features

### Authentication

`Login` and `Signup` share a split-panel layout (`Brand`, `Field`, `AuthVisual`). Signup writes first and last name to the Realtime Database without ever blocking account creation on that write. `getLoginDestination` whitelists post-login redirect targets so tampered history state cannot cause an open redirect.

### Personality Questionnaire ("The Lantern Guild")

A 15-encounter narrative quest in five chapters scores the five traits using three story-based questions per trait. Each choice carries a score of 1, 3 or 5, some reverse-keyed. A trait's **average** is converted to a 0 to 100 **position**. The result title is the strongest trait's archetype (Curious Pathfinder, Thoughtful Navigator, Campfire Connector, Kindred Companion, Reflective Voyager) or **Versatile Adventurer** when the spread between highest and lowest averages is under 1. Progress persists in `localStorage` per user, and completed results sync to the Realtime Database, with the more recent `savedAt` winning on conflict. The results screen presents a radar chart, an explorable per-trait reading and a shareable gamer card.

### Home Dashboard

The dashboard shows the user's archetype, a Big Five radar, selectable gamer-trait tags and an animated mascot that opens the gamer card dialog. Users without results see a call to action to start the quest. A `WeeklyGames` panel and a sidebar link the other pages.

### Game Recommendations (`/game-recommendations`, use case 1.1)

This page implements the **GameRecommendationController** logic from the use case model. Each of ten genres carries an **affinity vector** over the five traits. `genreFit` computes a normalised dot product of that vector with the user's trait scores centred on the 50th percentile. The top genre is inferred when the user has not chosen one. RAWG results are age-filtered by ESRB rating, then ranked by `relevanceScore = 0.8 × genreFit + 0.2 × (rating / 5)`. If no games match, the search broadens to adjacent genres and then to overall popularity. A separate "trending" rail shows popular releases from the last year. Results are cached in `localStorage` for five minutes, and stale cache is shown with a warning when RAWG is unreachable (use case exception 1.1 EX.1). Users can save favourites, view a details dialog with a screenshot gallery, and every interaction is logged for a planned **preference weighting** feature.

### Update Profile

Users edit their name, view their email, and connect, refresh or disconnect **Steam**. Connecting redirects to Steam's own login page through the backend, and the page reports the outcome when Steam returns the user. A Steam summary shows games owned, total hours, hours in the last two weeks and the top five games, plus guidance when the Steam game list is private.

### Gaming Insights

This page turns synced Steam data into reflective statistics: last-14-day and lifetime playtime, daily average, library size, a ranked "most-played worlds" chart, a spotlight on the favourite game and a searchable library table. The page deliberately frames numbers as perspective ("you decide what a good balance looks like") rather than judgment. Game artwork is enriched lazily through RAWG, so Steam activity is never delayed by artwork loading.

## Notable Design Decisions

**Separation of pure logic from UI.** Scoring (`quest.js`, `questResult.js`), caching (`gameReccCache.js`), redirects (`authRedirect.js`), insight aggregation (`steamInsights.js`) and artwork matching (`rawgArtwork.js`) are framework-free modules, which makes them straightforwardly unit-testable.

**Local-first with cloud sync.** Quest results are cached in `localStorage` and recomputed from raw answers rather than trusting cached display values, so tampered or outdated caches cannot corrupt the profile.

**Graceful degradation.** Blocked storage, a missing database URL, a failed RAWG request, a private Steam library and an unreachable backend all have explicit user-facing fallback states.

**Defensive matching.** `matchRawgGame` accepts only a single exact normalised name match and restricts image hosts to `media.rawg.io`, so a fuzzy hit cannot attach the wrong sequel's artwork.

**Request management.** The RAWG artwork client deduplicates in-flight requests, limits concurrency to three, caches hits for a week and misses for a day.

## Testing

Unit tests use the built-in **`node:test`** runner with `node:assert/strict`. They cover `authRedirect` (valid destinations, open-redirect and login-loop rejection), `gameReccCache` (key stability, five-minute freshness boundary, corrupt storage), `questResult` (payload validation, tie-breaking, invalid answers), `localQuestResult` (owner isolation, score rebuilding), `rawgArtwork` (matching, caching, failure modes) and `steamInsights` (rankings, invalid playtime, object-shaped Firebase collections). These map naturally onto the Lab 4 requirements for equivalence-class and boundary-value testing (for example, the cache freshness boundary at exactly 300,000 ms, and answers of length 14, 15 and 16).

## Known Gaps and Follow-ups

**Route mismatch.** `authRedirect.js` whitelists `/gamematching`, but the recommendations page is routed at `/game-recommendations`, so a user redirected to login from that page lands on the dashboard instead.

**Hard-coded age.** `GameRecc` sets age to 18 temporarily, so the ESRB filter currently has no effect on younger users. Age is not collected anywhere in the flow.

**Unfinished navigation.** "Gamer Matches" and "Settings" in the sidebar are placeholder anchors, and the Google and Discord login buttons are non-functional (hidden on the signup page).

**Two persistence layers.** `profileStore.js` and `useProfile.js` use Firestore, while the rest of the app uses the Realtime Database. If the Firestore path is unused it should be removed or consolidated.

**Debug output.** A `console.log` of the report remains in `GameRecc`.

**Preference weighting.** The logged interactions are not yet used to bias recommendations. The in-code TODO suggests per-genre counters (+1 for save, +0.25 for details) added to `relevanceScore`.

**Validity caveat.** The questionnaire is an exploratory instrument (three custom items per trait), not a validated personality test, and the UI states this explicitly.

## Setup Reference

Create `.env.local` with the Firebase variables, `VITE_FIREBASE_DATABASE_URL` and `VITE_RAWG_KEY`. In `server/`, add `serviceAccountKey.json` and a `.env` containing `STEAM_API_KEY` and `FIREBASE_DATABASE_URL`. Publish `database.rules.json`, then run `npm start` in `server/` (port 3001) and `npm run dev` in the project root (port 5173). The test Steam account must have "Game details" set to Public. See `STEAM_SETUP.md` for the full procedure.
