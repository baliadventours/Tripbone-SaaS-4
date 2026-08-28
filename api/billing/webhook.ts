import { getAdminApp, getAdminDb } from "../../src/services/firebaseAdmin.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;
    const eventType = event.type;
    const data = event.data || {};
    const metadata = data.metadata || event.metadata || {};
    const tenantId = metadata.tenantId;

    console.log(`[Vercel Billing Webhook] Received event: ${eventType} for Tenant: ${tenantId}`);

    if (!tenantId) {
      return res.status(400).json({ error: "No tenantId metadata found in payload" });
    }

    getAdminApp();
    const db = getAdminDb();

    let updatePayload: any = {};
    if (eventType === 'subscription.active') {
      updatePayload = {
        status: 'active',
        subscriptionId: data.id || null,
        plan: data.plan_id || data.product_id || 'growth',
        updatedAt: new Date().toISOString()
      };
    } else if (eventType === 'subscription.canceled' || eventType === 'subscription.expired') {
      updatePayload = {
        status: 'suspended',
        updatedAt: new Date().toISOString()
      };
    } else if (eventType === 'subscription.past_due') {
      updatePayload = {
        status: 'past_due',
        updatedAt: new Date().toISOString()
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.collection('tenants').doc(tenantId).update(updatePayload);
      console.log(`[Vercel Billing Webhook] Updated Firestore tenant ${tenantId} to status: ${updatePayload.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[Vercel Billing Webhook Error]:", error);
    return res.status(500).json({ error: error.message || "Webhook processing failed" });
  }
}
