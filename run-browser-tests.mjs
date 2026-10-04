import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const browser = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'subtitle-qc-browser-'));
const target = `${pathToFileURL(join(here, 'test-runner.html')).href}?autorun=1`;

try {
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=12000',
    '--dump-dom',
    target,
  ], {
    cwd: here,
    encoding: 'utf8',
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  const html = String(result.stdout ?? '');
  const output = html.match(/<pre id="out"[^>]*>([\s\S]*?)<\/pre>/i)?.[1]
    ?.replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim() ?? '';
  console.log(output || String(result.stderr ?? '').trim() || 'No test output');
  if (result.status !== 0 || !output.includes('RESULT PASS') || output.includes('RESULT FAIL')) {
    process.exitCode = 1;
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}
