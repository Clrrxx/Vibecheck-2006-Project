# Steam linking + Update Profile: setup

## One-time setup

1. **Realtime Database URL** – add this line to `vibecheck/.env.local` (copy the URL from Firebase Console → Build → Realtime Database), then restart Vite:
   `VITE_FIREBASE_DATABASE_URL=https://....firebasedatabase.app`
2. **Publish the rules** – Firebase Console → Realtime Database → Rules → paste the contents of `database.rules.json` → Publish.
3. **Service account key** (lets the server write Steam data) – Firebase Console → Project settings → Service accounts → *Generate new private key*. Save the file as `vibecheck/server/serviceAccountKey.json`. Never commit or share it.
4. **Steam API key** – sign in at https://steamcommunity.com/dev/apikey, domain name `localhost`.
   Steam only issues keys to accounts that have spent at least US$5 (not a "limited" account).
5. Create `vibecheck/server/.env` from `server/.env.example` and fill in `STEAM_API_KEY` and `FIREBASE_DATABASE_URL`.
6. On the Steam account you test with: Profile → Edit Profile → Privacy Settings → set **Game details** to **Public**.

## Running (two terminals)

```bash
# Terminal 1 - backend
cd vibecheck/server
npm install
npm start            # "VibeCheck server listening on http://localhost:3001"

# Terminal 2 - frontend
cd vibecheck
npm install
npm run dev          # open http://localhost:5173
```

Log in, open **/update-profile**, press **Connect Steam**.

## Data saved in Realtime Database

```
users/<uid>/profile         { firstName, lastName }
users/<uid>/steam           { steamId, personaName, avatar, profileUrl, gamesVisible,
                              gameCount, totalMinutes, twoWeekMinutes, lastSynced,
                              games: [ { appId, name, minutesTotal, minutesLast2Weeks }, ... ] }   (sorted, most played first)
users/<uid>/steamSnapshots  one entry per sync: { at, totalMinutes, twoWeekMinutes }
```

## Using the data in another page

```jsx
import { useOutletContext } from "react-router-dom";
import useAccountProfile from "../data/useAccountProfile";

const user = useOutletContext();                 // page must be inside <ProtectedRoute>
const { steam } = useAccountProfile(user);       // null until Steam is linked

const owned = new Set((steam?.games ?? []).map(g => g.appId));   // skip these in recommendations
const favourites = (steam?.games ?? []).slice(0, 10);            // most-played games
const hoursThisFortnight = (steam?.twoWeekMinutes ?? 0) / 60;    // for wellbeing monitoring
```

Steam only reports lifetime and last-2-weeks playtime, so for "hours this week" compare two
`steamSnapshots` entries (the difference in `totalMinutes`). Snapshots are created each time the user
presses Refresh. For automatic daily snapshots the server would need a scheduled job.
