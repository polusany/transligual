import path from 'node:path';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import type { NextConfig } from 'next';

const nextConfig = (phase: string): NextConfig => ({
  // Select by Next's startup phase, not NODE_ENV: shells can retain
  // NODE_ENV=production while `next dev` is running.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
});

export default nextConfig;
