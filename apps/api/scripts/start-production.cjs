const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Run from the monorepo root regardless of the host's working directory.
const root = path.resolve(__dirname, '../../..');
const apiDirectory = path.join(root, 'apps/api');
process.chdir(apiDirectory);
// Use the CLI installed in the image; no runtime package-manager download.
// Prisma's package root exports types, not the executable. Resolve its bin.
const prismaPackagePath = require.resolve('prisma/package.json');
const prismaPackage = require(prismaPackagePath);
const prismaCli = path.resolve(path.dirname(prismaPackagePath), prismaPackage.bin.prisma);
const migration = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  cwd: apiDirectory,
  stdio: 'inherit',
  env: process.env,
});
if (migration.error || migration.status !== 0) {
  console.error('Database migrations failed; the API was not started.');
  process.exit(migration.status || 1);
}
// Explicit opt-in: initialize the deployed admin without changing existing credentials.
if (process.env.BOOTSTRAP_ADMIN_ON_START === 'true') {
  const seed = spawnSync(process.execPath, [prismaCli, 'db', 'seed'], {
    cwd: apiDirectory, stdio: 'inherit', env: process.env,
  });
  if (seed.error || seed.status !== 0) {
    console.error('Admin bootstrap failed; the API was not started.');
    process.exit(seed.status || 1);
  }
}
require(path.join(root, 'apps/api/dist/main.js'));
