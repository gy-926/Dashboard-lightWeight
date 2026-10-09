import { describe, expect, it } from 'vitest';
import { parseJsonParameters } from '../src/utils/json-parameters';

describe('JSON parameters', () => {
  it('preserves nested values and accepts an empty draft', () => {
    expect(parseJsonParameters('{"enabled":true,"filters":[1,2]}')).toEqual({
      enabled: true,
      filters: [1, 2],
    });
    expect(parseJsonParameters(' ')).toEqual({});
  });
  it('rejects malformed text and non-object values', () => {
    for (const text of ['{"unfinished":', 'null', '[]', 'true', '3', '"value"']) {
      expect(() => parseJsonParameters(text)).toThrow();
    }
  });
});
