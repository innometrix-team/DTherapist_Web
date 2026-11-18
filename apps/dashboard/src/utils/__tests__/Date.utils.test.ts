import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatMessageDate, formatMessageTime, groupMessagesByDate } from '../Date.utils';
import type { IMessage } from '../../api/Groups.api';

describe('Date.utils - formatMessageDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats dates from today as "Today"', () => {
    expect(formatMessageDate('2026-10-31T08:30:00Z')).toBe('Today');
  });

  it('formats dates from yesterday as "Yesterday"', () => {
    expect(formatMessageDate('2026-10-30T22:15:00Z')).toBe('Yesterday');
  });

  it('formats older dates with full month, day and year', () => {
    expect(formatMessageDate('2026-05-15T10:00:00Z')).toBe('May 15, 2026');
  });
});

describe('Date.utils - formatMessageTime', () => {
  it('formats ISO timestamps into human readable 12-hour time', () => {
    const formatted = formatMessageTime('2026-10-31T14:30:00Z');
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });
});

describe('Date.utils - groupMessagesByDate', () => {
  it('groups multiple messages correctly by date buckets', () => {
    const mockMessages: IMessage[] = [
      {
        _id: '1',
        content: 'Hello today 1',
        createdAt: '2026-10-31T10:00:00Z',
        userId: 'u1',
      },
      {
        _id: '2',
        content: 'Hello today 2',
        createdAt: '2026-10-31T11:00:00Z',
        userId: 'u2',
      },
      {
        _id: '3',
        content: 'Hello older',
        createdAt: '2026-08-10T15:00:00Z',
        userId: 'u1',
      },
    ];

    const grouped = groupMessagesByDate(mockMessages);
    expect(grouped.length).toBe(2);
    expect(grouped[0].messages.length).toBe(2);
    expect(grouped[1].messages.length).toBe(1);
    expect(grouped[1].date).toBe('August 10, 2026');
  });

  it('returns empty array when given no messages', () => {
    expect(groupMessagesByDate([])).toEqual([]);
  });
});

