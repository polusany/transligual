const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Run from the monorepo root regardless of the host's working directory.
const root = path.resolve(__dirname, '../../..');
process.chdir(root);
const migration = spawnSync('pnpm', ['--filter', '@transligual/api', 'prisma:deploy'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (migration.error || migration.status !== 0) {
  console.error('Database migrations failed; the API was not started.');
  process.exit(migration.status || 1);
}
require(path.join(root, 'apps/api/dist/main.js'));
