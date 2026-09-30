// Isolated service tests: database operations are mocked; no live data is changed.
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
  if (name === '@nestjs/common') return { Injectable: () => target => target, BadRequestException: ServiceError, ConflictException: ServiceError, GoneException: ServiceError, NotFoundException: ServiceError };
  throw new Error(`Unexpected runtime dependency: ${name}`);
}, Date });
const Service = output.TranslationsService;
const plain = value => JSON.parse(JSON.stringify(value));

test('new requests save source text and enforce an account rate limit', async () => {
  let saved, limit;
  const service = new Service({ translationRequest: { create: async args => { saved = args; return args.data; } } }, { consume: async (...args) => { limit = args; } });
  await service.createRequest('student-1', { sourceLanguage: 'English', targetLanguage: 'French', sourceText: 'Hello' });
  assert.deepEqual(limit, ['translation:requests:student-1', 20, 86400000]);
  assert.equal(saved.data.customerId, 'student-1');
  assert.equal(saved.data.sourceText, 'Hello');
  assert.equal(saved.data.serviceType, 'GENERAL_DOCUMENT');
});
test('same-language requests are rejected', async () => {
  await assert.rejects(() => new Service({}, {}).createRequest('student-1', { sourceLanguage: 'French', targetLanguage: 'french', sourceText: 'Bonjour' }), /different languages/);
});
test('student lookup always scopes to the authenticated customer', async () => {
  let query;
  const service = new Service({ translationRequest: { findFirst: async args => { query = args; return null; } } }, {});
  await assert.rejects(() => service.findMine('student-1', 'another-request'), /not found/);
  assert.deepEqual(plain(query.where), { id: 'another-request', customerId: 'student-1' });
});
function replyService({ request = { sourceText: 'Hello' }, count = 1 } = {}) {
  const calls = {};
  const tx = { translationRequest: {
    findUnique: async () => request,
    updateMany: async args => { calls.update = args; return { count }; },
  }, auditLog: { create: async args => { calls.audit = args; } } };
  return { service: new Service({ $transaction: async callback => callback(tx) }, {}), calls };
}
test('reply atomically completes pending request and records the administrator', async () => {
  const { service, calls } = replyService();
  await service.reply('r1', 'admin-1', { translatedText: 'Bonjour' });
  assert.deepEqual(plain(calls.update.where), { id: 'r1', status: 'REQUESTED' });
  assert.equal(calls.update.data.status, 'COMPLETED');
  assert.equal(calls.update.data.translatedText, 'Bonjour');
  assert.equal(calls.update.data.repliedById, 'admin-1');
  assert.equal(calls.audit.data.actorUserId, 'admin-1');
});
test('duplicate or cancelled replies are rejected without an audit success', async () => {
  const { service, calls } = replyService({ count: 0 });
  await assert.rejects(() => service.reply('r1', 'admin-1', { translatedText: 'Bonjour' }), /already been answered/);
  assert.equal(calls.audit, undefined);
});
test('legacy requests without source text cannot be answered', async () => {
  const { service, calls } = replyService({ request: { sourceText: null } });
  await assert.rejects(() => service.reply('r1', 'admin-1', { translatedText: 'Bonjour' }), /no source text/);
  assert.equal(calls.update, undefined);
});
test('missing requests return not found', async () => {
  const { service } = replyService({ request: null });
  await assert.rejects(() => service.reply('r1', 'admin-1', { translatedText: 'Bonjour' }), /not found/);
});
test('old instant endpoint never calls an external translation provider', () => {
  assert.throws(() => new Service({}, {}).translateText({ text: 'Hello' }), /replaced/);
});
