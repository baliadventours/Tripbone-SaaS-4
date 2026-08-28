import { getAdminApp, getAdminDb } from "./src/services/firebaseAdmin.js";
import dotenv from "dotenv";
dotenv.config();
async function run() {
  getAdminApp();
  const db = getAdminDb();
  const snap = await db.collection('tenants').get();
  snap.forEach(doc => {
    console.log("ID:", doc.id, "Slug:", doc.data().slug, "Domain:", doc.data().customDomain);
  });
}
run().catch(console.error);
