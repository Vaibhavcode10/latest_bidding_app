import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account not found at: ${serviceAccountPath}`);
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase connected successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}

export const db = admin.firestore();
