#!/usr/bin/env node
/* eslint-disable no-console */
// =====================================================================
// scripts/send-ghl-sms.mjs
//
// One-shot CLI for sending an SMS via the Go High Level Conversations API.
// Reads credentials from env: GHL_API_KEY, GHL_LOCATION_ID.
//
// Usage:
//   node scripts/send-ghl-sms.mjs <e164-phone> "Your message here"
//
// Example:
//   node scripts/send-ghl-sms.mjs +447473255886 "Hello from Identimarketing"
// =====================================================================

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const VERSION_CONTACTS = '2021-07-28';
const VERSION_MESSAGES = '2021-04-15';

const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;

if (!apiKey || !locationId) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID env vars.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/send-ghl-sms.mjs <e164-phone> "<message>"');
  process.exit(1);
}

const phoneRaw = args[0];
const message = args.slice(1).join(' ');
const phone = phoneRaw.replace(/\s+/g, '');

if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
  console.error(`Phone "${phoneRaw}" is not valid E.164. Try e.g. +447700900000`);
  process.exit(1);
}

async function call(path, version, body) {
  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.message || `${path} failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

(async () => {
  console.log(`Upserting contact ${phone} in location ${locationId}...`);
  const upsert = await call('/contacts/upsert', VERSION_CONTACTS, {
    locationId,
    phone,
    source: 'Identimarketing CLI',
    tags: ['identimarketing-cli'],
  });
  const contactId = upsert?.contact?.id;
  if (!contactId) {
    console.error('Upsert returned no contact id:', JSON.stringify(upsert, null, 2));
    process.exit(1);
  }
  console.log(`Contact id: ${contactId}`);

  console.log(`Sending SMS (${message.length} chars)...`);
  const send = await call('/conversations/messages', VERSION_MESSAGES, {
    type: 'SMS',
    contactId,
    message,
  });
  console.log('Success:', JSON.stringify(send, null, 2));
})().catch((err) => {
  console.error('FAILED:', err.message);
  if (err.data) console.error('Response body:', JSON.stringify(err.data, null, 2));
  process.exit(1);
});
