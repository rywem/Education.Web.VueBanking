# Education.Web.Vue Banking — Vue 3 + TypeScript + ASP.NET Core

A reusable starter for a Vue 3 SPA paired with an ASP.NET Core minimal API, in
one repo. Both halves run together under VS Code with a single F5.

```
Education.Web.VueBanking/
├─ Education.Web.VueBanking.sln              # solution (server only; the client isn't an MSBuild project)
├─ rename.ps1 / rename.sh       # one-shot project renamer
├─ .vscode/                     # launch both servers together
├─ server/                      # ASP.NET Core minimal API (the "Education.Web.VueBanking.Server" project)
│  ├─ Program.cs                # endpoints, CORS, OpenAPI
│  └─ Education.Web.VueBanking.Server.csproj
└─ client/                      # Vue 3 + TS + Vite
   ├─ src/
   │  ├─ api/                   # client.ts (fetch wrapper), endpoints.ts, types.ts
   │  ├─ composables/           # useAsyncData.ts
   │  └─ components/            # ForecastPanel.vue
   ├─ vite.config.ts            # dev proxy /api -> the .NET API
   └─ package.json
```

The two halves are intentionally decoupled: the client is a plain static site
that talks HTTP. There is no SignalR circuit, no render-mode matrix, no server
round-trip to update the DOM. That decoupling is the whole point — and the main
thing that will feel different coming from Blazor.

---

## 1. Prerequisites

| Tool | Version | Check | Notes |
|------|---------|-------|-------|
| .NET SDK | 10.x (or adjust the csproj) | `dotnet --list-sdks` | If you only have 9/8, change `<TargetFramework>` in `server/Education.Web.VueBanking.Server.csproj` and the `net10.0` path in `.vscode/launch.json`. |
| Node.js | 22 LTS or newer | `node -v` | Vite 8 needs a modern Node. Use [Volta](https://volta.sh) or nvm if you juggle versions. |
| dev HTTPS cert | — | `dotnet dev-certs https --trust` | Run once per machine. Trusts the local ASP.NET cert. |

> **Why Node at all?** It's only a build-time tool here — it runs Vite (the dev
> server + bundler) and `npm` (the package manager). Nothing Node-based ships to
> production; `vite build` emits plain static files. Think of Node as the
> frontend's MSBuild host, not a runtime dependency.

---

## 2. The npm packages (and what each is)

You don't install these by hand — `npm install` reads `client/package.json` and
fetches them into `client/node_modules/`. But for orientation:

**Runtime dependency** (ends up in the shipped bundle):
- `vue` — the framework.

**Dev dependencies** (build-time only):
- `vite` — dev server + bundler. ≈ `dotnet watch` + MSBuild, frontend edition.
- `@vitejs/plugin-vue` — teaches Vite to compile `.vue` single-file components.
- `typescript` — the compiler. Pinned with `~` (patch-only) on purpose; TS
  minor versions can introduce new errors, so you bump it deliberately.
