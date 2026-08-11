import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
let commit = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7);
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    commit = 'dev';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  agentRules: false,
  env: { NEXT_PUBLIC_APP_VERSION: `${version}+${commit}` },
};

export default nextConfig;
