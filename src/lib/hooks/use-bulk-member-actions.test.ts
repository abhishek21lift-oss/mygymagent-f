import { parseBulkExport } from './use-bulk-member-actions';

describe('parseBulkExport', () => {
  it('preserves CSV quoting and returns the member shape consumed by bulk actions', () => {
    const result = parseBulkExport(
      'Member Code,First Name,Last Name\nM-001,"Doe, Jane","O""Connor"\n',
    );

    expect(result.total).toBe(1);
    expect(result.members[0]).toEqual({
      'Member Code': 'M-001',
      'First Name': '"Doe, Jane"',
      'Last Name': '"O""Connor"',
    });
  });

  it('returns an empty export for a header-only response', () => {
    expect(parseBulkExport('Member Code,First Name\n')).toEqual({
      members: [],
      total: 0,
    });
  });
});
