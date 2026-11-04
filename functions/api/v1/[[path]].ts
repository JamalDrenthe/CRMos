interface Env {
  CRMOS_SERVICE_EMAIL: string;
  CRMOS_SERVICE_PASSWORD: string;
  CRMOS_API_KEYS: string;
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_PROJECT_ID: string;
}

interface ApiKey {
  id: string;
  sha256: string;
  scopes: string[];
  origins: string[];
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

type FirestoreValue = Record<string, unknown>;
type JsonObject = Record<string, unknown>;

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

class FirestoreError extends Error {
  constructor(
    readonly status: number,
    readonly reason?: string,
  ) {
    super('Firestore request failed');
  }
}

function isCreatePreconditionConflict(error: unknown): boolean {
  return error instanceof FirestoreError &&
    (error.status === 409 || (error.status === 400 && error.reason === 'FAILED_PRECONDITION'));
}

let cachedIdToken: { value: string; refreshAt: number } | undefined;
let signInInFlight: Promise<string> | undefined;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_STRING_LENGTH = 2000;
const MAX_NOTES_LENGTH = 10000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(
  status: number,
  body: JsonObject,
  origin?: string,
): Response {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, content-type, x-api-key');
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function withCors(response: Response, origin?: string): Response {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'authorization, content-type, x-api-key');
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

function loadApiKeys(rawKeys: string): ApiKey[] {
  const parsed: unknown = JSON.parse(rawKeys);
  if (!Array.isArray(parsed)) throw new Error('Invalid API key configuration');

  return parsed.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Invalid API key configuration');
    }

    const key = entry as Partial<ApiKey>;
    if (
      typeof key.id !== 'string' ||
      typeof key.sha256 !== 'string' ||
      !/^[0-9a-f]{64}$/i.test(key.sha256) ||
      !Array.isArray(key.scopes) ||
      !key.scopes.every((scope) => typeof scope === 'string') ||
      !Array.isArray(key.origins) ||
      !key.origins.every((origin) => typeof origin === 'string')
    ) {
      throw new Error('Invalid API key configuration');
    }

    return {
      id: key.id,
      sha256: key.sha256.toLowerCase(),
      scopes: key.scopes,
      origins: key.origins,
    };
  });
}

function constantTimeHexEqual(left: string, right: string): boolean {
  if (left.length !== 64 || right.length !== 64) return false;
  let difference = 0;
  for (let index = 0; index < 64; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function findApiKey(presentedKey: string, keys: ApiKey[]): Promise<ApiKey | undefined> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(presentedKey));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const matches = await Promise.all(keys.map(async (key) => ({
    key,
    matches: constantTimeHexEqual(hash, key.sha256),
  })));
  return matches.find((result) => result.matches)?.key;
}

function extractApiKey(request: Request): string {
  const headerKey = request.headers.get('x-api-key')?.trim();
  if (headerKey) return headerKey;
  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return bearer?.[1]?.trim() || '';
}

function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { stringValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ApiError(400, 'Invalid numeric value');
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: encodeFirestoreFields(value as JsonObject) } };
  }
  throw new ApiError(400, 'Unsupported Firestore value');
}

function encodeFirestoreFields(fields: JsonObject): Record<string, FirestoreValue> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, encodeFirestoreValue(value)]),
  );
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    const array = value.arrayValue as { values?: FirestoreValue[] } | undefined;
    return (array?.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in value) {
    const map = value.mapValue as { fields?: Record<string, FirestoreValue> } | undefined;
    return decodeFirestoreFields(map?.fields || {});
  }
  return undefined;
}

function decodeFirestoreFields(fields: Record<string, FirestoreValue>): JsonObject {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
}

function documentId(document: FirestoreDocument): string {
  return document.name.split('/').pop() || '';
}

