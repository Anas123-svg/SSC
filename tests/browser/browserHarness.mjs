import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export function browserOptions() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE };
  const cache = join(homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(cache)) {
    const versions = readdirSync(cache).filter(name => /^chromium-\d+$/.test(name)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]));
    for (const version of versions) { const executablePath = join(cache, version, 'chrome-win64', 'chrome.exe'); if (existsSync(executablePath)) return { headless: true, executablePath }; }
  }
  return { headless: true };
}
