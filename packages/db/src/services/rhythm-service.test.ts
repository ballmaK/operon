import { describe, expect, it } from 'vitest';
import { shouldRunDailyReview, shouldRunWeeklyReview } from './rhythm-service.js';

describe('rhythm scheduler helpers', () => {
  it('matches daily time', () => {
    const at = new Date('2026-07-05T09:00:00');
    expect(shouldRunDailyReview({ dailyTime: '09:00', timezone: 'UTC' }, at)).toBe(true);
    expect(shouldRunDailyReview({ dailyTime: '10:00', timezone: 'UTC' }, at)).toBe(false);
  });

  it('matches weekly day', () => {
    const sunday = new Date('2026-07-05T09:00:00');
    expect(
      shouldRunWeeklyReview({ weeklyDay: 'sun', dailyTime: '09:00' }, sunday),
    ).toBe(true);
  });
});
