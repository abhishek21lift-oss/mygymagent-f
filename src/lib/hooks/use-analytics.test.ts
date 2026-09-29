import { readTrainerWorkload } from './use-analytics';

/**
 * `GET /analytics/trainers/workload` answers with an envelope, not a bare
 * list. The hook used to run the whole response through `asArray`, which
 * returns `[]` for anything that is not an array, so the Intelligence
 * screen showed "No trainers assigned" on every gym — no failed request,
 * no error state, nothing to notice. These cases pin the unwrapping and
 * the field names the screen actually renders.
 */
describe('readTrainerWorkload', () => {
  it('reads trainers out of the envelope', () => {
    const result = readTrainerWorkload({
      trainers: [
        {
          userId: 'u-1',
          firstName: 'Meera',
          lastName: 'Rao',
          assignedMemberCount: 24,
          workoutPlansAssignedLast30Days: 6,
          dietPlansAssignedLast30Days: 3,
        },
      ],
      notComputable: [],
    });

    expect(result.trainers).toHaveLength(1);
    expect(result.trainers[0].firstName).toBe('Meera');
    expect(result.trainers[0].assignedMemberCount).toBe(24);
  });

  it('does not treat the envelope itself as an empty list', () => {
    // The exact regression: a non-array response used to collapse to [].
    const result = readTrainerWorkload({
      trainers: [
        {
          userId: 'u-1',
          firstName: 'Meera',
          lastName: 'Rao',
          assignedMemberCount: 24,
          workoutPlansAssignedLast30Days: 6,
          dietPlansAssignedLast30Days: 3,
        },
      ],
      notComputable: [],
    });

    expect(result.trainers).not.toEqual([]);
  });

  it('keeps the notComputable reasons rather than dropping them', () => {
    // The backend declines to invent some figures. Showing them as an
    // empty list is honest; showing them as zero is not.
    const result = readTrainerWorkload({
      trainers: [],
      notComputable: [{ key: 'ptRevenue', reason: 'no PT session ledger' }],
    });

    expect(result.notComputable).toEqual([
      { key: 'ptRevenue', reason: 'no PT session ledger' },
    ]);
  });

  it('survives a null or undefined body', () => {
    expect(readTrainerWorkload(null)).toEqual({ trainers: [], notComputable: [] });
    expect(readTrainerWorkload(undefined)).toEqual({ trainers: [], notComputable: [] });
  });

  it('defaults the lists when the server omits them', () => {
    expect(readTrainerWorkload({})).toEqual({ trainers: [], notComputable: [] });
  });

  it('does not accept a bare array as if it were the envelope', () => {
    // If the endpoint ever changes shape again, this should be an obvious
    // empty state rather than a silently mis-rendered list.
    expect(readTrainerWorkload([{ userId: 'u-1' }])).toEqual({
      trainers: [],
      notComputable: [],
    });
  });
});
