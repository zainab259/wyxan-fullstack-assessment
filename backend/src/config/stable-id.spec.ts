import { stableObjectId } from './stable-id';

describe('stable seed identifiers', () => {
  it('creates the same valid ObjectId for the same seed key', () => {
    const first = stableObjectId('site:nature.zz');
    const second = stableObjectId('site:nature.zz');
    expect(first.toHexString()).toBe(second.toHexString());
    expect(first.toHexString()).toMatch(/^[a-f0-9]{24}$/);
    expect(stableObjectId('site:science.zz').toHexString()).not.toBe(first.toHexString());
  });
});
