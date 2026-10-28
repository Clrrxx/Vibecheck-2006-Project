# vibecheck: Project Summary

## Overview

**vibecheck** ("Games. People. You.") is a web application built for the SCSA software engineering course. It maps a player's **Big Five (OCEAN) personality profile** onto gaming preferences, then uses that profile to recommend games, surface Steam playtime insights, and (as planned future work) match compatible players. The pitch to the client is that games feel better when they fit who you are.

## Technology Stack

The frontend is a **Vite + React** single-page application using **React Router** with a `ProtectedRoute` wrapper that supplies the authenticated Firebase user through `useOutletContext`. **Firebase Authentication** handles email/password login with selectable persistence (local versus session, driven by "Remember me"). **Firebase Realtime Database** stores per-user data under `users/<uid>/profile`, `users/<uid>/steam`, `users/<uid>/steamSnapshots` and `users/<uid>/questResults/latest`. A separate **Node/Express backend** (`server/`, port 3001) performs Steam OpenID linking and playtime sync using a Firebase Admin service account, authorised by the caller's Firebase ID token as a Bearer header. External data comes from the **RAWG.io API** (game metadata, screenshots, artwork) and the **Steam Web API** (library and playtime).


## Setup Reference

Create `.env.local` with the Firebase variables, `VITE_FIREBASE_DATABASE_URL` and `VITE_RAWG_KEY`. In `server/`, add `serviceAccountKey.json` and a `.env` containing `STEAM_API_KEY` and `FIREBASE_DATABASE_URL`. Publish `database.rules.json`, then run `npm start` in `server/` (port 3001) and `npm run dev` in the project root (port 5173). The test Steam account must have "Game details" set to Public. See `STEAM_SETUP.md` for the full procedure.