async function deterministicContactId(email: string, vvcTag: string): Promise<string> {
  const identifier = email || `tag:${vvcTag}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identifier));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `api-${hash.slice(0, 32)}`;
}

function escapeFieldPath(fieldPath: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldPath)
    ? fieldPath
    : `\`${fieldPath.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``;
}

async function externalDocumentId(keyId: string, externalId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([keyId, externalId])));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `ext-${hash.slice(0, 32)}`;
}

function firestoreBaseUrl(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

async function getServiceToken(env: Env): Promise<string> {
  if (cachedIdToken && Date.now() < cachedIdToken.refreshAt) return cachedIdToken.value;
  if (signInInFlight) return signInInFlight;

  signInInFlight = (async () => {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: env.CRMOS_SERVICE_EMAIL,
          password: env.CRMOS_SERVICE_PASSWORD,
          returnSecureToken: true,
        }),
      },
    );
    if (!response.ok) throw new Error('Firebase sign-in failed');

    const result = await response.json() as { idToken?: string; expiresIn?: string };
    const expiresIn = Number(result.expiresIn);
    if (!result.idToken || !Number.isFinite(expiresIn)) throw new Error('Invalid Firebase sign-in response');

    const refreshAt = Date.now() + Math.max(0, expiresIn * 1000 - 5 * 60 * 1000);
    cachedIdToken = { value: result.idToken, refreshAt };
    return result.idToken;
  })();

  try {
    return await signInInFlight;
  } finally {
    signInInFlight = undefined;
  }
}

async function firestoreRequest(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getServiceToken(env);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${firestoreBaseUrl(env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev')}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let reason: string | undefined;
    try {
      const payload = await response.clone().json() as { error?: { status?: unknown } };
      if (typeof payload.error?.status === 'string') reason = payload.error.status;
    } catch {
      reason = undefined;
    }
    throw new FirestoreError(response.status, reason);
  }
  return response;
}

async function queryByField(
  env: Env,
  collection: string,
  fieldPath: string,
  value: string,
): Promise<FirestoreDocument[]> {
  const response = await firestoreRequest(env, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: 'EQUAL',
            value: { stringValue: value },
          },
        },
        limit: 100,
      },
    }),
  });
  const rows = await response.json() as Array<{ document?: FirestoreDocument }>;
  return rows.flatMap((row) => row.document ? [row.document] : []);
}

async function getDocument(
  env: Env,
  collection: string,
  id: string,
): Promise<FirestoreDocument | undefined> {
  try {
    const response = await firestoreRequest(
      env,
      `/${collection}/${encodeURIComponent(id)}`,
    );
    return await response.json() as FirestoreDocument;
  } catch (error) {
    if (error instanceof FirestoreError && error.status === 404) return undefined;
    throw error;
  }
}

function documentData(document: FirestoreDocument): JsonObject {
  return {
    ...decodeFirestoreFields(document.fields || {}),
    id: documentId(document),
  };
}

async function writeDocument(
  env: Env,
  collection: string,
  id: string,
  data: JsonObject,
  fieldPaths?: string[],
  exists?: boolean,
): Promise<void> {
  const query = new URLSearchParams();
  for (const fieldPath of fieldPaths || []) {
    query.append('updateMask.fieldPaths', fieldPath);
  }
  if (exists !== undefined) query.set('currentDocument.exists', String(exists));
  const queryString = query.toString();

  await firestoreRequest(
    env,
    `/${collection}/${encodeURIComponent(id)}${queryString ? `?${queryString}` : ''}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ fields: encodeFirestoreFields(data) }),
    },
  );
}

function trimString(value: unknown, field: string, maxLength = MAX_STRING_LENGTH): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new ApiError(400, `${field} is too long`);
  return trimmed;
}

function optionalExternalId(body: JsonObject): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, 'external_id')) return undefined;
  const externalId = trimString(body.external_id, 'external_id', 200);
  if (!externalId) throw new ApiError(400, 'external_id must contain 1 to 200 characters');
  return externalId;
}

function validateEmail(email: string | undefined): void {
  if (email && !EMAIL_PATTERN.test(email)) throw new ApiError(400, 'Invalid email address');
}

function stringList(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 50) {
    throw new ApiError(400, `${field} must contain at most 50 strings`);
  }
  return value.map((item) => {
    const result = trimString(item, field);
    if (result === undefined) throw new ApiError(400, `${field} must contain strings`);
    return result;
  });
}

function validateJsonValue(value: unknown, depth = 0): unknown {
  if (depth > 20) throw new ApiError(400, 'custom is nested too deeply');
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) throw new ApiError(400, 'custom string is too long');
    return value.trim();
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new ApiError(400, 'Invalid custom numeric value');
  }
  if (Array.isArray(value)) return value.map((item) => validateJsonValue(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const trimmedKey = key.trim();
        if (trimmedKey.length > MAX_STRING_LENGTH) throw new ApiError(400, 'custom key is too long');
        return [trimmedKey, validateJsonValue(item, depth + 1)];
      }),
    );
  }
  return value;
}

