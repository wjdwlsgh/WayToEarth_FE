# Repository Guidelines

## Project Structure & Module Organization
- `Pages/`: app screens (e.g., `Main.tsx`, `ProfileScreen.tsx`).
- `components/`: reusable UI (`Layout/`, `Running/`).
- `hooks/`: stateful logic (`useLiveRunTracker.ts`, `useKakaoLogin.ts`).
- `utils/`: helpers and API clients (`utils/api/*.ts`, `client.ts`).
- `assets/`: images, fonts, icons.
- `types/`: shared TypeScript types.
- Config roots: `app.config.js`, `tailwind.config.js`, `metro.config.js`, `tsconfig.json`, `global.css`.
- Tests: none yet. When added, place in `__tests__/` or alongside files as `*.test.ts(x)`.

## Build, Test, and Development Commands
- Install deps: `npm install`.
- Start (Expo): `npm run start` (or `npm run ios | android | web`).
- Clean cache + start: `npx expo start -c`.
- Type check: `npx tsc --noEmit`.
- Env: create `.env` for local secrets; restart after changes.

## Coding Style & Naming Conventions
- Language: TypeScript with strict, typed props/state; 2‑space indentation.
- Naming: Pages/Components `PascalCase` (e.g., `FeedScreen.tsx`); hooks `useX.ts` (e.g., `useTimer.ts`); utils/api `camelCase.ts`; types `PascalCase`.
- Styling: prefer NativeWind/Tailwind utility classes via `className`; use `StyleSheet` for scoped styles when needed.
- Imports: order external → internal; avoid deep relative paths when index files exist.

## Testing Guidelines
- Stack: Jest + React Native Testing Library.
- Location: `__tests__/` or co-located `*.test.ts(x)`.
- Scope: focus on screens, hooks, and API modules; target meaningful coverage over fragile mocks.
- Run: add a test config and script (e.g., `"test": "jest"`) before running `npm test`.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits with scopes (e.g., `feat(api): add running client`, `chore(types): refine Emblem types`, `refactor(pages): tidy imports`).
- PRs: include a clear description, verification steps, and screenshots/GIFs for UI; note any config/env changes. Keep diffs focused and linked to issues when relevant.

## Security & Configuration Tips
- Secrets: never commit `.env` or credentials.
- API base URL: set in `utils/api/client.ts` (`baseURL`); adjust per environment.
- Deep linking: scheme `waytoearth://`; verify flows on iOS/Android.
- Permissions: location and related capabilities must be configured in `app.config.js` and native platform settings.

