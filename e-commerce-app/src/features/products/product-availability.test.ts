import { describe, expect, it } from 'vitest';
import { ApiError } from '../lib/api-client';
import { isConfirmedProductUnavailable } from './product-availability';

describe('isConfirmedProductUnavailable', () => {
  it('recognizes a confirmed not-found response', () => {
    expect(isConfirmedProductUnavailable(new ApiError('Not found', 404))).toBe(
      true,
    );
  });

  it.each([
    new ApiError('Server error', 500),
    new Error('Could not connect to the store API'),
  ])('does not treat other errors as confirmed unavailability', (error) => {
    expect(isConfirmedProductUnavailable(error)).toBe(false);
  });
});
