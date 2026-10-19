import assert from "node:assert/strict";
import test from "node:test";
import { activeCampaignConfig, savePhotoContact } from "../lib/active-campaign.js";
import { parsePhotoMailForm } from "../lib/photo-mail.js";

test("contact capture and marketing consent stay separate", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const originalKey = process.env.ACTIVECAMPAIGN_API_KEY;
  const originalList = process.env.ACTIVECAMPAIGN_MARKETING_LIST_ID;
  try {
    process.env.ACTIVECAMPAIGN_API_URL = "https://example.api-us1.com";
    process.env.ACTIVECAMPAIGN_API_KEY = "test-only";
    delete process.env.ACTIVECAMPAIGN_MARKETING_LIST_ID;
    const config = activeCampaignConfig();
    assert.equal(config.listId, null);

    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
      return Response.json({ contact: { id: "42" } });
    };
    assert.deepEqual(await savePhotoContact(config, { email: "guest@example.com", name: "Ana López", marketingOptIn: false }),
      { contactSaved: true, marketingSubscribed: false });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://example.api-us1.com/api/3/contact/sync");
    assert.deepEqual(calls[0].body, { contact: { email: "guest@example.com", firstName: "Ana López", tags: ["photobooth"] } });

    process.env.ACTIVECAMPAIGN_MARKETING_LIST_ID = "7";
    const withList = activeCampaignConfig();
    calls.length = 0;
    globalThis.fetch = async (url, options) => {
      calls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
      if (url.endsWith("/contact/sync")) return Response.json({ contact: { id: "42" } });
      if (url.endsWith("/contacts/42/contactLists")) return Response.json({ contactLists: [] });
      if (url.endsWith("/contactLists")) return Response.json({ contactList: { id: "99" } }, { status: 201 });
      throw new Error(`Unexpected URL ${url}`);
    };
    assert.deepEqual(await savePhotoContact(withList, { email: "guest@example.com", name: "Ana López", marketingOptIn: true }),
      { contactSaved: true, marketingSubscribed: true });
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[2].body, { contactList: { contact: "42", list: "7", status: "1" } });

    calls.length = 0;
    globalThis.fetch = async (url, options) => {
      calls.push({ url, method: options.method });
      if (url.endsWith("/contact/sync")) return Response.json({ contact: { id: "42" } });
      return Response.json({ contactLists: [{ list: "7", status: "2" }] });
    };
    assert.deepEqual(await savePhotoContact(withList, { email: "guest@example.com", name: "Ana López", marketingOptIn: true }),
      { contactSaved: true, marketingSubscribed: false });
    assert.equal(calls.length, 2, "previously unsubscribed contacts must not be re-subscribed");

    const form = new FormData();
    form.set("name", "  Ana   López  ");
    form.set("email", "GUEST@example.com");
    form.set("marketingOptIn", "false");
    form.set("language", "es");
    form.set("kind", "photo");
    form.set("requestId", "00000000-0000-4000-8000-000000000001");
    form.set("photo", new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }), "photo.jpg");
    assert.equal(parsePhotoMailForm(form).name, "Ana López");
    form.set("marketingOptIn", "yes");
    assert.equal(parsePhotoMailForm(form), null);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of [
      ["ACTIVECAMPAIGN_API_URL", originalUrl],
      ["ACTIVECAMPAIGN_API_KEY", originalKey],
      ["ACTIVECAMPAIGN_MARKETING_LIST_ID", originalList],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