- `vue-tsc` — type-checks `.vue` files (plain `tsc` can't read `<template>`).
  This is what `npm run type-check` and the build step use.
- `@vue/tsconfig` — the shared strict base tsconfig. ≈ a `Directory.Build.props`
  that turns on all the analyzers.

> **package.json vs .csproj:** same job (declare deps + scripts), different
> conventions. `dependencies` vs `devDependencies` is roughly `PackageReference`
> vs `<PackageReference PrivateAssets="all">` — prod vs build-only. `npm` ≈
> NuGet. `node_modules` ≈ a fully-restored `~/.nuget` packages folder, but
> *local to the project* and flattened — which is why it's enormous and always
> gitignored. The `package-lock.json` (created on first install) ≈
> `packages.lock.json`: the exact resolved versions. Commit it.

To install (run once after cloning/renaming):

```bash
cd client
npm install
```

---

## 3. Renaming for a new project

Copy the whole folder, then run the renamer **once, before `npm install`**, with
your new name in PascalCase:

```powershell
# Windows
./rename.ps1 OrderPortal
```
```bash
# WSL / macOS / Linux
./rename.sh OrderPortal
```

It rewrites three tokens across file contents *and* file names:

| Token | Becomes (e.g. `OrderPortal`) | Where it lives |
|-------|------------------------------|----------------|
| `Education.Web.VueBanking` | `OrderPortal` | namespace, `.csproj`, `.sln`, assembly/dll name, launch config |
| `education.web.vue-banking` | `order-portal` | npm package name |
| `Education.Web.Vue Banking` | `Order Portal` | page `<title>`, the `<h1>` heading |

It skips `node_modules`, `bin`, `obj`, `dist`, and the rename scripts. After it
runs, review the diff, then `cd client && npm install`. The `client/` and
`server/` folder names don't change — only the project identity inside them, so
there's nothing path-dependent to fix up.

---

## 4. Running it

### Option A — VS Code, both at once (recommended)

1. Open the **root** folder in VS Code (not `client/` or `server/` individually).
2. Accept the recommended extensions when prompted (Vue – Official, C# Dev Kit).
3. Run `npm install` in `client/` if you haven't.
4. Open **Run and Debug** (Ctrl+Shift+D), pick **Full Stack**, press **F5**.

That compound config builds + launches the API with C# breakpoints working, and
starts the Vite dev server + opens Chrome with JS/Vue breakpoints working. Edit a
`.vue` file and the browser hot-reloads in milliseconds without losing state —
this is the single most noticeable upgrade over Blazor's reload story.

### Option B — two terminals

```bash
# terminal 1 — API
cd server
dotnet watch run        # https://localhost:7123

# terminal 2 — client
cd client
npm run dev             # http://localhost:5173
```

Open http://localhost:5173. The forecast loads from the .NET API through the
Vite proxy.

### Build for production

```bash
cd client
npm run build           # type-checks (vue-tsc) then bundles to client/dist/
```

`dist/` is a static site. Serve it however you like — see §8.

---

## 5. How the two halves actually talk

```
Browser ──GET /api/forecast──► Vite dev server (5173) ──proxy──► ASP.NET (7123)
```

In **dev**, the browser only ever hits the Vite origin. Vite's proxy (in
`vite.config.ts`) forwards anything under `/api` to the .NET process. So from the
browser's perspective everything is same-origin: **no CORS, no cross-site cookie
issues**, and dev mirrors a typical same-origin prod deployment.

The client never hard-codes a host — it reads `VITE_API_BASE_URL` from
`.env.development` (`/api`, relative). The API client is in
`src/api/client.ts`: a typed `fetch` wrapper that attaches the bearer token,
serializes JSON, and — importantly — **throws on non-2xx** (fetch doesn't do
that for you; it's the `EnsureSuccessStatusCode` you have to add yourself).

Two gotchas this template already handles for you:
- **Self-signed dev cert:** the proxy sets `secure: false` so Node doesn't reject
  the ASP.NET dev HTTPS cert. Dev-only; never do this in prod.
- **camelCase JSON:** `System.Text.Json` serializes C# `PascalCase` as
  `camelCase`, so the TS interfaces use camelCase. (Bit Newtonsoft veterans
  expecting PascalCase on the wire.)

---

## 6. CORS (only matters when you decouple deployment)

`Program.cs` registers a `DevCors` policy allowing `localhost:5173`. You won't
hit it in dev because of the proxy. It earns its keep when the SPA is deployed to
a **different origin** than the API (e.g. Azure Static Web Apps front-end calling
an App Service API). Then: add the real front-end origin to `WithOrigins(...)`,
and remember CORS is enforced by the *browser*, not the server — the server
always responds; the browser blocks JS from reading it without the headers.

---

## 7. Type sharing between C# DTOs and TS interfaces

Right now `client/src/api/types.ts` is a hand-written mirror of the records in
`Program.cs`. Fine for a few types; brittle past that. Options, roughly in order
of how much you'll like them:

- **Manual** (current): zero tooling, full control, drifts if you forget. Good
  for a handful of stable DTOs.
- **OpenAPI → TS generator:** the API already serves a spec at
  `/openapi/v1.json`. Point a generator at it (e.g. `openapi-typescript` for just
  the types, or `@hey-api/openapi-ts` / NSwag for types *and* a client) as a
  `package.json` script. Single source of truth = your C# contract. The cost is
  another build step and a generated-code file you don't edit. This is what you
  want once the API surface grows.

The `.WithName(...)` on each endpoint sets the OpenAPI `operationId`, which most
generators use to name the generated function — so name them well.

---

## 8. Deployment shapes

- **Same origin (simplest):** `npm run build`, then have ASP.NET Core serve
  `client/dist/` via `UseStaticFiles` + a SPA fallback to `index.html`. One
  deployable, no CORS. Closest to how you'd ship a Blazor app.
- **Split (Azure Static Web Apps + App Service / Container App):** deploy
  `dist/` to Static Web Apps, the API separately. Set `VITE_API_BASE_URL` in
  `.env.production` to the API's absolute URL and add that front-end origin to
  the CORS policy.

---

## 9. What's deliberately NOT in here

Kept minimal so it's a clean base, not a kitchen sink:
- **No Vue Router** — add `vue-router` and register it in `main.ts` when you have
  more than one screen.
- **No Pinia** — add it when you have state shared across unrelated components.
  Resist making everything global: a `ref` inside a component is the default,
  the same way a DI-scoped service is the default over a singleton. Reach for
  Pinia (≈ a scoped service holding state) only when sharing demands it.
- **No UI library** — plain scoped CSS. Bolt on PrimeVue/Vuetify/Naive later if
  you want; starting without one keeps the reactivity model un-obscured.
- **No ESLint/Prettier** — add if your team wants enforced style; not required to
  run anything.

---

## Quick reference

```bash
# first time, after copy + rename
cd client && npm install
dotnet dev-certs https --trust

# daily dev (or just press F5 → Full Stack in VS Code)
cd server && dotnet watch run
cd client && npm run dev

# checks / build
cd client && npm run type-check      # vue-tsc, no emit
cd client && npm run build           # type-check + bundle to dist/
```
