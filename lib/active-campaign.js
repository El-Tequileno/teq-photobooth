const TAG = "photobooth";

export function activeCampaignConfig() {
  const rawUrl = process.env.ACTIVECAMPAIGN_API_URL?.trim();
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY?.trim();
  if (!rawUrl || !apiKey) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
        !["", "/", "/api/3", "/api/3/"].includes(url.pathname)) return null;
    const rawListId = process.env.ACTIVECAMPAIGN_MARKETING_LIST_ID?.trim() || "";
    return {
      apiUrl: `${url.origin}/api/3`,
      apiKey,
      listId: /^[1-9]\d*$/.test(rawListId) ? rawListId : null,
    };
  } catch {
    return null;
  }
}

async function request(config, path, options = {}) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers: {
      "Api-Token": config.apiKey,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`ActiveCampaign ${path} returned ${response.status}`);
  return response.json();
}

export async function savePhotoContact(config, { email, name, marketingOptIn }) {
  const data = await request(config, "/contact/sync", {
    method: "POST",
    body: JSON.stringify({ contact: { email, firstName: name, tags: [TAG] } }),
  });
  const contactId = String(data.contact?.id || "");
  if (!/^[1-9]\d*$/.test(contactId)) throw new Error("ActiveCampaign did not return a contact id");
  if (!marketingOptIn) return { contactSaved: true, marketingSubscribed: false };
  if (!config.listId) throw new Error("Marketing list is not configured");

  const memberships = await request(config, `/contacts/${contactId}/contactLists`);
  const current = memberships.contactLists?.find(item => String(item.list) === config.listId);
  if (current?.status === "1" || current?.status === 1) {
    return { contactSaved: true, marketingSubscribed: true };
  }
  // A kiosk entry must not undo an earlier unsubscribe or bounce.
  if (current) return { contactSaved: true, marketingSubscribed: false };

  await request(config, "/contactLists", {
    method: "POST",
    body: JSON.stringify({ contactList: { contact: contactId, list: config.listId, status: "1" } }),
  });
  return { contactSaved: true, marketingSubscribed: true };
}
