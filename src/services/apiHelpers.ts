import axios from "axios";
import path from "path";
import fs from "fs";
import { getAdminDb } from "./firebaseAdmin.js";

// --- CONVERSANT FIRESTORE REST API HELPERS (BYPASS GCP ADC CONSTRAINTS FOR PREVIEWS) ---
export function parseRestValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const values = value.arrayValue.values || [];
    return values.map((v: any) => parseRestValue(v));
  }
  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    const res: any = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = parseRestValue(v);
    }
    return res;
  }
  if ('nullValue' in value) return null;
  return value;
}

export function parseRestDocument(doc: any) {
  if (!doc || !doc.fields) return null;
  const idStr = doc.name ? doc.name.split('/').pop() : '';
  const parsed: any = { id: idStr };
  for (const [key, val] of Object.entries(doc.fields)) {
    parsed[key] = parseRestValue(val);
  }
  return parsed;
}

export async function fetchFromREST(
  collectionName: string,
  docId?: string,
  queryOptions?: { 
    whereFilters?: Array<{ field: string; op: 'EQUAL' | 'IN'; value: any }>;
    orderByField?: string;
    direction?: 'ASCENDING' | 'DESCENDING';
    limit?: number;
  }
) {
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0785892115';
  let databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-tripbonesaas-bc73f611-b9f1-4175-a949-14e52d815420';
  let apiKey = '';
  let authDomain = '';

  try {
    const rootPath = process.cwd();
    const possiblePaths = [
      path.resolve(rootPath, "firebase-applet-config.json"),
      path.resolve(rootPath, "..", "firebase-applet-config.json"),
      path.resolve(rootPath, "public", "firebase-applet-config.json"),
      "/var/task/firebase-applet-config.json",
      "/var/task/app/firebase-applet-config.json"
    ];
    let configPath = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        configPath = p;
        break;
      }
    }
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      projectId = config.projectId || projectId;
      databaseId = config.firestoreDatabaseId || databaseId;
      apiKey = config.apiKey || apiKey;
      authDomain = config.authDomain || authDomain;
    }
  } catch (e) {}

  const headers: Record<string, string> = {};
  if (authDomain) {
    headers['Referer'] = `https://${authDomain}/`;
    headers['Origin'] = `https://${authDomain}`;
  }

  if (docId) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${docId}${apiKey ? `?key=${apiKey}` : ''}`;
    const res = await axios.get(url, { headers });
    return parseRestDocument(res.data);
  } else {
    const structuredQuery: any = {
      from: [{ collectionId: collectionName }]
    };

    if (queryOptions?.whereFilters && queryOptions.whereFilters.length > 0) {
      if (queryOptions.whereFilters.length === 1) {
        const filter = queryOptions.whereFilters[0];
        structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: filter.field },
            op: filter.op,
            value: typeof filter.value === 'string' 
              ? { stringValue: filter.value }
              : (Array.isArray(filter.value) 
                ? { arrayValue: { values: filter.value.map(v => ({ stringValue: v })) } }
                : { booleanValue: filter.value })
          }
        };
      } else {
        structuredQuery.where = {
          compositeFilter: {
            op: 'AND',
            filters: queryOptions.whereFilters.map(f => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: typeof f.value === 'string'
                  ? { stringValue: f.value }
                  : (Array.isArray(f.value)
                    ? { arrayValue: { values: f.value.map(v => ({ stringValue: v })) } }
                    : { booleanValue: f.value })
              }
            }))
          }
        };
      }
    }

    if (queryOptions?.orderByField) {
      structuredQuery.orderBy = [{
        field: { fieldPath: queryOptions.orderByField },
        direction: queryOptions.direction || 'ASCENDING'
      }];
    }

    if (queryOptions?.limit) {
      structuredQuery.limit = queryOptions.limit;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery${apiKey ? `?key=${apiKey}` : ''}`;
    const res = await axios.post(url, { structuredQuery }, { headers });
    
    const documents = (res.data || [])
      .map((item: any) => item.document ? parseRestDocument(item.document) : null)
      .filter(Boolean);
    
    return documents;
  }
}

