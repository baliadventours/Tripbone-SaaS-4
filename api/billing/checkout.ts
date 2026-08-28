import { createCreemCheckoutSession } from "../../src/services/creemService.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { productId, successUrl, email, tenantId } = req.body;
    if (!productId || !successUrl || !email || !tenantId) {
      return res.status(400).json({ error: "Missing required parameters (productId, successUrl, email, tenantId)" });
    }

    console.log(`[Vercel Billing API] Creating checkout for tenant: ${tenantId}, product: ${productId}`);
    const data = await createCreemCheckoutSession({
      productId,
      successUrl,
      email,
      tenantId
    });

    return res.status(200).json({ url: data.checkout_url || data.url });
  } catch (error: any) {
    console.error("[Vercel Billing Checkout Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to generate checkout link" });
  }
}
