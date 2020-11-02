const { getActionBadge } = require('../src/scenes/Actions/ActionRow');

describe('getActionBadge', () => {
  const now = 1595926034025; // Tue Jul 28 2020 10:47:14 GMT+0200 (CEST) = $2
  test('completed', () => {
    expect(getActionBadge(now)({ date: '2020-08-02', completedAt: 1595926034025 })).toBe('white');
  });
  test('is passed', () => {
    expect(getActionBadge(now)({ date: '2020-07-27', completedAt: null })).toBe('red');
  });
  test('is today', () => {
    expect(getActionBadge(now)({ date: '2020-07-28', completedAt: null })).toBe(
      'rgba(31, 138, 0, 0.75)'
    );
  });
  test('is tomorrow', () => {
    expect(getActionBadge(now)({ date: '2020-07-29', completedAt: null })).toBe(
      'rgba(254, 177, 0, 0.75)'
    );
  });
  describe('to come in less than three days', () => {
    test('in two days', () => {
      expect(getActionBadge(now)({ date: '2020-07-30', completedAt: null })).toBe('yellow');
    });
    test('in three days', () => {
      expect(getActionBadge(now)({ date: '2020-07-31', completedAt: null })).toBe('yellow');
    });
    test('in four days', () => {
      expect(getActionBadge(now)({ date: '2020-08-01', completedAt: null })).toBe(
        'rgba(0, 0, 255, 0.25)'
      );
    });
  });
  test('to come in more than three days', () => {
    expect(getActionBadge(now)({ date: '2020-08-02', completedAt: null })).toBe(
      'rgba(0, 0, 255, 0.25)'
    );
  });
});
