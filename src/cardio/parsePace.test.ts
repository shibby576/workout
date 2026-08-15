import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPaceInput, parsePaceInput } from './parsePace.js';

describe('pace entry', () => {
  it('accepts the canonical colon form', () => {
    assert.equal(parsePaceInput('7:45'), 465);
    assert.equal(parsePaceInput('10:30'), 630);
    assert.equal(parsePaceInput(' 8:00 '), 480);
  });

  // The bug: a mobile numeric keypad has no colon, so "745" was the only thing
  // that could be typed — and it was read as 745 seconds, i.e. 12:25/mi.
  it('reads keypad digits as minutes and seconds, not raw seconds', () => {
    assert.equal(parsePaceInput('745'), 465, '745 must mean 7:45');
    assert.equal(parsePaceInput('1045'), 645);
    assert.equal(parsePaceInput('800'), 480);
  });

  it('rejects impossible seconds', () => {
    assert.equal(parsePaceInput('790'), null); // 90 seconds
    assert.equal(parsePaceInput('7:90'), null);
  });

  it('rejects paces outside any plausible range', () => {
    assert.equal(parsePaceInput('100'), null); // 1:00/mi
    assert.equal(parsePaceInput('4500'), null); // 45:00/mi
    assert.equal(parsePaceInput('2:00'), null);
  });

  it('rejects junk rather than guessing', () => {
    for (const junk of ['', '  ', 'abc', '7', '74', '7:4', '7::45', '-745']) {
      assert.equal(parsePaceInput(junk), null, `should reject ${JSON.stringify(junk)}`);
    }
  });

  it('round-trips through the display form', () => {
    for (const sec of [465, 480, 630, 425]) {
      assert.equal(parsePaceInput(formatPaceInput(sec)), sec);
    }
  });
});
