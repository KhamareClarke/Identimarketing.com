import { renderEmail, renderSms } from '@/lib/notifications/templates';

describe('renderEmail', () => {
  it('produces subject + html + text with the title', () => {
    const out = renderEmail({
      type: 'project.created',
      title: 'New project created',
      message: 'Acme Corp - SEO Q1',
    });
    expect(out.subject).toMatch(/New project created/);
    expect(out.html).toMatch(/New project created/);
    expect(out.text).toMatch(/Acme Corp - SEO Q1/);
  });

  it('escapes HTML in user content', () => {
    const out = renderEmail({
      type: 'system.alert',
      title: '<script>alert(1)</script>',
      message: null,
    });
    expect(out.html).not.toContain('<script>');
    expect(out.html).toContain('&lt;script&gt;');
  });

  it('renders an action button when action_url is set', () => {
    const out = renderEmail({
      type: 'project.created',
      title: 'New project',
      message: null,
      action_url: '/dashboard/projects/abc',
      action_label: 'Open',
    });
    expect(out.html).toMatch(/Open/);
    expect(out.html).toMatch(/dashboard\/projects\/abc/);
  });
});

describe('renderSms', () => {
  it('joins title + message + url with delimiters', () => {
    const out = renderSms({
      type: 'deliverable.due_soon',
      title: 'Due in 4h',
      message: 'Hero copy revisions',
      action_url: '/dashboard/projects/abc/deliverables',
    });
    expect(out.text).toMatch(/Due in 4h/);
    expect(out.text).toMatch(/Hero copy revisions/);
    expect(out.text.length).toBeLessThanOrEqual(320);
  });

  it('truncates very long messages to <= 320 chars', () => {
    const long = 'a'.repeat(1000);
    const out = renderSms({ type: 'x', title: long, message: long });
    expect(out.text.length).toBeLessThanOrEqual(320);
  });
});
