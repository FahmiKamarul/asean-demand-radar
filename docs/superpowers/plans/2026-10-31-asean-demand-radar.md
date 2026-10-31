# ASEAN Demand Radar Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local demo app that goes from an uploaded book page to a sourced book-and-country heatmap and a human-approved test kit.

**Architecture:** A Next.js App Router app with one API route per agent, so the browser calls the agents in turn and shows real progress without streaming. Gemma calls sit behind one injectable `generate` function, so agents are tested without network access. Plain code calculates scores, and JSON files in `data/` replace a database.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Zod, `@google/genai`, Node 24.

**Spec:** https://claude.ai/artifact/LHUiMetzrGq5sEVRYZanUh

## Global Constraints

- Hackathon timeline is 4 hours. Features freeze at 3:15. If time runs short, cut the dashboard before the test kit.
- Countries are exactly Indonesia (`ID`), the Philippines (`PH`) and Thailand (`TH`), with 1–2 books.
- No database, login, live scraping, automatic messaging, ads or creator outreach.
- Model ID comes from `GEMMA_MODEL`, and the key from `GEMINI_API_KEY` in `.env.local`. Never commit either.
- Same inputs always give the same score. Gemma never calculates the score.
- Missing evidence shows exactly `no evidence yet`.
- Use the words "demand signal" and "recommended test", never "prediction".
- Every sample or replayed result is visibly labelled. Never invent evidence or sources in `data/`.
- Generated content can't be copied, and its sign-up link isn't shown, until a person ticks approval.
- Never infer religion, race or health. Dietary tags describe the book, not people.
- Don't push to a remote unless the user asks.

## Review Focus

- Model output wrapped in code fences, or invalid: parse the fences, retry once, then show a clear error. Test in Task 1.
- A photo that isn't a readable book page: return `readable: false` and tell the user, with no invented tags. Test in Task 3.
- Oversized or unsupported uploads, such as phone HEIC photos: reject before any API call with a message saying what's accepted. Test in Task 4.
- A country with no evidence: score is `null`, shown as `no evidence yet`, and Gemma isn't asked about it. Test in Task 3.
- Gemma citing an evidence ID that doesn't exist: drop the citation, and if none remain, set taste match to `none`. Test in Task 3.

---

### Task 1: Project setup and Gemma client

**Files:**
- Create: Next.js project in `asean-demand-radar/`, `.env.example`, `lib/gemma.ts`, `scripts/check-model.ts`
- Test: `tests/gemma.test.ts`

**Interfaces:**
- Produces:
  - `type Part = { text: string } | { inlineData: { mimeType: string; data: string } }`
  - `type Generate = (parts: Part[]) => Promise<string>`
  - `class GemmaError extends Error { kind: 'bad_output' | 'rate_limited' | 'unavailable' }`
  - `parseModelJson(raw: string): unknown`
  - `generateJson<T>(parts: Part[], schema: z.ZodType<T>, generate?: Generate): Promise<T>`

- [ ] **Step 1: Create the project and repo**

Run: `npx create-next-app@15 asean-demand-radar --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm`, then `npm i zod @google/genai` and `npm i -D vitest tsx`. Add `"test": "vitest run"`. Keep `.env*` ignored, but allow `.env.example`. The existing `docs/` folder stays. Create the project in a temporary name and move it in if the tool refuses a non-empty folder.

- [ ] **Step 2: Write the failing tests**

