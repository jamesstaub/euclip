import { module, test } from 'qunit';
import {
  fitView,
  hitHandle,
  hitMarker,
  MIN_SPAN,
  nearestZeroCrossing,
  panBy,
  pinchView,
  rulerTicks,
  snapTo,
  tabBox,
  timeToX,
  viewOf,
  wholeView,
  xToTime,
  zoomAround,
  zoomOf,
  type Stage,
  type Tab,
} from 'client-v2/waveform/geometry';

const close = (a: number, b: number, tolerance = 1e-9): boolean =>
  Math.abs(a - b) <= tolerance;

module('Unit | Waveform | geometry', function () {
  test('a time is a place on screen and back, at any zoom', function (assert) {
    const whole = wholeView(4);
    assert.deepEqual(whole, { start: 0, end: 4 });
    assert.strictEqual(timeToX(whole, 800, 1), 200);
    assert.strictEqual(xToTime(whole, 800, 200), 1);

    const zoomed = { start: 1.5, end: 2 };
    assert.strictEqual(timeToX(zoomed, 800, 1.75), 400);
    assert.strictEqual(
      timeToX(zoomed, 800, 1),
      -800,
      'before the view: off to the left',
    );
    for (const view of [whole, zoomed, { start: 3.999, end: 4 }]) {
      for (const x of [0, 1, 333.3, 799, 800]) {
        assert.true(
          close(timeToX(view, 800, xToTime(view, 800, x)), x, 1e-6),
          `x ${x} in ${view.start}..${view.end}`,
        );
      }
    }
    assert.strictEqual(zoomOf(zoomed, 4), 8);
  });

  test('zooming keeps the moment under the pointer where it is, and stays inside the sound', function (assert) {
    const view = wholeView(4);
    const closer = zoomAround(view, 4, 2, 1);
    assert.true(close(closer.start, 0.5), JSON.stringify(closer));
    assert.true(close(closer.end, 2.5));
    assert.strictEqual(
      timeToX(closer, 800, 1),
      timeToX(view, 800, 1),
      'the anchor has not moved',
    );

    const again = zoomAround(closer, 4, 4, 2.4);
    assert.true(
      close(timeToX(again, 800, 2.4), timeToX(closer, 800, 2.4), 1e-6),
    );
    assert.true(close(again.end - again.start, 0.5));

    const out = zoomAround(closer, 4, 0.001, 1);
    assert.true(
      close(out.start, 0),
      `no further out than all of it (${JSON.stringify(out)})`,
    );
    assert.true(close(out.end, 4));
    const tiny = zoomAround(view, 4, 1e9, 3);
    assert.true(
      close(tiny.end - tiny.start, MIN_SPAN),
      'no closer than a few samples',
    );
    assert.true(tiny.start >= 0);
    assert.true(tiny.end <= 4);

    // near an edge the view is pushed back inside, rather than showing nothing
    const edge = zoomAround({ start: 3, end: 4 }, 4, 0.5, 3.9);
    assert.true(close(edge.start, 2), JSON.stringify(edge));
    assert.true(close(edge.end, 4));
  });

  test('scrolling, fitting, and looking at a stretch', function (assert) {
    assert.deepEqual(panBy({ start: 1, end: 2 }, 4, 0.5), {
      start: 1.5,
      end: 2.5,
    });
    assert.deepEqual(
      panBy({ start: 1, end: 2 }, 4, 10),
      { start: 3, end: 4 },
      'held at the end',
    );
    assert.deepEqual(panBy({ start: 1, end: 2 }, 4, -10), { start: 0, end: 1 });
    assert.deepEqual(fitView({ start: -1, end: 9 }, 4), { start: 0, end: 4 });
    const region = viewOf(1, 2, 4);
    assert.true(region.start < 1);
    assert.true(region.start > 0.8, 'a little room either side');
    assert.true(region.end > 2);
    assert.deepEqual(viewOf(0, 4, 4), { start: 0, end: 4 });
  });

  test('two fingers: the moments under them stay under them', function (assert) {
    const held = { view: wholeView(4), x1: 200, x2: 600 }; // on 1s and 3s
    const spread = pinchView(held, { x1: 100, x2: 700 }, 800, 4);
    assert.true(close(timeToX(spread, 800, 1), 100, 1e-6));
    assert.true(close(timeToX(spread, 800, 3), 700, 1e-6));
    assert.true(spread.end - spread.start < 4, 'spreading zooms in');

    const zoomedIn = { view: { start: 1, end: 3 }, x1: 200, x2: 600 }; // on 1.5s and 2.5s
    const moved = pinchView(zoomedIn, { x1: 300, x2: 700 }, 800, 4);
    assert.true(
      close(moved.end - moved.start, 2, 1e-9),
      'moving both scrolls without zooming',
    );
    assert.true(close(timeToX(moved, 800, 1.5), 300, 1e-6));

    const together = pinchView(zoomedIn, { x1: 400, x2: 402 }, 800, 4);
    assert.true(
      close(together.end - together.start, 2),
      'fingers together: no zoom to go on',
    );
    assert.deepEqual(
      pinchView(held, { x1: 390, x2: 410 }, 800, 4),
      { start: 0, end: 4 },
      'pinching in stops at the whole sound',
    );
  });

  module('handles', function () {
    const stage: Stage = { width: 800, top: 20, bottom: 220 };
    const mouse: Tab = { width: 22, height: 22 };
    const finger: Tab = { width: 44, height: 44 };
    const view = wholeView(4);

    test('each handle’s tab has a place of its own', function (assert) {
      assert.deepEqual(
        tabBox('start', 200, stage, mouse),
        { left: 200, top: 20, width: 22, height: 22 },
        'start: top, to the right of its line',
      );
      assert.deepEqual(
        tabBox('end', 200, stage, mouse),
        { left: 178, top: 20, width: 22, height: 22 },
        'end: top, to the left',
      );
      assert.deepEqual(
        tabBox('loopStart', 200, stage, mouse),
        { left: 200, top: 198, width: 22, height: 22 },
        'loop start: bottom, right',
      );
      assert.deepEqual(tabBox('loopEnd', 200, stage, mouse), {
        left: 178,
        top: 198,
        width: 22,
        height: 22,
      });
      assert.strictEqual(
        tabBox('end', 0, stage, finger).left,
        0,
        'kept on the stage at its edges',
      );
      assert.strictEqual(tabBox('start', 800, stage, finger).left, 756);
    });

    test('four handles at the same moment can each be taken', function (assert) {
      const times = { start: 1, end: 1, loopStart: 1, loopEnd: 1 }; // all at x = 200
      for (const tab of [mouse, finger]) {
        const half = tab.width / 2;
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 200 + half, 20 + half),
          'start',
        );
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 200 - half, 20 + half),
          'end',
        );
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 200 + half, 220 - half),
          'loopStart',
        );
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 200 - half, 220 - half),
          'loopEnd',
        );
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 200 + half, 120),
          null,
          'between the rows: the sound itself',
        );
        assert.strictEqual(
          hitHandle(times, view, stage, tab, 300, 20 + half),
          null,
        );
      }
    });

    test('tabs that overlap (points less than a tab apart): the nearer line wins', function (assert) {
      const times = { start: 1, end: 1.1 }; // x = 200 and 220, a 44px tab each: they share 200..220
      assert.strictEqual(
        hitHandle(times, view, stage, finger, 204, 40),
        'start',
      );
      assert.strictEqual(hitHandle(times, view, stage, finger, 216, 40), 'end');
      assert.strictEqual(
        hitHandle(times, view, stage, finger, 210, 40),
        'start',
        'exactly between: the earlier',
      );
      assert.strictEqual(
        hitHandle(times, view, stage, finger, 190, 40),
        'end',
        'outside the overlap there is only one',
      );
      assert.strictEqual(
        hitHandle(times, view, stage, finger, 240, 40),
        'start',
      );
    });

    test('a handle scrolled out of view cannot be taken; a loop handle that is not there neither', function (assert) {
      const zoomed = { start: 2, end: 3 };
      assert.strictEqual(
        hitHandle({ start: 1, end: 2.5 }, zoomed, stage, mouse, 5, 30),
        null,
      );
      assert.strictEqual(
        hitHandle({ start: 1, end: 2.5 }, zoomed, stage, mouse, 395, 30),
        'end',
      );
      assert.strictEqual(
        hitHandle({ start: 1 }, view, stage, mouse, 205, 210),
        null,
        'no loop handles given',
      );
    });

    test('slice flags are taken in the ruler, the nearest within reach, never the sound’s two ends', function (assert) {
      const slices = [0, 1, 1.05, 3, 4];
      assert.strictEqual(hitMarker(slices, view, 800, 201, 7), 1);
      assert.strictEqual(hitMarker(slices, view, 800, 208, 7), 2);
      assert.strictEqual(hitMarker(slices, view, 800, 400, 7), -1);
      assert.strictEqual(
        hitMarker(slices, view, 800, 2, 7),
        -1,
        'the start of the sound is not a boundary to move',
      );
      assert.strictEqual(hitMarker(slices, view, 800, 799, 7), -1);
      assert.strictEqual(
        hitMarker(slices, view, 800, 615, 22),
        3,
        'a finger reaches further',
      );
    });
  });

  test('snapping: to the nearest of some times, or the nearest zero crossing, within reach', function (assert) {
    assert.strictEqual(snapTo(1.02, [0, 1, 2], 0.05), 1);
    assert.strictEqual(
      snapTo(1.2, [0, 1, 2], 0.05),
      1.2,
      'out of reach: left alone',
    );
    assert.strictEqual(snapTo(1.5, [1, 2], 0.5), 2, 'a tie goes to the later');

    const rate = 1000;
    const samples = new Float32Array(1000);
    for (let i = 0; i < samples.length; i++)
      samples[i] = Math.sin((2 * Math.PI * 10 * i) / rate + 0.3);
    const crossing = nearestZeroCrossing(samples, rate, 0.26, 0.05);
    assert.true(
      Math.abs(crossing - 0.2455) < 0.002,
      `the rising crossing by 0.245 (${crossing})`,
    );
    const index = Math.round(crossing * rate);
    assert.true(
      samples[index - 1]! * samples[index]! <= 0,
      'the signal changes sign there',
    );
    assert.strictEqual(
      nearestZeroCrossing(samples, rate, 0.27, 0.001),
      0.27,
      'none in reach: left alone',
    );
    assert.strictEqual(
      nearestZeroCrossing(new Float32Array(100).fill(0.5), rate, 0.05, 0.02),
      0.05,
    );
  });

  test('the ruler: round numbers of the chosen unit, about one label every so many pixels', function (assert) {
    const labels = (ticks: { label: string | null }[]): (string | null)[] =>
      ticks.filter((tick) => tick.label !== null).map((tick) => tick.label);
    assert.deepEqual(labels(rulerTicks(wholeView(4), 400, 'seconds')), [
      '0 s',
      '1 s',
      '2 s',
      '3 s',
      '4 s',
    ]);
    assert.deepEqual(labels(rulerTicks({ start: 1, end: 1.2 }, 400, 'ms')), [
      '1000 ms',
      '1050 ms',
      '1100 ms',
      '1150 ms',
      '1200 ms',
    ]);
    assert.deepEqual(
      labels(rulerTicks(wholeView(4), 800, 'steps', 0.125, 100)),
      ['0', '5', '10', '15', '20', '25', '30'],
      'sixteenths at 120: the loop is 32 of them',
    );
    assert.deepEqual(
      labels(rulerTicks({ start: 0, end: 0.25 }, 400, 'steps', 0.125)),
      ['0', '0.5', '1', '1.5', '2'],
      'steps go by halves and quarters, not tenths',
    );
    assert.deepEqual(labels(rulerTicks(wholeView(4), 400, 'percent', 0.04)), [
      '0%',
      '20%',
      '40%',
      '60%',
      '80%',
      '100%',
    ]);
    const ticks = rulerTicks(wholeView(4), 400, 'seconds');
    assert.true(ticks.length > 5, 'with smaller ticks between');
    assert.true(
      ticks.every(
        (tick, index) => index === 0 || tick.time > ticks[index - 1]!.time,
      ),
    );
    assert.deepEqual(rulerTicks(wholeView(4), 0, 'seconds'), []);
  });
});
