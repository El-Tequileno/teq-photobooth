import { activeCampaignConfig } from "../../../lib/active-campaign";
import { json } from "../../../lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const config = activeCampaignConfig();
  return json({ marketingEnabled: Boolean(config?.listId) });
}
