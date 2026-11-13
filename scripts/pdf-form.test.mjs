#!/usr/bin/env node
/**
 * scripts/pdf-form.test.mjs — round-trips public/pdf-form.js through Node.
 *
 *   node scripts/pdf-form.test.mjs
 *
 * The builder is pure string code, so it runs outside the browser: this test
 * generates a PDF from realistic Portuguese form rows and validates it with
 * the system tools (`pdfinfo`, `pdftotext`, `mutool`), plus the byte-level
 * invariants the file must keep (latin1 bytes = string lengths, xref offsets
 * byte-exact, /Length exact). The DOM half (collectFields + the download)
 * is covered by the form checks in scripts/verify.mjs against a real page.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const src = readFileSync(new URL('../public/pdf-form.js', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} }, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const { buildPdf, wrap } = sandbox.module.exports;

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

/* Realistic MemberForm rows: accents, typographic punctuation, €, a
   multi-line note and enough rows to force a second page. */
const rows = [
  { label: 'Nome completo', value: 'José Ávila Conceição' },
  { label: 'Data de nascimento', value: '2005-03-14' },
  { label: 'Email', value: 'jose@example.com' },
  { label: 'Como nos conheceste', value: 'Num evento' },
  { label: 'Tipo de sócio', value: 'Estudante' },
  { label: 'Departamentos de interesse', value: 'Direção, Comunicação e Imagem' },
  {
    label: 'Notas',
    value: 'Gosto de robótica — “muito”.\nTambém de orçamentos de 100 €\ne de prazos… impossíveis.',
  },
  { label: 'Li e aceito a política de privacidade. Os dados usam-se só para gerir a adesão.', value: 'X' },
];
for (let i = 1; i <= 20; i++) rows.push({ label: `Campo ${i}`, value: `Valor de exemplo ${i} — com pontuação “tipográfica” e um €.` });

const title = 'Candidatura de adesão — Associação Plink';
const bytes = buildPdf(title, rows);
const s = Buffer.from(bytes).toString('latin1');

check('bytes are latin1 (round-trip is byte-exact)',
  Buffer.from(s, 'latin1').equals(Buffer.from(bytes)));
check('starts with %PDF-1.4', s.startsWith('%PDF-1.4'));
check('ends with %%EOF', s.trimEnd().endsWith('%%EOF'));

/* xref offsets must land byte-exactly on each "N 0 obj". */
const xrefPos = Number(s.match(/startxref\n(\d+)\n%%EOF/)?.[1]);
check('startxref points at the xref table', s.startsWith('xref', xrefPos), `offset ${xrefPos}`);
const xrefBody = s.slice(xrefPos).split('trailer')[0].split('\n').slice(2).filter(Boolean);
const objs = [...s.matchAll(/(\d+) 0 obj/g)].map((m) => Number(m[1]));
let xrefOk = xrefBody.length === objs.length + 1;
for (let i = 1; i < xrefBody.length && xrefOk; i++) {
  const off = Number(xrefBody[i].slice(0, 10));
  xrefOk = s.startsWith(`${objs[i - 1]} 0 obj`, off);
}
check('xref offsets land on every object', xrefOk, `${xrefBody.length} entries`);

/* /Length must equal the byte length of its stream. */
let lengthsOk = true;
for (const m of s.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
  if (Number(m[1]) !== m[2].length) lengthsOk = false;
}
check('stream /Length values are byte-exact', lengthsOk);

/* wrap: no line overflows its budget; long words get cut. */
const w = wrap('Uma palavra absurdamentelooooooooongaaaaaaaaaaaaaaaaaaaaaaaa aqui', 11, 100);
check('wrap hard-breaks words that overflow', w.every((l) => l.length <= 22), JSON.stringify(w));

/* Round-trip through the system PDF tools. */
const dir = mkdtempSync(join(tmpdir(), 'pdf-form-test-'));
const file = join(dir, 'form.pdf');
writeFileSync(file, bytes);

try {
  const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  const pages = Number(info.match(/Pages:\s+(\d+)/)?.[1]);
  check('pdfinfo: valid PDF, pagination works', pages >= 2, `${pages} pages`);

  const text = execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' });
  for (const [name, needle] of [
    ['title survives', title],
    ['accents survive', 'José Ávila Conceição'],
    ['em dash + curly quotes survive (WinAnsi 0x91–0x97)', 'robótica — “muito”'],
    ['euro survives (WinAnsi 0x80)', '100 €'],
    ['multi-line note survives', 'prazos… impossíveis'],
    ['field labels survive', 'Como nos conheceste'],
  ]) {
    check(`pdftotext: ${name}`, text.includes(needle), JSON.stringify(needle).slice(0, 60));
  }

  execFileSync('mutool', ['info', file], { stdio: 'pipe' });
  check('mutool: file parses clean', true);
} catch (err) {
  check(`pdf tools: ${err.message.split('\n')[0]}`, false);
}

rmSync(dir, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed.` : '\nAll pdf-form checks passed.');
process.exit(failures ? 1 : 0);
