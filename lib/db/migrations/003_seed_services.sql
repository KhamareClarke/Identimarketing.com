-- =====================================================================
-- Identimarketing SaaS - 003_seed_services.sql
-- Seeds the services catalog so project creation has dropdown options.
-- Safe to re-run (uses on conflict do nothing on slug).
-- =====================================================================

insert into public.services (slug, name, description, price_base, deliverables, timeline_weeks, featured)
values
  ('seo', 'SEO Services', 'Comprehensive SEO including technical audit, keyword research, on-page optimization, and link building.',
    2500,
    '["Technical SEO audit","Keyword research","On-page optimization","Backlink strategy","Monthly performance report"]'::jsonb,
    12, true),

  ('content-marketing', 'Content Marketing', 'Editorial strategy, blog production, and content distribution to drive organic traffic.',
    1800,
    '["Content strategy","8 blog posts/month","Editorial calendar","Distribution plan","Analytics report"]'::jsonb,
    8, true),

  ('paid-ads', 'Paid Advertising', 'Google Ads, Meta Ads, LinkedIn Ads - campaign setup, creative, and ongoing optimization.',
    3500,
    '["Account setup","Creative production","Audience targeting","Weekly optimization","Conversion tracking"]'::jsonb,
    4, true),

  ('social-media', 'Social Media Management', 'Multi-platform social media planning, content creation, scheduling, and community management.',
    1500,
    '["Content calendar","Daily posting","Community management","Analytics & reporting"]'::jsonb,
    12, false),

  ('web-design', 'Web Design & Development', 'Custom website design and build on a modern stack with CMS, performance, and SEO baked in.',
    7500,
    '["Discovery & wireframes","UI/UX design","Frontend development","CMS integration","Launch & training"]'::jsonb,
    8, true),

  ('brand-identity', 'Brand Identity', 'Logo, visual system, brand guidelines, and brand voice for new or refreshed brands.',
    4500,
    '["Brand discovery","Logo design","Visual identity system","Brand guidelines PDF","Asset pack"]'::jsonb,
    6, false),

  ('email-marketing', 'Email Marketing', 'Lifecycle email programs, automation flows, and broadcast campaigns.',
    1200,
    '["Lifecycle audit","Automation flows","Weekly campaigns","List growth strategy","Analytics report"]'::jsonb,
    4, false),

  ('cro', 'Conversion Rate Optimization', 'Analytics review, hypothesis-driven testing, and on-page CRO to lift conversion rates.',
    2800,
    '["Analytics audit","User testing","A/B test roadmap","Implementation","Monthly results report"]'::jsonb,
    8, false),

  ('ai-automation', 'AI & Automation', 'AI chatbots, workflow automations, and lead-capture systems powered by modern LLMs.',
    5000,
    '["Discovery workshop","Chatbot build","Workflow automations","Integrations","Training & handover"]'::jsonb,
    6, true),

  ('analytics', 'Analytics & Reporting', 'GA4, GTM, server-side tracking, and custom dashboards for clear marketing measurement.',
    1800,
    '["Tracking audit","GA4/GTM setup","Custom dashboards","Attribution model","Monthly insights"]'::jsonb,
    4, false)
on conflict (slug) do nothing;