async function readJsonObject(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new ApiError(413, 'Request body is too large');

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
          await reader.cancel().catch(() => undefined);
          throw new ApiError(413, 'Request body is too large');
        }
        chunks.push(value);
      }
    }
  } finally {
    reader?.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(400, 'Request body must be a JSON object');
  }
  return parsed as JsonObject;
}

function optionalFields(
  body: JsonObject,
  fieldNames: string[],
): JsonObject {
  const fields: JsonObject = {};
  for (const field of fieldNames) {
    const value = trimString(body[field], field, field === 'notes' ? MAX_NOTES_LENGTH : MAX_STRING_LENGTH);
    if (value !== undefined) fields[field] = value;
  }
  return fields;
}

async function upsertContact(env: Env, body: JsonObject): Promise<Response> {
  const email = trimString(body.email, 'email')?.toLowerCase() || '';
  const vvcTag = trimString(body.vvc_tag, 'vvc_tag') || '';
  validateEmail(email || undefined);
  if (!email && !vvcTag) throw new ApiError(400, 'Provide an email or vvc_tag');

  const inputTags = stringList(body.tags, 'tags') || [];
  const inputCompanyTags = stringList(body.company_tags, 'company_tags') || [];
  const custom = body.custom === undefined || body.custom === null
    ? undefined
    : validateJsonValue(body.custom);
  if (custom !== undefined && (!custom || typeof custom !== 'object' || Array.isArray(custom))) {
    throw new ApiError(400, 'custom must be a JSON object');
  }

  const acceptedFields = optionalFields(body, [
    'first_name',
    'last_name',
    'name',
    'phone',
    'company',
    'job_title',
    'website',
    'city',
    'region',
    'country',
    'sector',
    'company_size',
    'budget',
    'timeline',
    'preferred_contact',
    'lead_source',
    'owner_email',
    'notes',
    'source',
  ]);
  const jobTitle = acceptedFields.job_title;
  if (jobTitle !== undefined && acceptedFields.title === undefined) acceptedFields.title = jobTitle;
  if (acceptedFields.name && !acceptedFields.first_name && !acceptedFields.last_name) {
    const [firstName, ...lastName] = String(acceptedFields.name).split(/\s+/);
    acceptedFields.first_name = firstName;
    acceptedFields.last_name = lastName.join(' ');
  }

  const findExistingDocument = async (): Promise<FirestoreDocument | undefined> => {
    const emailMatches = email
      ? await queryByField(env, 'crm_contacts', 'email', email)
      : [];
    const deterministicDocument = await getDocument(env, 'crm_contacts', deterministicId);
    const tagMatches = vvcTag
      ? await queryByField(env, 'crm_contacts', 'vvc_tag', vvcTag)
      : [];
    const emailDocument = emailMatches[0];
    const tagDocument = tagMatches[0];

    if (
      emailDocument &&
      tagDocument &&
      documentId(emailDocument) !== documentId(tagDocument)
    ) {
      throw new ApiError(409, 'email and vvc_tag belong to different contacts');
    }

    return emailDocument || deterministicDocument || tagDocument;
  };

  const buildData = (document?: FirestoreDocument): JsonObject => {
    const id = document ? documentId(document) : deterministicId;
    const decodedTags = document?.fields?.tags
      ? decodeFirestoreValue(document.fields.tags)
      : [];
    const decodedCompanyTags = document?.fields?.company_tags
      ? decodeFirestoreValue(document.fields.company_tags)
      : [];
    const existingTags = Array.isArray(decodedTags)
      ? decodedTags.filter((tag): tag is string => typeof tag === 'string')
      : [];
    const existingCompanyTags = Array.isArray(decodedCompanyTags)
      ? decodedCompanyTags.filter((tag): tag is string => typeof tag === 'string')
      : [];
    const companyTags = Array.from(new Set([...existingCompanyTags, ...inputCompanyTags]));
    const tags = Array.from(new Set([...existingTags, ...inputTags, ...companyTags]));
    if (companyTags.length > 50 || tags.length > 50) {
      throw new ApiError(400, 'Merged tags may contain at most 50 entries');
    }

    const requestedFields: JsonObject = {
      ...acceptedFields,
      ...(email || !document ? { email } : {}),
      ...(vvcTag ? { vvc_tag: vvcTag } : {}),
    };
    const fillableFields = document
      ? Object.fromEntries(
        Object.entries(requestedFields).filter(([field]) => {
          const currentValue = document.fields?.[field]
            ? decodeFirestoreValue(document.fields[field])
            : undefined;
          return currentValue === undefined || currentValue === '';
        }),
      )
      : requestedFields;

    const data: JsonObject = {
      ...fillableFields,
      id,
      company_tags: companyTags,
      tags,
      updated_at: new Date().toISOString(),
    };

    if (custom !== undefined) {
      const existingCustomFields = document?.fields?.custom_fields
        ? decodeFirestoreValue(document.fields.custom_fields)
        : undefined;
      const existingCustom = existingCustomFields &&
        typeof existingCustomFields === 'object' &&
        !Array.isArray(existingCustomFields)
        ? existingCustomFields as JsonObject
        : {};
      data.custom_fields = document
        ? { ...(custom as JsonObject), ...existingCustom }
        : custom;
    }

    if (!document) {
      data.first_name = acceptedFields.first_name ?? 'Nieuw';
      data.last_name = acceptedFields.last_name ?? 'Contact';
      data.phone = acceptedFields.phone ?? '';
      data.company = acceptedFields.company ?? 'Onbekend';
      data.vvc_tag = vvcTag || `vvc-${crypto.randomUUID()}`;
      if (!email) data.email = '';
      const createdTags = Array.from(new Set([data.vvc_tag, ...tags]));
      if (createdTags.length > 50) throw new ApiError(400, 'Merged tags may contain at most 50 entries');
      data.tags = createdTags;
      data.source = acceptedFields.source ?? 'CRMos REST API';
      data.notes = acceptedFields.notes ?? '';
      data.created_at = data.updated_at;
      if (custom === undefined) data.custom_fields = {};
    }

    return data;
  };

  const deterministicId = await deterministicContactId(email, vvcTag);
  let existingDocument = await findExistingDocument();
  let data = buildData(existingDocument);
  try {
    await writeDocument(
      env,
      'crm_contacts',
      data.id as string,
      data,
      existingDocument ? Object.keys(data).map(escapeFieldPath) : undefined,
      existingDocument ? undefined : false,
    );
  } catch (error) {
    const isCreateConflict = error instanceof FirestoreError &&
      (error.status === 409 || (error.status === 400 && error.reason === 'FAILED_PRECONDITION'));
    if (existingDocument || !isCreateConflict) throw error;

    existingDocument = await getDocument(env, 'crm_contacts', deterministicId);
    if (!existingDocument) throw error;
    data = buildData(existingDocument);
    await writeDocument(env, 'crm_contacts', data.id as string, data, Object.keys(data).map(escapeFieldPath));
  }

  return jsonResponse(existingDocument ? 200 : 201, {
    success: true,
    data: { id: data.id, created: !existingDocument },
  });
}

