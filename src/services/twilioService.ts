// ============================================
// CRMos - Twilio Telephony & AI MCP Service
// ============================================
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Call } from '@/types';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKey?: string;
  apiSecret?: string;
  phoneNumber: string; // e.g. +3185... or +1555...
  twimlAppSid?: string;
  mcpServerUrl: string; // https://mcp.twilio.com/docs
  enabled: boolean;
  recordingEnabled: boolean;
  aiVoiceAgentEnabled: boolean;
  webhookUrl?: string;
}

const STORAGE_KEY = 'crmos_twilio_config';

export const DEFAULT_TWILIO_CONFIG: TwilioConfig = {
  accountSid: '',
  authToken: '',
  apiKey: '',
  apiSecret: '',
  phoneNumber: '',
  twimlAppSid: '',
  mcpServerUrl: 'https://mcp.twilio.com/docs',
  enabled: false,
  recordingEnabled: true,
  aiVoiceAgentEnabled: false,
  webhookUrl: 'https://demo.twilio.com/welcome/voice/',
};

export function getLocalTwilioConfig(): TwilioConfig {
  if (typeof window === 'undefined') return DEFAULT_TWILIO_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TWILIO_CONFIG;
    return { ...DEFAULT_TWILIO_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse twilio config from local storage', e);
    return DEFAULT_TWILIO_CONFIG;
  }
}

export function saveLocalTwilioConfig(config: TwilioConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save twilio config to local storage', e);
  }
}

export async function loadTwilioConfigFromFirestore(orgId: string): Promise<TwilioConfig> {
  const local = getLocalTwilioConfig();
  if (!isFirebaseConfigured() || !db) return local;

  try {
    const ref = doc(db, 'organizations', orgId, 'integrations', 'twilio');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<TwilioConfig>;
      const merged = { ...DEFAULT_TWILIO_CONFIG, ...data };
      saveLocalTwilioConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not load Twilio config from Firestore:', err);
  }

  return local;
}

export async function saveTwilioConfigToFirestore(config: TwilioConfig, orgId: string): Promise<void> {
  saveLocalTwilioConfig(config);
  if (!isFirebaseConfigured() || !db) return;

  try {
    const ref = doc(db, 'organizations', orgId, 'integrations', 'twilio');
    await setDoc(ref, {
      ...config,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save Twilio config to Firestore:', err);
    throw err;
  }
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Convert Dutch national 06 to +316
  if (cleaned.startsWith('06') && cleaned.length === 10) {
    cleaned = '+31' + cleaned.substring(1);
  } else if (cleaned.startsWith('0') && cleaned.length >= 9 && !cleaned.startsWith('00')) {
    cleaned = '+31' + cleaned.substring(1);
  }
  return cleaned;
}

export interface TwilioCallOptions {
  to: string;
  from?: string;
  contactId?: string;
  contactName?: string;
  agentId?: string;
  agentName?: string;
  orgId?: string;
  companyName?: string;
  notes?: string;
}

export interface TwilioCallResult {
  success: boolean;
  callSid?: string;
  mode: 'twilio_rest' | 'native_tel' | 'web_dialer';
  message: string;
  callRecord: Omit<Call, 'id'>;
}

export async function verifyTwilioAccount(credentials: {
  accountSid: string;
  authToken: string;
}): Promise<{
  valid: boolean;
  friendlyName?: string;
  status?: string;
  type?: string;
  phoneNumbers?: Array<{ phoneNumber: string; friendlyName: string }>;
  message: string;
}> {
  try {
    const res = await fetch('/api/twilio/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      valid: false,
      message: (err as Error)?.message || 'Kon Twilio service niet bereiken.',
    };
  }
}

/**
 * Initiates a phone call via Twilio Voice API or prepares Web Dialer / Native tel
 */
export async function makeCall(options: TwilioCallOptions, config?: TwilioConfig): Promise<TwilioCallResult> {
  const cfg = config || getLocalTwilioConfig();
  const targetNumber = cleanPhoneNumber(options.to);
  const callerId = cleanPhoneNumber(options.from || cfg.phoneNumber);

  const baseCallRecord: Omit<Call, 'id'> = {
    direction: 'outbound',
    from_number: callerId || 'CRMos Dialer',
    to_number: targetNumber || options.to,
    contact_id: options.contactId,
    contact_name: options.contactName,
    status: 'in-progress',
    agent_id: options.agentId || 'current_user',
    agent_name: options.agentName || 'Agent',
    org_id: options.orgId,
    company_name: options.companyName,
    notes: options.notes,
    started_at: new Date().toISOString(),
  };

  // If Twilio API credentials are configured, call via backend proxy
  if (cfg.enabled && cfg.accountSid && cfg.authToken && callerId) {
    try {
      const response = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: cfg.accountSid,
          authToken: cfg.authToken,
          to: targetNumber,
          from: callerId,
          webhookUrl: cfg.webhookUrl,
          recording: cfg.recordingEnabled,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          callSid: data.callSid,
          mode: 'twilio_rest',
          message: data.message || `Twilio oproep gestart naar ${targetNumber} (SID: ${data.callSid})`,
          callRecord: {
            ...baseCallRecord,
            call_sid: data.callSid,
          },
        };
      } else {
        return {
          success: false,
          mode: 'twilio_rest',
          message: data.message || `Twilio weigerde de oproep (${response.status})`,
          callRecord: baseCallRecord,
        };
      }
    } catch (err: unknown) {
      console.warn('Twilio proxy call error, falling back to Web Dialer:', err);
      return {
        success: true,
        mode: 'web_dialer',
        message: `Web dialer sessie gestart voor ${targetNumber}.`,
        callRecord: baseCallRecord,
      };
    }
  }

  // If no Twilio credentials configured yet, use native tel: or web dialer
  return {
    success: true,
    mode: 'native_tel',
    message: `Kies Bellen via GSM of Web Dialer voor ${targetNumber}.`,
    callRecord: baseCallRecord,
  };
}

/**
 * Twilio Model Context Protocol (MCP) server helper
 * Docs: https://www.twilio.com/docs/ai/mcp
 */
export const TWILIO_MCP_INFO = {
  endpoint: 'https://mcp.twilio.com/docs',
  description: 'Connect AI coding agents to Twilio API documentation with the Model Context Protocol server. Search over 1,800 endpoints and retrieve schemas on demand.',
  tools: [
    {
      name: 'twilio__search',
      description: 'Takes a natural-language query, returns ranked API operations, documentation articles, and IDs',
      example: 'How do I initiate a Voice Call with Twilio Programmable Voice?',
    },
    {
      name: 'twilio__retrieve',
      description: 'Takes one or more API IDs from search results, and returns full parameter schemas and response schemas',
      example: 'v2010.account.call.create',
    },
  ],
  claudeCliCommand: 'claude mcp add --transport http twilio-docs https://mcp.twilio.com/docs',
  cursorCommand: '/add-plugin twilio-developer-kit',
  openCodeConfig: {
    mcp: {
      'twilio-docs': {
        type: 'remote',
        url: 'https://mcp.twilio.com/docs',
        enabled: true,
        oauth: false,
      },
    },
  },
};
