import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'demo-crmos';
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
});

try {
  const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(unauthenticatedDb, 'crm_contacts')));
  await assertFails(
    setDoc(doc(unauthenticatedDb, 'crm_contacts', 'anonymous-write'), {
      email: 'attacker@example.com',
      source: 'unauthenticated test',
    })
  );

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'agent-1'), {
      role: 'agent',
      is_super_admin: false,
      org_id: 'org-acme',
      company_name: 'Acme',
      allowed_companies: ['Acme'],
    });
  });

  const agentDb = testEnv.authenticatedContext('agent-1').firestore();
  await assertFails(
    setDoc(doc(agentDb, 'users', 'agent-1'), { is_super_admin: true }, { merge: true })
  );
  await assertSucceeds(
    setDoc(doc(agentDb, 'crm_contacts', 'same-org'), {
      email: 'agent@acme.example',
      org_id: 'org-acme',
    })
  );
  await assertFails(
    setDoc(doc(agentDb, 'crm_contacts', 'other-org'), {
      email: 'other@example.com',
      org_id: 'org-other',
    })
  );

  console.log('Firestore rules emulator checks passed.');
} finally {
  await testEnv.cleanup();
}
