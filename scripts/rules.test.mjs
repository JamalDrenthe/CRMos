import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const rules = readFileSync('./firestore.rules', 'utf8');

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-crmos',
  firestore: { rules, host: '127.0.0.1', port: 8080 },
});

// Seed data bypassing rules
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/alice'), { org_id: 'orgA', role: 'agent', is_super_admin: false });
  await setDoc(doc(db, 'users/mallory'), { org_id: 'orgB', role: 'agent', is_super_admin: false });
  await setDoc(doc(db, 'crm_candidates/candA'), { org_id: 'orgA', name: 'Kandidaat A' });
  await setDoc(doc(db, 'crm_api_keys/key1'), { org_id: 'orgA', key: 'secret' });
  await setDoc(doc(db, 'crm_integrations/int1'), { org_id: 'orgA', token: 'x' });
  await setDoc(doc(db, 'crm_audit_logs/log1'), { org_id: 'orgA', action: 'x' });
});

const alice = testEnv.authenticatedContext('alice').firestore();
const mallory = testEnv.authenticatedContext('mallory').firestore();
const fakeAdmin = testEnv.authenticatedContext('eve', { email: 'info@crmos.one', email_verified: false }).firestore();
const realAdmin = testEnv.authenticatedContext('boss', { admin: true }).firestore();
const anon = testEnv.unauthenticatedContext().firestore();

let pass = 0, fail = 0;
async function t(name, p) {
  try { await p; console.log('PASS', name); pass++; }
  catch (e) { console.log('FAIL', name, e.message?.split('\n')[0]); fail++; }
}

// Cross-tenant read must fail
await t('orgB user kan kandidaat van orgA niet lezen', assertFails(getDoc(doc(mallory, 'crm_candidates/candA'))));
// Own tenant read works
await t('orgA user leest eigen kandidaat', assertSucceeds(getDoc(doc(alice, 'crm_candidates/candA'))));
// Cross-tenant write must fail
await t('orgB user kan kandidaat orgA niet overschrijven', assertFails(setDoc(doc(mallory, 'crm_candidates/candA'), { org_id: 'orgA', name: 'x' })));
// Write with forged org_id must fail
await t('orgB user kan geen doc in orgA aanmaken', assertFails(setDoc(doc(mallory, 'crm_candidates/candX'), { org_id: 'orgA', name: 'x' })));
// api_keys denied for regular users, allowed for admin claim
await t('crm_api_keys lezen geweigerd voor user', assertFails(getDoc(doc(alice, 'crm_api_keys/key1'))));
await t('crm_api_keys lezen toegestaan voor admin claim', assertSucceeds(getDoc(doc(realAdmin, 'crm_api_keys/key1'))));
await t('crm_integrations lezen geweigerd voor user', assertFails(getDoc(doc(alice, 'crm_integrations/int1'))));
// audit logs: read denied, append allowed, update/delete denied
await t('crm_audit_logs lezen geweigerd voor user', assertFails(getDoc(doc(alice, 'crm_audit_logs/log1'))));
await t('crm_audit_logs append eigen org toegestaan', assertSucceeds(setDoc(doc(alice, 'crm_audit_logs/log2'), { org_id: 'orgA', action: 'y' })));
await t('crm_audit_logs update geweigerd', assertFails(updateDoc(doc(alice, 'crm_audit_logs/log1'), { action: 'z' })));
await t('crm_audit_logs delete geweigerd', assertFails(deleteDoc(doc(alice, 'crm_audit_logs/log1'))));
// Privilege escalation on own profile must fail
await t('eigen profiel is_super_admin zetten geweigerd', assertFails(updateDoc(doc(mallory, 'users/mallory'), { is_super_admin: true })));
await t('eigen profiel role wijzigen geweigerd', assertFails(updateDoc(doc(mallory, 'users/mallory'), { role: 'admin' })));
await t('eigen profiel org_id wijzigen geweigerd', assertFails(updateDoc(doc(mallory, 'users/mallory'), { org_id: 'orgA' })));
await t('eigen profiel onschuldig veld wijzigen toegestaan', assertSucceeds(updateDoc(doc(mallory, 'users/mallory'), { timezone: 'UTC' })));
// Unverified email does NOT get admin
await t('ongeverifieerd admin-email kan vreemd profiel niet schrijven', assertFails(updateDoc(doc(fakeAdmin, 'users/alice'), { timezone: 'X' })));
// Verified admin email does get admin
const verifiedAdmin = testEnv.authenticatedContext('jamal', { email: 'info@crmos.one', email_verified: true }).firestore();
await t('geverifieerd admin-email kan profiel schrijven', assertSucceeds(updateDoc(doc(verifiedAdmin, 'users/alice'), { timezone: 'X' })));
// Reading other users' profiles cross-org denied
await t('orgB user kan profiel orgA niet lezen', assertFails(getDoc(doc(mallory, 'users/alice'))));
// Anonymous read of tenant data denied
await t('anoniem kan kandidaat niet lezen', assertFails(getDoc(doc(anon, 'crm_candidates/candA'))));

await testEnv.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