```ts
test('parses fenced JSON', () => expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }));
test('retries once, then succeeds', async () => {
  const gen = vi.fn().mockResolvedValueOnce('nope').mockResolvedValueOnce('{"a":1}');
  await expect(generateJson([], z.object({ a: z.number() }), gen)).resolves.toEqual({ a: 1 });
  expect(gen).toHaveBeenCalledTimes(2);
});
test('throws bad_output after two invalid replies', async () => {
  const gen = vi.fn().mockResolvedValue('nope');
  await expect(generateJson([], z.object({ a: z.number() }), gen)).rejects.toMatchObject({ kind: 'bad_output' });
});
test('does not retry rate limits', async () => {
  const gen = vi.fn().mockRejectedValue(new GemmaError('rate_limited', 'slow down'));
  await expect(generateJson([], z.object({}), gen)).rejects.toMatchObject({ kind: 'rate_limited' });
  expect(gen).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run the tests**

Run: `npm test -- gemma`
Expected: FAIL because `lib/gemma.ts` doesn't exist.

- [ ] **Step 4: Implement `lib/gemma.ts`**

The default `Generate` uses `@google/genai`, and maps HTTP 429 to `rate_limited` and other API failures to `unavailable`. Put all instructions in the user prompt and don't use system instructions or JSON mode, because Gemma support for them is unconfirmed.

- [ ] **Step 5: Run the tests**

Run: `npm test -- gemma`
Expected: PASS.

- [ ] **Step 6: Write `scripts/check-model.ts` and test real access**

It lists models whose name contains `gemma`, then sends one test image and prompt to `GEMMA_MODEL`, printing the reply and time taken.

Run: `npx tsx --env-file=.env.local scripts/check-model.ts`
Expected: a Gemma 4 model appears and describes the image. If not, stop and tell the user. This is the 0:20 cut-off.

- [ ] **Step 7: Commit**

```bash
git init && git add . && git commit -m "feat: set up project and Gemma client"
```

### Task 2: Types, scoring and evidence data

**Files:**
- Create: `lib/types.ts`, `lib/score.ts`, `lib/evidence.ts`, `lib/trends.ts`, `data/countries.json`, `data/evidence.json`
- Test: `tests/score.test.ts`, `tests/evidence.test.ts`

**Interfaces:**
- Produces in `lib/types.ts`, with matching Zod schemas named `<Type>Schema`:
  - `CountryCode = 'ID' | 'PH' | 'TH'`
  - `TasteMatch = 'strong' | 'some' | 'weak' | 'none'`
  - `Country { code; name; language; reach: number; reachReason: string }`
  - `Evidence { id; country: CountryCode; sourceType: 'search_interest' | 'search_volume' | 'content' | 'comments' | 'competitor'; finding: string; sourceUrl: string; collectedOn: string; originalLanguage?: string }`
  - `BookTags { readable: boolean; title: string; cuisine: string; spiceLevel: 'mild' | 'medium' | 'hot' | 'unknown'; portion: 'small' | 'family' | 'unknown'; cookingTime: string; ingredientCost: 'low' | 'medium' | 'high' | 'unknown'; dietaryFit: string[]; language: string }`
  - `CountryFit { country: CountryCode; score: number | null; confidence: 'low' | 'medium' | 'high' | null; tasteMatch: TasteMatch; reason: string; suggestedAngle: string; gaps: string[]; evidence: Evidence[] }`
  - `TestKit { country: CountryCode; language: string; recipeTitle: string; ingredients: string[]; steps: string[]; swaps: { from: string; to: string; why: string }[]; liveScript: string; signupPath: string }`
- Produces in the other files:
  - `computeScore(input: { tasteMatch: TasteMatch; reach: number; evidence: Evidence[] }, now: Date): { score: number | null; confidence: CountryFit['confidence'] }`
  - `readEvidence(): Promise<Evidence[]>`, `addEvidence(item: Omit<Evidence, 'id'>): Promise<Evidence>`, `getCountries(): Promise<Country[]>`
  - `parseTrendsCsv(csv: string, term: string, sourceUrl: string, collectedOn: string): Omit<Evidence, 'id'>[]`

- [ ] **Step 1: Write the failing tests**

```ts
const recent = (n: number) => Array.from({ length: n }, () => ({ ...base, collectedOn: '2026-10-01' }));
test('strong match', () => expect(computeScore({ tasteMatch: 'strong', reach: 0.8, evidence: recent(10) }, now))
  .toEqual({ score: 95, confidence: 'high' }));
test('some match', () => expect(computeScore({ tasteMatch: 'some', reach: 0.4, evidence: recent(4) }, now))
  .toEqual({ score: 50, confidence: 'low' }));
test('no evidence', () => expect(computeScore({ tasteMatch: 'none', reach: 0.8, evidence: [] }, now))
  .toEqual({ score: null, confidence: null }));
