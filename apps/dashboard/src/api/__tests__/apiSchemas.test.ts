import { describe, it, expect } from 'vitest';
import { GroupSchema, MessageSchema, GroupsArraySchema } from '../Groups.api';
import { AppointmentSchema, AppointmentsArraySchema, UserDashboardDataSchema } from '../Appointments.api';

describe('Groups.api Zod Schemas', () => {
  it('parses a valid group object and fills defaults for missing optional values', () => {
    const raw = {
      _id: 'g-123',
      name: 'Anxiety Support',
      // missing description and image
    };

    const parsed = GroupSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data._id).toBe('g-123');
      expect(parsed.data.name).toBe('Anxiety Support');
      expect(parsed.data.description).toBe('');
      expect(parsed.data.image).toBe('');
    }
  });

  it('rejects a group missing required _id', () => {
    const raw = {
      name: 'No ID Group',
    };
    const parsed = GroupSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it('parses message arrays cleanly', () => {
    const rawMessages = [
      {
        _id: 'm1',
        content: 'Test message',
        createdAt: '2026-10-31T12:00:00Z',
        userId: 'u1',
      },
      {
        _id: 'm2',
        content: 'Populated user message',
        createdAt: '2026-10-31T12:01:00Z',
        userId: { _id: 'u2', name: 'User 2' },
      },
    ];
    const parsed1 = MessageSchema.safeParse(rawMessages[0]);
    expect(parsed1.success).toBe(true);
    if (parsed1.success) {
      expect(parsed1.data.userId).toBe('u1');
    }

    const parsed2 = MessageSchema.safeParse(rawMessages[1]);
    expect(parsed2.success).toBe(true);
    if (parsed2.success) {
      expect(parsed2.data.userId).toBe('u2');
    }
  });

  it('validates an array of groups', () => {
    const list = [
      { _id: 'g1', name: 'Group 1' },
      { _id: 'g2', name: 'Group 2' },
    ];
    const parsed = GroupsArraySchema.safeParse(list);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.length).toBe(2);
    }
  });
});

describe('Appointments.api Zod Schemas', () => {
  it('parses appointment data and applies safe defaults for action', () => {
    const raw = {
      bookingId: 'b-999',
      fullName: 'Dr. Jane Smith',
      // missing action
    };

    const parsed = AppointmentSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.bookingId).toBe('b-999');
      expect(parsed.data.status).toBe('upcoming');
      expect(parsed.data.action).toBeDefined();
    }
  });

  it('validates user dashboard data structure', () => {
    const rawDashboard = {
      walletBalance: 15000,
      totalSessions: 5,
      timeSpent: 250,
      amountPaid: 75000,
      upcomingAppointments: [
        {
          bookingId: 'b-1',
          fullName: 'Therapist John',
        },
      ],
    };

    const parsed = UserDashboardDataSchema.safeParse(rawDashboard);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.walletBalance).toBe(15000);
      expect(parsed.data.upcomingAppointments.length).toBe(1);
    }
  });

  it('parses empty array for upcoming appointments gracefully if empty', () => {
    const parsed = AppointmentsArraySchema.safeParse([]);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual([]);
    }
  });

  it('parses appointment with null profilePicture, action, and invoiceDownloadLink', () => {
    const raw = {
      bookingId: '6af558d71f5db0ec0657642f',
      userId: '6ae4b08037b3247c39a6a6d4',
      fullName: 'Favour Francis Asuk',
      profilePicture: null,
      date: '2026-11-15',
      time: '9:00 AM - 10:00 AM',
      type: 'Video Call',
      status: 'upcoming',
      chatId: '6af558d71f5db0ec0657642b',
      invoiceDownloadLink: null,
      action: null,
    };

    const parsed = AppointmentSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.profilePicture).toBe('');
      expect(parsed.data.invoiceDownloadLink).toBeNull();
      expect(parsed.data.action).toEqual({});
    }
  });

  it('parses group with null optional string fields', () => {
    const raw = {
      _id: 'g-null',
      name: null,
      description: null,
      image: null,
      createdAt: null,
    };

    const parsed = GroupSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('');
      expect(parsed.data.description).toBe('');
      expect(parsed.data.image).toBe('');
      expect(parsed.data.createdAt).toBe('');
    }
  });
});

