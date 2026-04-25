import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mergeConfig } from '../../src/config/defaults.ts';

describe('mergeConfig - animation duration resolution', () => {

  let warnMessages: string[] = [];
  const originalWarn = console.warn;

  before(() => {
    console.warn = (msg: string) => { warnMessages.push(msg); };
  });

  after(() => {
    console.warn = originalWarn;
  });

  beforeEach(() => {
    warnMessages = [];
  });

  it('uses animation.duration when explicitly provided', () => {
    const config = mergeConfig({ animation: { duration: 1200 } });
    assert.equal(config.animation.duration, 1200);
    assert.equal(config.animation.entry!.timing.duration, 1200); // synced
    assert.equal(warnMessages.length, 0); // no deprecation warn
  });

  it('defaults to 600ms when neither duration is provided', () => {
    const config = mergeConfig({});
    assert.equal(config.animation.duration, 600);
    assert.equal(config.animation.entry!.timing.duration, 600);
    assert.equal(warnMessages.length, 0);
  });

  it('uses entry timing duration as fallback (deprecated path) and warns', () => {
    const config = mergeConfig({ animation: { entry: { timing: { duration: 900 } } } });
    assert.equal(config.animation.duration, 900);
    assert.equal(config.animation.entry!.timing.duration, 900); // synced
    assert.equal(warnMessages.length, 1);
    assert.ok(warnMessages[0].includes('deprecated'));
    assert.ok(warnMessages[0].includes('v1.2'));
  });

  it('animation.duration wins over entry timing when both provided', () => {
    const config = mergeConfig({ animation: { duration: 800, entry: { timing: { duration: 1200 } } } });
    assert.equal(config.animation.duration, 800);
    assert.equal(config.animation.entry!.timing.duration, 800); // synced to winner
    assert.equal(warnMessages.length, 0); // no warn when base duration provided
  });

});
