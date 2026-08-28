import admin from "firebase-admin";
import { getAdminApp } from "../../src/services/firebaseAdmin.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    getAdminApp(); // Initialize Firebase Admin SDK if not already done
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const tenantSlug = req.body.tenantSlug || req.query.tenantSlug;

    if (!tenantSlug) {
      return res.status(400).json({ error: "Missing target tenantSlug" });
    }

    console.log(`[Vercel SSO API] Creating custom token for UID: ${uid} targeting: ${tenantSlug}`);
    const customToken = await admin.auth().createCustomToken(uid);

    const host = req.headers.host || 'app.tripbone.com';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';

    let targetHost = host;
    if (host.includes('app.localhost')) {
      targetHost = host.replace('app.localhost', `${tenantSlug}.localhost`);
    } else if (host.includes('localhost')) {
      targetHost = host.replace('localhost', `${tenantSlug}.localhost`);
    } else if (host.includes('app.')) {
      targetHost = host.replace('app.', `${tenantSlug}.`);
    } else {
      targetHost = `${tenantSlug}.${host}`;
    }

    const ssoUrl = `${protocol}://${targetHost}/login?token=${customToken}&redirect=/admin`;
    return res.status(200).json({ success: true, url: ssoUrl });
  } catch (error: any) {
    console.error("[Vercel SSO Custom Token Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to generate SSO redirect URL" });
  }
}
