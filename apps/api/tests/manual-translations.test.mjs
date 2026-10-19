// Isolated service tests: no live records are read or changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); }
catch { ts = require('../../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript'); }
const source = readFileSync(new URL('../src/translations/translations.service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } }).outputText;
class ServiceError extends Error {}
const output = {};
vm.runInNewContext(compiled, { exports: output, require: name => {
  if (name === '@nestjs/common') return { Injectable: () => target => target, GoneException: ServiceError, NotFoundException: ServiceError };
  if (name === './translation-provider') return { translateWithGoogle: async input => ({ translatedText: 'Bonjour', targetLanguage: input.targetLanguage }) };
  throw new Error(`Unexpected runtime dependency: ${name}`);
}, Date });
const Service = output.TranslationsService;
const plain = value => JSON.parse(JSON.stringify(value));

test('retired manual submissions never create work or change historical records', async () => {
  const service = new Service(new Proxy({}, { get() { throw new Error('Database must not be touched'); } }));
  await assert.rejects(service.createRequest('student-1', { sourceLanguage: 'English', targetLanguage: 'French', sourceText: 'Hello' }), /retired.*instant translation/);
});
test('historical request lookup always scopes to the authenticated customer', async () => {
  let query;
  const service = new Service({ translationRequest: { findFirst: async args => { query = args; return null; } } });
  await assert.rejects(() => service.findMine('student-1', 'another-request'), /not found/);
  assert.deepEqual(plain(query.where), { id: 'another-request', customerId: 'student-1' });
});
test('historical lists remain private and sorted newest first', async () => {
  let query;
  const service = new Service({ translationRequest: { findMany: async args => { query = args; return []; } } });
  await service.listMine('student-1');
  assert.deepEqual(plain(query), { where: { customerId: 'student-1' }, orderBy: { createdAt: 'desc' } });
});
test('instant endpoint still delegates to the automatic provider', async () => {
  assert.equal((await new Service({}).translateText({ text: 'Hello', targetLanguage: 'fr' })).translatedText, 'Bonjour');
});
test('admin reply route is no longer registered and the service cannot reply', () => {
  const module = readFileSync(new URL('../src/translations/translations.module.ts', import.meta.url), 'utf8');
  assert.ok(!module.includes('AdminTranslationsController'));
  assert.equal(Service.prototype.reply, undefined);
});
