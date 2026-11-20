/**
 * Post-deploy smoke check for the live site. No credentials and no writes.
 *
 * It verifies the three things a deploy can silently break: the entry bundle is the
 * public one (no signed-in UI, lazy chunk served), the self-hosted WOFF2 fonts resolve,
 * and the Firestore Rules still deny anonymous reads of everything except the public
 * schedule.
 *
 * Usage: node scripts/smoke-production.mjs [base-url]
 */
const baseUrl = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? 'https://werks-session.web.app').replace(/\/$/, '');

// Firebase's public web-app configuration, not a credential. It is already shipped in
// the browser bundle and is only used here to talk to the public Firestore endpoint.
const firebaseProject = 'werks-session';
const firebaseApiKey = 'AIzaSyCWud7NIXKX4NSzmAJ4UEZxzbmFhTbIekw';

const signedInMarkers = [
  'Record a night',
  'Instructor review',
  'Upcoming dates',
  'Continue with Google',
  'Start my practice',
];

const failures = [];
const record = (name, ok, detail) => {
  const label = ok ? 'ok  ' : 'FAIL';
  console.log(`${label} ${name}${detail ? ` - ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

const fetchText = async (url) => {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) });
  return { response, text: await response.text() };
};

const home = await fetchText(`${baseUrl}/`);
record('home returns 200', home.response.status === 200, `status ${home.response.status}`);

const entryPath = home.text.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
const stylePath = home.text.match(/href="(\/assets\/index-[\w-]+\.css)"/)?.[1];

if (!entryPath || !stylePath) {
  record('home references a built entry chunk and stylesheet', false);
} else {
  record('home references a built entry chunk and stylesheet', true, `${entryPath} ${stylePath}`);

  const entry = await fetchText(`${baseUrl}${entryPath}`);
  const leaked = signedInMarkers.filter((marker) => entry.text.includes(marker));
  record(
    'entry chunk carries no signed-in UI',
    entry.response.status === 200 && leaked.length === 0,
    leaked.join(', '),
  );

  // Vite emits the dynamic import relative to the entry ("../assets/..." or "./LearnerAccess-...js").
  const lazySpecifier = entry.text.match(/["']([^"']*LearnerAccess-[\w-]+\.js)["']/)?.[1];
  let lazyText = '';
  if (!lazySpecifier) {
    record('entry chunk references the lazy signed-in chunk', false);
  } else {
    const lazyUrl = new URL(lazySpecifier, new URL(entryPath, baseUrl));
    const lazy = await fetchText(lazyUrl.href);
    lazyText = lazy.text;
    record(
      'lazy signed-in chunk is served',
      lazy.response.status === 200 && lazy.text.includes('Record a night'),
      lazyUrl.pathname,
    );
  }

  const style = await fetchText(`${baseUrl}${stylePath}`);
  const fontPath = style.text.match(/url\((\/assets\/[\w-]+\.woff2)\)/)?.[1];
  if (!fontPath) {
    record('stylesheet references a self-hosted WOFF2 font', false);
  } else {
    const font = await fetch(`${baseUrl}${fontPath}`, { signal: AbortSignal.timeout(15_000) });
    record(
      'WOFF2 font is served',
      font.status === 200 && font.headers.get('content-type')?.includes('font/woff2'),
      fontPath,
    );
  }

  const legacyWoff = style.text.match(/url\((\/assets\/[\w-]+\.woff)\)/)?.[1];
  record('stylesheet ships no legacy WOFF font', !legacyWoff, legacyWoff ?? 'none');

  // The signed-in pages are routes, so a cold load or a refresh must reach the app.
  const deepLink = await fetchText(`${baseUrl}/instructor/review`);
  record(
    'an instructor deep link serves the app',
    deepLink.response.status === 200 && deepLink.text.includes('id="root"'),
    'status ' + deepLink.response.status,
  );
  const accessLink = await fetchText(`${baseUrl}/access`);
  record(
    'the access deep link serves the app',
    accessLink.response.status === 200 && accessLink.text.includes('id="root"'),
    'status ' + accessLink.response.status,
  );
  const missingAsset = await fetch(`${baseUrl}/assets/does-not-exist.js`, { signal: AbortSignal.timeout(15_000) });
  record('a missing asset still returns 404', missingAsset.status === 404, 'status ' + missingAsset.status);

  // A build that accidentally included the emulator flag would point visitors at localhost.
  const emulatorMarkers = ['127.0.0.1', 'demo-werks-sessions'];
  const leakedEmulator = emulatorMarkers.filter((marker) => entry.text.includes(marker) || lazyText.includes(marker));
  record(
    'live bundle points at the Firebase project, not an emulator',
    leakedEmulator.length === 0,
    leakedEmulator.join(', '),
  );
}

const documents = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents`;

const probe = async (name, path, allowedStatuses) => {
  const response = await fetch(`${documents}/${path}?key=${firebaseApiKey}`, { signal: AbortSignal.timeout(15_000) });
  const allowed = allowedStatuses.includes(response.status);
  record(name, allowed, `status ${response.status}`);
};

await probe('anonymous read of public_schedule/current is allowed', 'public_schedule/current', [200, 404]);
await probe('anonymous read of another schedule document is denied', 'public_schedule/other', [403]);
await probe('anonymous read of a night record is denied', 'sessions/smoke-session/night_record/main', [403]);
await probe('anonymous read of a session guide is denied', 'sessions/smoke-session/guide/main', [403]);
await probe('anonymous read of an access grant is denied', 'access_grants/smoke-uid', [403]);

if (failures.length > 0) {
  console.error(`\nSmoke check failed (${failures.length}): ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\nSmoke check passed against ${baseUrl}.`);
