import { module, test } from 'qunit';
import {
  GUARD_NAMES,
  GUARD_VALUES,
  guardLoops,
} from 'client-v2/audio/loop-guard';

/** Runs a script body that may `return` a value, guarded. */
function run(code: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const f = new Function(...GUARD_NAMES, guardLoops(code)) as (
    ...args: unknown[]
  ) => unknown;
  return f(...GUARD_VALUES);
}

module('Unit | audio | loop guard', function () {
  test('every kind of loop still does its work', function (assert) {
    assert.strictEqual(
      run('let n = 0; while (n < 5) n++; return n;'),
      5,
      'while, single statement',
    );
    assert.strictEqual(
      run('let n = 0; do { n += 2; } while (n < 7); return n;'),
      8,
      'do while',
    );
    assert.strictEqual(
      run('let s = 0; for (let i = 0; i < 4; i++) s += i; return s;'),
      6,
      'for',
    );
    assert.strictEqual(
      run('let k = ""; for (const x in { a: 1, b: 2 }) k += x; return k;'),
      'ab',
      'for in',
    );
    assert.strictEqual(
      run('let s = 0; for (const x of [1, 2, 3]) { s += x; } return s;'),
      6,
      'for of',
    );
  });

  test('every loop is instrumented, nested ones too', function (assert) {
    const out = guardLoops(
      'while (a) { for (;;) {} } do x(); while (b); for (const k in o) y(); for (const v of w) z();',
    );
    assert.strictEqual(out.match(/__lgCheck\(/g)!.length, 5);
    assert.strictEqual(
      run(
        'let c = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) c++; return c;',
      ),
      12,
      'nested single-statement bodies',
    );
  });

  test('labelled loops keep break and continue', function (assert) {
    assert.strictEqual(
      run(`let c = 0;
        outer: for (let i = 0; i < 5; i++) {
          inner: for (let j = 0; j < 5; j++) {
            if (j === 2) continue outer;
            if (i === 3) break outer;
            c++;
          }
        }
        return c;`),
      6,
    );
  });

  test('loops inside functions and arrow callbacks', function (assert) {
    assert.strictEqual(
      run(`function f(n) { let s = 0; while (n--) s++; return s; }
        const g = (n) => { for (let i = 0; i < n; i++) {} return n; };
        return f(3) + [1, 2].map((n) => { let t = 0; do { t++; } while (t < n); return t; }).join('') + g(2);`),
      '3122',
    );
  });

  test('text that only looks like a loop is left alone', function (assert) {
    const code =
      'const s = "while (true) {}"; // for (;;) {}\n/* do { } while (1) */ return s + `for`;';
    assert.strictEqual(guardLoops(code), code, 'unchanged');
    assert.strictEqual(run(code), 'while (true) {}for');
  });

  test('line numbers are kept: no line is added, and the message names the loop line', function (assert) {
    const code = 'let a = 1;\n\n  while (a)\n    a++;\nfor (;;) {\n}\n';
    const out = guardLoops(code);
    assert.strictEqual(out.split('\n').length, code.split('\n').length);
    const lines = out.split('\n');
    assert.true(lines[2]!.includes('while (a)'), 'still on line 3');
    assert.true(lines[4]!.includes('for (;;)'), 'still on line 5');

    const thrown = (() => {
      try {
        run('let x = 0;\n// a comment\nwhile (true) {\n x++;\n}');
      } catch (error) {
        return error as Error;
      }
      return null;
    })();
    assert.true(/line 3\)/.test(thrown?.message ?? ''), thrown?.message);
  });

  test('a script that does not parse is returned as it is', function (assert) {
    const code = 'while (true) {';
    assert.strictEqual(guardLoops(code), code);
  });

  test('a long but finite loop is not stopped', function (assert) {
    assert.strictEqual(
      run('let n = 0; for (let i = 0; i < 100000; i++) { n += 1; } return n;'),
      100000,
    );
  });

  test('an endless loop is stopped in about a second', function (assert) {
    const before = performance.now();
    assert.throws(
      () => run('let n = 0; while (true) { n++; }'),
      /ran for more than a second and was stopped \(line 1\)/,
    );
    const took = performance.now() - before;
    assert.true(took >= 900, `took ${Math.round(took)} ms`);
    assert.true(took < 3000, `took ${Math.round(took)} ms`);
  });
});
