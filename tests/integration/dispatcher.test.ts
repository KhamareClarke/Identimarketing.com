/**
 * Integration test for the notifications dispatcher with mocked Supabase
 * and side-channel modules. We exercise the channel-routing logic - i.e.
 * that user preferences gate email/SMS correctly and that the in-app row
 * is always persisted.
 */

import type { DispatchReport } from '@/lib/notifications/dispatcher';

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------
const fakeProfile = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  phone: '+447700900123',
  ghl_contact_id: null,
} as Record<string, unknown>;

let fakePrefs: Record<string, unknown> | null = {
  user_id: 'user-1',
  email_enabled: true,
  sms_enabled: true,
  in_app_enabled: true,
  category_channels: {
    project: { email: true, sms: false, in_app: true },
    team: { email: true, sms: false, in_app: true },
    performance: { email: true, sms: false, in_app: true },
    billing: { email: true, sms: true, in_app: true },
    system: { email: true, sms: false, in_app: true },
    empire_os: { email: false, sms: false, in_app: true },
  },
  quiet_hours_start: null,
  quiet_hours_end: null,
  daily_digest: false,
  weekly_summary: true,
};

let insertedNotification: Record<string, unknown> | null = null;

function makeQueryBuilder(table: string): Record<string, (...args: any[]) => any> {
  // Tracks all the chained .eq() / .select() / .maybeSingle() / .insert() etc.
  const builder: Record<string, (...args: any[]) => any> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.in = () => builder;
  builder.maybeSingle = () => {
    if (table === 'profiles') return Promise.resolve({ data: fakeProfile, error: null });
    if (table === 'notification_preferences')
      return Promise.resolve({ data: fakePrefs, error: null });
    return Promise.resolve({ data: null, error: null });
  };
  builder.single = () => {
    if (table === 'notifications' && insertedNotification) {
      return Promise.resolve({ data: insertedNotification, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  };
  builder.insert = (payload: Record<string, unknown>) => {
    if (table === 'notifications') {
      insertedNotification = {
        id: 'notification-1',
        ...payload,
        sent_at: new Date().toISOString(),
        is_read: false,
        read_at: null,
        deleted_at: null,
        email_status: null,
        sms_status: null,
        email_error: null,
        sms_error: null,
        ghl_message_id: null,
        meta: {},
        data: payload.data ?? {},
      };
    }
    return builder;
  };
  builder.update = () => builder;
  return builder;
}

const fakeSupabase = {
  from: (table: string) => makeQueryBuilder(table),
};

jest.mock('@/lib/db/client', () => ({
  createServiceClient: () => fakeSupabase,
  __esModule: true,
}));

const sendMailMock = jest.fn(async () => ({ success: true, messageId: 'msg-1' }));
jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendMail: jest.fn(async (...args: any[]) => sendMailMock(...(args as []))),
}));

const sendGHLSmsMock = jest.fn(async () => ({ ok: true, messageId: 'sms-1', contactId: 'ghl-1' }));
jest.mock('@/lib/integrations/ghl', () => ({
  __esModule: true,
  sendGHLSms: jest.fn(async (...args: any[]) => sendGHLSmsMock(...(args as []))),
}));

// Has to come after the mocks so the module under test picks them up.
import { sendNotification } from '@/lib/notifications/dispatcher';

beforeEach(() => {
  insertedNotification = null;
  sendMailMock.mockClear();
  sendGHLSmsMock.mockClear();
});

describe('sendNotification', () => {
  it('inserts in-app + dispatches email when preferences allow it', async () => {
    fakePrefs = {
      ...(fakePrefs as Record<string, unknown>),
      email_enabled: true,
      sms_enabled: false,
    };

    const report: DispatchReport = await sendNotification({
      userId: 'user-1',
      type: 'project.created',
      category: 'project',
      title: 'New project created',
      message: 'Acme Corp',
    });

    expect(report.delivered.in_app).toBe(true);
    expect(report.delivered.email).toBe('sent');
    expect(report.delivered.sms).toBe(null);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendGHLSmsMock).not.toHaveBeenCalled();
    expect(insertedNotification).not.toBeNull();
    expect((insertedNotification as Record<string, unknown>).title).toBe('New project created');
  });

  it('respects the user disabling email globally', async () => {
    fakePrefs = {
      ...(fakePrefs as Record<string, unknown>),
      email_enabled: false,
      sms_enabled: false,
    };

    const report = await sendNotification({
      userId: 'user-1',
      type: 'project.created',
      category: 'project',
      title: 'Quiet',
      message: 'no email please',
    });
    expect(report.delivered.email).toBe(null);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('forces email through even when preferences would skip it', async () => {
    fakePrefs = {
      ...(fakePrefs as Record<string, unknown>),
      email_enabled: false,
    };

    const report = await sendNotification({
      userId: 'user-1',
      type: 'billing.payment_failed',
      category: 'billing',
      priority: 'urgent',
      title: 'Payment failed',
      message: 'Card declined.',
      forceEmail: true,
    });
    expect(report.delivered.email).toBe('sent');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it('routes SMS via GHL when category prefs include sms and user has a phone', async () => {
    fakePrefs = {
      ...(fakePrefs as Record<string, unknown>),
      email_enabled: false,
      sms_enabled: true,
    };

    const report = await sendNotification({
      userId: 'user-1',
      type: 'billing.payment_failed',
      category: 'billing',
      title: 'Payment failed',
      message: 'Card declined.',
    });
    expect(report.delivered.sms).toBe('sent');
    expect(sendGHLSmsMock).toHaveBeenCalledTimes(1);
  });
});