test('old evidence does not add strength', () => {
  const old = recent(10).map(e => ({ ...e, collectedOn: '2024-01-01' }));
  expect(computeScore({ tasteMatch: 'strong', reach: 0.8, evidence: old }, now).score).toBe(70);
});
test('reads a Trends country CSV', () => {
  const rows = parseTrendsCsv('Category: All categories\n\nCountry,pedas: (11/1/25 - 10/31/26)\nIndonesia,100\nThailand,8\nFrance,<1\n', 'pedas', 'https://trends.google.com/x', '2026-10-31');
  expect(rows.map(r => r.country)).toEqual(['ID', 'TH']);
  expect(rows[0].finding).toBe('Relative search interest for "pedas" in Indonesia: 100 out of 100');
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- score evidence`
Expected: FAIL because the modules don't exist.

- [ ] **Step 3: Implement the modules and data**

Score is `round(100 × (0.5 × taste + 0.25 × reach + 0.25 × strength))`. Taste is strong 1, some 0.6, weak 0.25, none 0. Strength is `min(recentCount / 10, 1)`, and recent means collected within 365 days. Confidence is low under 5 sources, medium 5–9 and high at 10 or more. These weights are a team-adjustable default.

`data/countries.json` holds reach: ID 0.8 (Malay and Indonesian are close), PH 0.7 (English may work), TH 0.3 (needs Thai or a local host). `data/evidence.json` starts as `[]`, because only sourced items from the marketing teammate go in.

- [ ] **Step 4: Run the tests**

Run: `npm test -- score evidence`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add scoring and evidence data"
```

### Task 3: The agents

**Files:**
- Create: `lib/agents/bookReader.ts`, `lib/agents/evidenceReader.ts`, `lib/agents/marketMatcher.ts`, `lib/agents/localizer.ts`
- Test: `tests/agents.test.ts`

**Interfaces:**
- Consumes: `generateJson`, `Generate`, `Part`, `computeScore` and the Task 2 types.
- Produces:
  - `readBook(images: Part[], generate?: Generate): Promise<BookTags>`
  - `readEvidenceImage(image: Part, country: CountryCode, generate?: Generate): Promise<{ finding: string; originalLanguage: string; sourceType: Evidence['sourceType'] }>`
  - `matchCountry(book: BookTags, country: Country, evidence: Evidence[], now: Date, generate?: Generate): Promise<CountryFit>`
  - `buildTestKit(book: BookTags, country: Country, angle: string, pageImage: Part | null, generate?: Generate): Promise<TestKit>`

- [ ] **Step 1: Write the failing tests**

```ts
test('matchCountry skips Gemma without evidence', async () => {
  const gen = vi.fn();
  const fit = await matchCountry(book, indonesia, [], now, gen);
  expect(gen).not.toHaveBeenCalled();
  expect(fit).toMatchObject({ score: null, tasteMatch: 'none', reason: 'no evidence yet' });
});
test('matchCountry drops unknown citations', async () => {
  const gen = vi.fn().mockResolvedValue(JSON.stringify({ tasteMatch: 'strong', citedIds: ['fake'], reason: 'r', suggestedAngle: 'a', gaps: [] }));
  const fit = await matchCountry(book, indonesia, [ev1], now, gen);
  expect(fit.tasteMatch).toBe('none');
  expect(fit.evidence).toEqual([]);
});
test('matchCountry scores only cited evidence', async () => {
  const gen = vi.fn().mockResolvedValue(JSON.stringify({ tasteMatch: 'strong', citedIds: ['e1'], reason: 'r', suggestedAngle: 'a', gaps: [] }));
  expect((await matchCountry(book, indonesia, [ev1, ev2], now, gen)).evidence).toEqual([ev1]);
});
test('readBook passes through an unreadable page', async () => {
  const gen = vi.fn().mockResolvedValue(JSON.stringify({ ...blankTags, readable: false }));
  expect((await readBook([img], gen)).readable).toBe(false);
});
test('buildTestKit sets its own sign-up path', async () => {
  const gen = vi.fn().mockResolvedValue(JSON.stringify(kitReply));
  expect((await buildTestKit(book, indonesia, 'spicy', null, gen)).signupPath).toBe('/signup/ID');
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- agents`
Expected: FAIL because the agents don't exist.

- [ ] **Step 3: Implement the agents**

Prompts must:
- **All:** return only JSON and use `unknown` rather than guessing.
- **Book Reader:** set `readable: false` if the image isn't a readable book page.
- **Evidence Reader:** give the finding in English, and leave out usernames and other personal details.
- **Market Matcher:** use only the listed evidence, cite it by ID, and treat country tastes as claims needing evidence.
- **Localizer:** adapt only what the page or tags show, and include a checking note for ingredient swaps in `why`.

`matchCountry` calls `computeScore` with `reach` from the country and only verified cited evidence.

- [ ] **Step 4: Run the tests**

Run: `npm test -- agents`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add Gemma agents"
```

### Task 4: API routes

**Files:**
- Create: `lib/uploads.ts`, `lib/apiError.ts`, `app/api/book/route.ts`, `app/api/match/route.ts`, `app/api/kit/route.ts`, `app/api/evidence/route.ts`
- Test: `tests/uploads.test.ts`, `tests/apiError.test.ts`

**Interfaces:**
- Consumes: the Task 3 agents and `readEvidence`, `addEvidence`, `getCountries`.
- Produces:
  - `filesToParts(files: File[]): Promise<Part[]>`, throwing `UploadError`
  - `toErrorResponse(e: unknown): Response`, returning `{ error: string, canReplay: boolean }`
  - `POST /api/book` takes form field `pages` and returns `{ book: BookTags }`
  - `POST /api/match` takes `{ book, country: CountryCode }` and returns `{ fit: CountryFit }`
  - `POST /api/kit` takes form fields `book`, `country`, `angle`, optional `page`, and returns `{ kit: TestKit }`
  - `POST /api/evidence` takes form fields `image`, `country`, `sourceUrl`, and returns `{ evidence: Evidence }`
  - `GET /api/evidence` returns `{ evidence: Evidence[] }`

- [ ] **Step 1: Write the failing tests**

```ts
test('rejects HEIC with a helpful message', async () => {
  await expect(filesToParts([new File(['x'], 'a.heic', { type: 'image/heic' })])).rejects.toThrow('Use JPG, PNG or WebP');
});
test('rejects files over 8 MB', async () => {
  await expect(filesToParts([new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' })])).rejects.toThrow('8 MB');
});
test('rejects more than 5 files and no files', async () => {
  const f = new File(['x'], 'a.png', { type: 'image/png' });
  await expect(filesToParts(Array(6).fill(f))).rejects.toThrow('5');
  await expect(filesToParts([])).rejects.toThrow('at least one');
});
test('rate limit maps to 429 with replay offered', async () => {
  const res = toErrorResponse(new GemmaError('rate_limited', 'x'));
  expect(res.status).toBe(429);
  expect((await res.json()).canReplay).toBe(true);
});
test('upload errors map to 400 without replay', async () => {
  expect(toErrorResponse(new UploadError('bad')).status).toBe(400);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- uploads apiError`
Expected: FAIL because the modules don't exist.

- [ ] **Step 3: Implement the helpers and routes**

Routes validate input with the Task 2 schemas and contain no business logic. `POST /api/evidence` requires an `http(s)` `sourceUrl` and returns 400 without one.

- [ ] **Step 4: Run the tests and a build**

Run: `npm test && npm run build`
Expected: tests PASS, and the build succeeds.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add API routes"
```

### Task 5: Main screen, agent progress, heatmap and evidence

**Files:**
- Create: `app/page.tsx`, `components/UploadPanel.tsx`, `components/AgentProgress.tsx`, `components/Heatmap.tsx`, `components/EvidencePanel.tsx`, `lib/useRadar.ts`, `lib/radarState.ts`
- Test: `tests/radarState.test.ts`

**Interfaces:**
- Consumes: the Task 4 routes.
- Produces:
  - `type BookResult = { tags: BookTags; fits: CountryFit[]; pageImage?: string }`
  - `type AgentStatus = 'waiting' | 'running' | 'done' | 'failed'`
  - `upsertBook(results: BookResult[], next: BookResult): BookResult[]`, keeping at most 2 books and replacing a matching title
  - `useRadar()`, returning `{ results, statuses, error, canReplay, selected, analyze(files), select(title, country), replay() }`
  - `<Heatmap results onSelect />`, `<EvidencePanel fit country />`

- [ ] **Step 1: Write the failing tests**

```ts
test('replaces a book with the same title', () => {
  expect(upsertBook([a], { ...a, fits: [fit] })[0].fits).toEqual([fit]);
});
test('keeps the newest two books', () => {
  expect(upsertBook([a, b], c).map(r => r.tags.title)).toEqual(['B', 'C']);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- radarState`
Expected: FAIL because `upsertBook` doesn't exist.

- [ ] **Step 3: Implement the screen**

Use the `impeccable` skill for the visual design. `analyze` calls `/api/book`, then `/api/match` once per country, updating `AgentProgress` from each real call. An unreadable page stops the flow with: "We couldn't read this page. Try a clearer photo of a book page." Each heatmap square shows its number or `no evidence yet`, so colour is never the only signal, and is labelled a demand signal. `EvidencePanel` shows the confidence, source count, reason, gaps, and each finding with its source link and date. Use a ranked table if the heatmap isn't working by 2:30.

- [ ] **Step 4: Run the tests and check in a browser**

Run: `npm test -- radarState`, then `npm run dev`.
Expected: tests PASS. In the browser, a real page shows each agent's progress, the heatmap, and evidence with working links.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add main radar screen"
```

### Task 6: Test kit, approval and replay

**Files:**
- Create: `components/TestKitPanel.tsx`, `lib/kitApproval.ts`, `lib/replay.ts`, `components/ReplayBanner.tsx`, `data/replay/`, `scripts/save-replay.ts`
- Modify: `lib/useRadar.ts`, `app/page.tsx`
- Test: `tests/kitApproval.test.ts`

**Interfaces:**
- Consumes: `useRadar`, `TestKit`, `POST /api/kit`.
- Produces:
  - `kitActions(approved: boolean): { canCopy: boolean; showLink: boolean }`
  - `loadReplay(): Promise<{ results: BookResult[]; kit: TestKit; capturedOn: string } | null>`
  - `scripts/save-replay.ts`, which runs the real agents on a given image and saves `data/replay/demo.json`

- [ ] **Step 1: Write the failing tests**

```ts
test('locks copying and the link until approved', () => {
  expect(kitActions(false)).toEqual({ canCopy: false, showLink: false });
  expect(kitActions(true)).toEqual({ canCopy: true, showLink: true });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- kitApproval`
Expected: FAIL because `kitActions` doesn't exist.

- [ ] **Step 3: Implement the panel and replay**

The evidence panel gets a **Create test kit** button. The kit shows the recipe, swaps and live script, plus an unticked "I've reviewed this content" checkbox. A new kit resets approval. Replay appears only when the API failed or `?replay=1` is in the URL, and always shows the banner: "Replaying a saved result from {capturedOn}". If no saved file exists, the app says so.

- [ ] **Step 4: Run the tests and check in a browser**

Run: `npm test -- kitApproval`, then generate a kit on a real page and open `/?replay=1`.
Expected: tests PASS, copy and link stay locked until approval, and replay shows its banner.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add test kit approval and replay"
```

### Task 7: Sign-up form and dashboard

**Files:**
- Create: `lib/signups.ts`, `app/api/signups/route.ts`, `app/signup/[country]/page.tsx`, `app/dashboard/page.tsx`, `data/sample-results.json`
- Modify: `.gitignore` to add `data/signups.json`
- Test: `tests/signups.test.ts`

**Interfaces:**
- Consumes: `CountryCode`.
- Produces:
  - `SignupSchema`: `{ country, name, email, favouriteDishes: string, skillLevel: 'beginner' | 'intermediate' | 'advanced', dietaryNeeds: string, consent: true }`
  - `addSignup(input: unknown): Promise<void>`
  - `countByCountry(): Promise<Record<CountryCode, number>>`, returning counts only

- [ ] **Step 1: Write the failing tests**

```ts
test('rejects a sign-up without consent', async () => {
  await expect(addSignup({ ...valid, consent: false })).rejects.toThrow();
});
test('counts by country without exposing people', async () => {
  await addSignup(valid);
  const counts = await countByCountry();
  expect(counts.ID).toBe(1);
  expect(JSON.stringify(counts)).not.toContain(valid.email);
});
```

Point the store at a temporary file through `SIGNUPS_FILE`.

- [ ] **Step 2: Run the tests**

Run: `npm test -- signups`
Expected: FAIL because `lib/signups.ts` doesn't exist.

- [ ] **Step 3: Implement the form and dashboard**

The form has an unticked consent box explaining that the seller may contact them, and dietary needs stay optional. The dashboard shows real sign-up counts apart from sample leads, replies and meetings per country, under the heading "Sample data for illustration". The sample file carries `"isSample": true`.

- [ ] **Step 4: Run the tests and check in a browser**

Run: `npm test -- signups`, then submit `/signup/ID` and open `/dashboard`.
Expected: tests PASS, and the real count rises while sample data stays labelled.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: add sign-up form and dashboard"
```

### Task 8: Real-data run and demo readiness

**Files:**
- Create: `README.md`
- Modify: `data/evidence.json` and `data/replay/demo.json`, using the team's real inputs

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Load real evidence**

Add the marketing teammate's screenshots through `POST /api/evidence`, and Trends CSVs through `parseTrendsCsv`.
Expected: each item has a source link, and no personal details appear in any finding.

- [ ] **Step 2: Rehearse the whole demo**

Run: `npm test && npm run build && npm start`, then upload a real page and go through the heatmap, evidence, test kit and approval, sign-up and dashboard.
Expected: tests PASS, and every step works on the demo laptop.

- [ ] **Step 3: Save a replay and test it offline**

Run: `npx tsx --env-file=.env.local scripts/save-replay.ts <page image>`, disconnect from the network, then open `/?replay=1`.
Expected: the demo plays with its replay banner visible.

- [ ] **Step 4: Write `README.md` and commit**

Cover setup, adding evidence and replay, plus what's working and what's planned. The app stores files locally and runs on one machine, so note that the sign-up link needs hosting before the seller can share it publicly.

```bash
git add . && git commit -m "docs: add demo setup and real demo data"
```
