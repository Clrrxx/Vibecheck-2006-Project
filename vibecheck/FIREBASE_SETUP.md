# Save completed quests to Realtime Database

Signed-in players automatically save their completed questionnaire at:

`users/<Firebase Auth UID>/questResults/latest`

The record includes the questionnaire version, adventurer name and emblem, 15 answer choices with scores, the report title, five trait results, and `savedAt` (a Firebase server timestamp). A new completion replaces the previous latest report; retries do not add duplicate records. The results page only confirms success after Firebase acknowledges the write.

## Firebase Console setup

1. In the same Firebase project used for Authentication, create or open **Build → Realtime Database**. Copy the database URL from its Data tab.
2. Add `VITE_FIREBASE_DATABASE_URL=<copied URL>` to `.env.local` alongside the existing Firebase variables. Use the exact URL from the console; regions and database names vary. Restart the Vite development server after changing the environment.
3. Under Realtime Database → Rules, publish the owner-only rules from `database.rules.json`. If the database already has rules for other features, merge the `users/$uid/questResults/latest` branch while retaining the appropriate existing restrictions. A broad parent read/write permission overrides child restrictions, so do not enable public access at the root or `users` path.
4. Create an account through the app, finish the quest, and wait for **Results saved to your profile.** Verify the record under your UID in the console.

The dashboard (`/`), questionnaire (`/questionnaire`), and game-matching page (`/gamematching`) require a non-anonymous Firebase login. The route guard waits for Firebase's initial authentication check before rendering protected content. Signed-out visitors go to `/login` and return to their requested page after a successful email/password login. Login and signup remain public. Enable Email/Password in Firebase Authentication → Sign-in method.

The login form's Remember me option selects Firebase local persistence; otherwise it uses session persistence. Signup retains its existing direct-questionnaire flow unless the user was redirected from another protected page.

Questionnaire progress is stored under a separate localStorage key for each Firebase UID. Earlier browser-only saves with no account owner are left in place but are not automatically imported into an account. This avoids sending another user's answers to the current account. Cloud saving does not upload unfinished progress or restore results on another device; those are separate features. A server can recompute scores from the answers if results are later used for trusted decisions, since these scores are currently calculated in the client. Route guards control the UI; the Realtime Database rules above still enforce database access independently.

## Local checks

```sh
node --test src/data/questResult.test.js
npm run build
```

Rules must be published and the database URL configured before a real cloud write can succeed. This change does not deploy Firebase resources or security rules.

Firebase references: [writing data](https://firebase.google.com/docs/database/web/read-and-write), [user access rules](https://firebase.google.com/docs/database/security/rules-conditions).

## Gamer matching

The dashboard’s **Gamer Matches** link opens `/gamer-matches` (`/gamematching` is also supported). Matching uses existing assessments at `users/<uid>/questResults/latest`. Players with a valid completed assessment appear automatically; no separate matching profile or join step is required.

Run the Express backend (`cd vibecheck/server && npm start`) with its Firebase Admin credentials and database URL configured as described in STEAM_SETUP.md. The existing Vite `/api` proxy forwards authenticated requests to `GET /api/gamer-matches`. The server reads `users` and returns only assessment gamer names, personality titles and five trait positions. It excludes the requester and incomplete assessments. It does not return answers, email, account names, Steam records or block lists. Browser access to `users` remains owner-only; do not enable a parent read permission to make matching work.

Publish the `users/$uid/blockedGamers` branch from `database.rules.json` for block/unblock. The older `gamerProfiles` directory is no longer read or written and can be removed from the database and deployed rules. The rules file no longer grants access to that directory.

Results refresh every 30 seconds, exclude your blocked gamers, and support all six personality types and minimum-similarity filters. Blocking hides a gamer from your results. Similarity uses the equally weighted average absolute distance between the five scores; it is not a validated prediction of friendship. Messaging and friend requests are not part of this feature.

To verify with real accounts: complete assessments for two different accounts and open Gamer Matches. Each account should see the other without joining a separate directory. Test filtering, blocking/unblocking and changes after retaking an assessment. An empty assessment pool shows an empty state, with no fabricated matches.

### Connection requests and notifications

Each gamer card and detail view has a **Connect** button. The authenticated backend creates one pending record per pair at `gamerConnections/<hashed pair ID>`; repeated or simultaneous requests reuse the same record. The recipient sees a notification badge and can accept or decline from the notification menu on the dashboard or Gamer Matches page. Notifications refresh every 10 seconds while either page is open and persist across reloads. These are in-app notifications; email and browser push are not configured.

Only the recipient can answer a pending request. Accepted pairs display **Connected**, pending sends display **Request sent**, and declined requests cannot be resent. The backend checks both gamers’ block lists before sending or accepting. All reads/writes go through authenticated server endpoints; clients have no direct access to `gamerConnections`. Publish its `from`/`to` indexes from `database.rules.json` for efficient lookup as the dataset grows. If these indexes have not been published, the server falls back to reading the connection records and filtering them to the authenticated participant before responding. No additional read/write permissions are needed.

To verify manually with two accounts: send a request from A, open notifications as B, accept or decline it, and check A’s button updates within 10 seconds. Refresh both accounts to confirm persistence. Automated server tests cover duplicate requests, recipient-only responses, block checks, self requests and unrelated users’ notification isolation.