async function getContactByEmail(env: Env, emailInput: string | null): Promise<Response> {
  const email = trimString(emailInput || '', 'email')?.toLowerCase() || '';
  validateEmail(email || undefined);
  if (!email) throw new ApiError(400, 'Provide an email query parameter');

  const matches = await queryByField(env, 'crm_contacts', 'email', email);
  const data = matches.map((document) => ({
    id: documentId(document),
    ...decodeFirestoreFields(document.fields || {}),
  }));
  return jsonResponse(200, { success: true, count: data.length, data });
}

async function createDeal(env: Env, body: JsonObject, keyId: string): Promise<Response> {
  const externalId = optionalExternalId(body);
  const name = trimString(body.name, 'name');
  if (!name) throw new ApiError(400, 'name is required');
  const value = body.value === undefined || body.value === null ? 0 : body.value;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new ApiError(400, 'value must be a number greater than or equal to 0');
  }

  const stage = trimString(body.stage, 'stage') || 'lead';
  const stageProbabilities: Record<string, number> = {
    lead: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    'closed-won': 100,
    'closed-lost': 0,
  };
  if (!Object.prototype.hasOwnProperty.call(stageProbabilities, stage)) {
    throw new ApiError(400, 'Invalid deal stage');
  }
  const optional = optionalFields(body, [
    'company_id',
    'contact_id',
    'contact_name',
    'expected_close_date',
    'source',
    'owner_email',
    'notes',
  ]);
  const tags = stringList(body.tags, 'tags') || [];
  const now = new Date().toISOString();
  const data: JsonObject = {
    id: externalId ? await externalDocumentId(keyId, externalId) : crypto.randomUUID(),
    name,
    value,
    company_id: optional.company_id ?? '',
    stage,
    currency: trimString(body.currency, 'currency') || 'EUR',
    pipeline_id: '1',
    probability: stageProbabilities[stage],
    source: optional.source ?? 'CRMos REST API',
    assigned_to: optional.owner_email ?? '',
    tags,
    activities: [],
    created_at: now,
    updated_at: now,
  };
  if (externalId) {
    data.external_id = externalId;
    data.api_key_id = keyId;
  }
  if (externalId && optional.owner_email !== undefined) data.owner_email = optional.owner_email;
  for (const field of ['contact_id', 'contact_name', 'expected_close_date', 'notes']) {
    if (optional[field] !== undefined) data[field] = optional[field];
  }
  const custom = body.custom === undefined || body.custom === null
    ? undefined
    : validateJsonValue(body.custom);
  if (custom !== undefined && (!custom || typeof custom !== 'object' || Array.isArray(custom))) {
    throw new ApiError(400, 'custom must be a JSON object');
  }
  if (custom !== undefined) data.custom = custom;

  if (!externalId) {
    await writeDocument(env, 'crm_deals', data.id as string, data);
    return jsonResponse(201, { success: true, data });
  }

  const updateExisting = async (document: FirestoreDocument): Promise<Response> => {
    const existingData = documentData(document);
    if (existingData.api_key_id !== keyId) throw new ApiError(409, 'external_id is already in use');
    const updates: JsonObject = {
      name,
      value,
      stage,
      probability: stageProbabilities[stage],
      updated_at: new Date().toISOString(),
    };
    if (optional.notes !== undefined) updates.notes = optional.notes;
    if (optional.owner_email !== undefined) {
      updates.owner_email = optional.owner_email;
      updates.assigned_to = optional.owner_email;
    }

    const customUpdates = custom as JsonObject | undefined;
    const fieldPaths = Object.keys(updates).map(escapeFieldPath);
    if (customUpdates) {
      for (const key of Object.keys(customUpdates)) {
        fieldPaths.push(`custom.${escapeFieldPath(key)}`);
      }
    }
    const existingCustom = existingData.custom;
    const previousCustom = existingCustom && typeof existingCustom === 'object' && !Array.isArray(existingCustom)
      ? existingCustom as JsonObject
      : {};
    const mergedCustom = customUpdates ? { ...previousCustom, ...customUpdates } : previousCustom;
    const writeData: JsonObject = customUpdates ? { ...updates, custom: customUpdates } : updates;

    try {
      await writeDocument(env, 'crm_deals', data.id as string, writeData, fieldPaths, true);
    } catch (error) {
      if (error instanceof FirestoreError && (error.status === 404 || isCreatePreconditionConflict(error))) {
        throw new ApiError(409, 'Deal was deleted');
      }
      throw error;
    }
    const responseData: JsonObject = { ...existingData, ...updates };
    if (customUpdates) responseData.custom = mergedCustom;
    return jsonResponse(200, { success: true, data: responseData });
  };

  const existingDocument = await getDocument(env, 'crm_deals', data.id as string);
  if (existingDocument) return updateExisting(existingDocument);

  try {
    await writeDocument(env, 'crm_deals', data.id as string, data, undefined, false);
    return jsonResponse(201, { success: true, data });
  } catch (error) {
    if (!isCreatePreconditionConflict(error)) throw error;
    const racedDocument = await getDocument(env, 'crm_deals', data.id as string);
    if (!racedDocument) throw error;
    return updateExisting(racedDocument);
  }
}