// Robust Gemini API helper that falls back to stable alternative models if the primary model is unavailable.
export async function generateContentWithFallback(ai: any, params: any) {
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3-flash-preview"];
  const initialModel = params.model || "gemini-2.5-flash";
  const uniqueModels = Array.from(new Set([initialModel, ...modelsToTry]));

  let lastError: any = null;
  let currentAi = ai;

  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini Fallback Router] Attempting generation with model: ${model}`);
      const response = await currentAi.models.generateContent({
        ...params,
        model: model
      });
      console.log(`[Gemini Fallback Router] Successfully generated content using model: ${model}`);
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || err);
      console.warn(`[Gemini Fallback Router] Failed with model ${model}:`, errMsg);

      // Check if error is related to API key or authorization or invalid argument or quota
      const isKeyError = errMsg.includes('API key not valid') || 
                         errMsg.includes('API_KEY_INVALID') || 
                         errMsg.includes('INVALID_ARGUMENT') || 
                         errMsg.includes('UNAUTHENTICATED') || 
                         errMsg.includes('PermissionDenied') || 
                         errMsg.includes('400') ||
                         errMsg.includes('401') ||
                         errMsg.includes('403');

      // If key is invalid and server process.env.GEMINI_API_KEY exists, switch client to environment key and retry immediately
      if (isKeyError && process.env.GEMINI_API_KEY?.trim()) {
        try {
          console.log(`[Gemini Fallback Router] Key/model error detected. Retrying model ${model} with process.env.GEMINI_API_KEY...`);
          const { GoogleGenAI } = await import("@google/genai");
          currentAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
          const response = await currentAi.models.generateContent({
            ...params,
            model: model
          });
          console.log(`[Gemini Fallback Router] Successfully recovered using env key with model: ${model}`);
          return response;
        } catch (keyFallbackErr: any) {
          console.warn(`[Gemini Fallback Router] Env key retry failed for ${model}:`, keyFallbackErr.message || keyFallbackErr);
          lastError = keyFallbackErr;
        }
      }

      // If we failed and there are tools configured, try one more time for this model without tools (in case of tool support issues)
      if (params.config?.tools || params.tools) {
        try {
          console.log(`[Gemini Fallback Router] Retrying model ${model} without tools...`);
          const cleanParams = { ...params };
          if (cleanParams.config) {
            cleanParams.config = { ...cleanParams.config };
            delete cleanParams.config.tools;
          }
          delete cleanParams.tools;
          
          const response = await currentAi.models.generateContent({
            ...cleanParams,
            model: model
          });
          console.log(`[Gemini Fallback Router] Successfully generated content (sans tools) using model: ${model}`);
          return response;
        } catch (retryErr: any) {
          console.warn(`[Gemini Fallback Router] Retry without tools also failed for ${model}:`, retryErr.message || retryErr);
        }
      }
    }
  }

  // Sanitize key error message for human clarity if it failed due to invalid API key
  const finalErrMsg = String(lastError?.message || lastError || "");
  if (
    finalErrMsg.includes("API key not valid") || 
    finalErrMsg.includes("API_KEY_INVALID") || 
    finalErrMsg.includes("INVALID_ARGUMENT") ||
    finalErrMsg.includes("UNAUTHENTICATED")
  ) {
    throw new Error(
      "API key not valid. Please ensure your Gemini API Key is configured in Admin Settings (Communication Settings) or Vercel Environment Variables (GEMINI_API_KEY). You can obtain a free API key at https://aistudio.google.com."
    );
  }

  throw lastError;
}

// Helper to dynamically resolve per-tenant Gemini API Key
export async function resolveTenantGeminiKey(tenantId?: string | null): Promise<string | undefined> {
  if (!tenantId) return undefined;
  const db = getAdminDb();
  try {
    const commSettingsDoc = await db.collection('communicationSettings').doc(tenantId).get();
    if (commSettingsDoc.exists) {
      const data = commSettingsDoc.data();
      const rawKey = data?.geminiApiKey;
      if (
        typeof rawKey === 'string' && 
        rawKey.trim().length > 15 && 
        !rawKey.includes('...') && 
        !rawKey.toLowerCase().includes('your') &&
        !rawKey.toLowerCase().includes('key')
      ) {
        return rawKey.trim();
      }
    }
  } catch (err) {
    console.error("[resolveTenantGeminiKey Error]:", err);
  }
  return undefined;
}
