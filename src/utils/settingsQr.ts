import QRCode from "qrcode";

const KEY_MAP: Record<string, string> = {
  "pensieve_db_strategy": "db_strat",
  "pensieve_profile_name": "prof_name",
  "pensieve_profile_email": "prof_email",
  "pensieve_profile_avatar_gradient": "prof_grad",
  "pensieve_appwrite_endpoint": "aw_end",
  "pensieve_appwrite_projectId": "aw_pid",
  "pensieve_appwrite_databaseId": "aw_db",
  "pensieve_appwrite_collectionId": "aw_coll",
  "pensieve_appwrite_bucketId": "aw_buck",
  "pensieve_supabase_url": "sb_url",
  "pensieve_supabase_key": "sb_key",
  "pensieve_firebase_apiKey": "fb_api",
  "pensieve_firebase_authDomain": "fb_auth",
  "pensieve_firebase_projectId": "fb_pid",
  "pensieve_firebase_storageBucket": "fb_bucket",
  "pensieve_firebase_messagingSenderId": "fb_sender",
  "pensieve_firebase_appId": "fb_app",
  "pensieve_firebase_firestoreDatabaseId": "fb_db",
  "pensieve_openai_key": "oa_key",
  "pensieve_gemini_key": "gem_key",
  "pensieve_local_lm_url": "lm_url",
  "pensieve_api_provider": "api_prov",
  "pensieve_api_base_url": "api_base",
  "pensieve_api_token": "api_tok",
  "pensieve_selected_model": "sel_mod",
  "pensieve_custom_model_name": "cust_mod",
  "pensieve_speculative_decoding": "spec_dec",
  "app_user_settings": "theme_set"
};

const REVERSE_KEY_MAP: Record<string, string> = Object.entries(KEY_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Serializes current settings from localStorage into a compressed JSON string.
 */
export function getSerializedSettings(): string {
  if (typeof window === "undefined") return "";

  const payload: Record<string, string> = {};

  for (const [localStorageKey, shortKey] of Object.entries(KEY_MAP)) {
    const value = localStorage.getItem(localStorageKey);
    if (value !== null && value !== undefined && value.trim() !== "") {
      payload[shortKey] = value;
    }
  }

  return `pensieve-settings:${JSON.stringify(payload)}`;
}

/**
 * Generates a QR Code Data URL for the current settings.
 */
export async function generateSettingsQrCode(): Promise<string> {
  const serialized = getSerializedSettings();
  try {
    return await QRCode.toDataURL(serialized, {
      margin: 2,
      width: 256,
      color: {
        dark: "#10b981", // Emerald-500
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate settings QR code:", error);
    throw error;
  }
}

/**
 * Parses and applies settings from a scanned QR code text into localStorage.
 */
export function applySettings(scannedText: string): boolean {
  if (!scannedText.startsWith("pensieve-settings:")) {
    return false;
  }

  try {
    const jsonStr = scannedText.substring("pensieve-settings:".length);
    const payload = JSON.parse(jsonStr);

    if (typeof payload !== "object" || payload === null) {
      return false;
    }

    // Apply each setting
    for (const [shortKey, value] of Object.entries(payload)) {
      const originalKey = REVERSE_KEY_MAP[shortKey];
      if (originalKey && typeof value === "string") {
        localStorage.setItem(originalKey, value);
      }
    }

    return true;
  } catch (error) {
    console.error("Error applying settings from QR code:", error);
    return false;
  }
}