function activityResponse(document: FirestoreDocument, keyId: string): Response {
  if (documentData(document).api_key_id !== keyId) throw new ApiError(409, 'external_id is already in use');
  return jsonResponse(200, { success: true, data: documentData(document) });
}

async function createActivity(env: Env, body: JsonObject, keyId: string): Promise<Response> {
  const externalId = optionalExternalId(body);
  const id = externalId ? await externalDocumentId(keyId, externalId) : crypto.randomUUID();
  if (externalId) {
    const existingDocument = await getDocument(env, 'crm_activities', id);
    if (existingDocument) {
      return activityResponse(existingDocument, keyId);
    }
  }

  const title = trimString(body.title, 'title');
  const contactId = trimString(body.contact_id, 'contact_id');
  if (!title || !contactId) throw new ApiError(400, 'title and contact_id are required');

  const type = trimString(body.type, 'type') || 'note';
  const activityTypes = ['call', 'email', 'meeting', 'task', 'note', 'whatsapp', 'sms'];
  if (!activityTypes.includes(type)) throw new ApiError(400, 'Invalid activity type');
  const dealId = trimString(body.deal_id, 'deal_id') || '';
  const ownerEmail = trimString(body.owner_email, 'owner_email');
  const now = new Date().toISOString();
  const data: JsonObject = {
    id,
    title,
    contact_id: contactId,
    deal_id: dealId,
    type,
    description: '',
    status: 'completed',
    completed_at: now,
    assigned_to: ownerEmail || 'CRMos REST API',
    related_to: {
      type: dealId ? 'deal' : 'contact',
      id: dealId || contactId,
    },
    created_at: now,
    updated_at: now,
  };
  if (externalId) {
    data.external_id = externalId;
    data.api_key_id = keyId;
  }
  Object.assign(data, optionalFields(body, ['description', 'source']));
  const custom = body.custom === undefined || body.custom === null
    ? undefined
    : validateJsonValue(body.custom);
  if (custom !== undefined && (!custom || typeof custom !== 'object' || Array.isArray(custom))) {
    throw new ApiError(400, 'custom must be a JSON object');
  }
  if (custom !== undefined) data.custom = custom;

  if (!externalId) {
    await writeDocument(env, 'crm_activities', data.id as string, data);
    return jsonResponse(201, { success: true, data });
  }

  try {
    await writeDocument(env, 'crm_activities', data.id as string, data, undefined, false);
    return jsonResponse(201, { success: true, data });
  } catch (error) {
    if (!isCreatePreconditionConflict(error)) throw error;
    const racedDocument = await getDocument(env, 'crm_activities', data.id as string);
    if (!racedDocument) throw error;
    return activityResponse(racedDocument, keyId);
  }
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = request.headers.get('Origin') || undefined;

  if (request.method === 'OPTIONS') {
    let keys: ApiKey[];
    try {
      keys = loadApiKeys(env.CRMOS_API_KEYS || '[]');
    } catch {
      return jsonResponse(403, { success: false, message: 'Origin is not allowed' });
    }

    if (!origin) return new Response(null, { status: 204 });
    const originAllowed = keys.some((key) => key.origins.includes(origin));
    if (!originAllowed) return jsonResponse(403, { success: false, message: 'Origin is not allowed' });
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-api-key',
        Vary: 'Origin',
      },
    });
  }

  if (path === '/api/v1/health' && request.method === 'GET') {
    return jsonResponse(200, {
      success: true,
      service: 'crmos-api',
      version: '1.0.0',
      time: new Date().toISOString(),
    });
  }

  const route = `${request.method} ${path}`;
  const requiredScope: Record<string, string> = {
    'POST /api/v1/contacts/upsert': 'contacts:upsert',
    'GET /api/v1/contacts': 'contacts:read',
    'POST /api/v1/deals': 'deals:create',
    'POST /api/v1/activities': 'activities:create',
  };
  const scope = requiredScope[route];
  if (!scope) return jsonResponse(404, { success: false, message: 'Not found' });

  let keys: ApiKey[];
  try {
    keys = loadApiKeys(env.CRMOS_API_KEYS || '[]');
  } catch {
    return jsonResponse(401, { success: false, message: 'Invalid or missing API key' });
  }

  let key: ApiKey | undefined;
  try {
    const presentedKey = extractApiKey(request);
    if (presentedKey) key = await findApiKey(presentedKey, keys);
  } catch {
    return jsonResponse(401, { success: false, message: 'Invalid or missing API key' });
  }
  if (!key) return jsonResponse(401, { success: false, message: 'Invalid or missing API key' });
  if (origin && key.origins.length > 0 && !key.origins.includes(origin)) {
    return jsonResponse(403, { success: false, message: 'Origin is not allowed' });
  }
  const corsOrigin = origin && key.origins.includes(origin) ? origin : undefined;
  if (!key.scopes.includes(scope)) {
    return jsonResponse(403, { success: false, message: 'Insufficient scope' }, corsOrigin);
  }

  try {
    if (route === 'POST /api/v1/contacts/upsert') {
      return withCors(await upsertContact(env, await readJsonObject(request)), corsOrigin);
    }
    if (route === 'GET /api/v1/contacts') {
      return withCors(
        await getContactByEmail(env, url.searchParams.get('email')),
        corsOrigin,
      );
    }
    if (route === 'POST /api/v1/deals') {
      return withCors(await createDeal(env, await readJsonObject(request), key.id), corsOrigin);
    }
    return withCors(await createActivity(env, await readJsonObject(request), key.id), corsOrigin);
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse(error.status, { success: false, message: error.message }, corsOrigin);
    }
    return jsonResponse(502, { success: false, message: 'Firebase service unavailable' }, corsOrigin);
  }
}
