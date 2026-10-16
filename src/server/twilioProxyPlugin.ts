import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * CRMos - Twilio Backend Proxy Plugin for Vite
 * Eliminates browser CORS limitations by routing Twilio REST API calls via Node.js
 */
export function twilioProxyPlugin(): Plugin {
  return {
    name: 'crmos-twilio-proxy',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/twilio/')) {
          return next();
        }

        // Helper to parse JSON request body
        const readBody = <T = Record<string, unknown>>(): Promise<T> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : ({} as T));
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        // 1. OUTBOUND CALL ENDPOINT
        if (req.url === '/api/twilio/call' && req.method === 'POST') {
          try {
            const body = await readBody<{
              accountSid: string;
              authToken: string;
              to: string;
              from: string;
              webhookUrl?: string;
              twiml?: string;
              recording?: boolean;
            }>();

            const { accountSid, authToken, to, from, webhookUrl, twiml, recording } = body;

            if (!accountSid || !authToken) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Twilio Account SID en Auth Token zijn verplicht.',
                })
              );
              return;
            }

            if (!to || !from) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Zowel het bestemmingsnummer als het Twilio afzendernummer zijn verplicht.',
                })
              );
              return;
            }

            const formData = new URLSearchParams();
            formData.append('To', to);
            formData.append('From', from);

            if (twiml) {
              formData.append('Twiml', twiml);
            } else if (webhookUrl) {
              formData.append('Url', webhookUrl);
            } else {
              // Standard professional Dutch voice response so call is immediately audible upon pickup
              const defaultTwiml = `
                <Response>
                  <Say language="nl-NL" voice="Polly.Lotte">
                    Welkom bij CRMos. Dit is een testoproep via uw Twilio spraakverbinding.
                    De verbinding werkt uitstekend. U kunt nu direct bellen en gebeld worden vanuit het CRMos Contact Center.
                  </Say>
                  <Pause length="1"/>
                  <Say language="nl-NL" voice="Polly.Lotte">
                    Fijne werkdag gewenst namens het CRMos team.
                  </Say>
                </Response>
              `.trim();
              formData.append('Twiml', defaultTwiml);
            }

            if (recording) {
              formData.append('Record', 'true');
            }

            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
            const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

            const twilioRes = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            });

            const data = (await twilioRes.json()) as any;

            res.writeHead(twilioRes.status, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: twilioRes.ok,
                callSid: data.sid,
                status: data.status,
                raw: data,
                message: twilioRes.ok
                  ? `Twilio oproep succesvol gestart naar ${to} (SID: ${data.sid})`
                  : `Twilio fout (${data.code || twilioRes.status}): ${data.message || 'Onbekende fout'}`,
              })
            );
          } catch (err: unknown) {
            const msg = (err as Error)?.message || 'Interne fout bij bellen via Twilio proxy.';
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: msg }));
          }
          return;
        }

        // 2. VERIFY CREDENTIALS & FETCH PHONE NUMBERS ENDPOINT
        if (req.url === '/api/twilio/verify' && req.method === 'POST') {
          try {
            const body = await readBody<{
              accountSid: string;
              authToken: string;
            }>();

            const { accountSid, authToken } = body;

            if (!accountSid || !authToken) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  valid: false,
                  message: 'Twilio Account SID en Auth Token zijn verplicht.',
                })
              );
              return;
            }

            const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
              headers: { Authorization: `Basic ${basicAuth}` },
            });

            if (!accRes.ok) {
              const errData = (await accRes.json()) as any;
              res.writeHead(accRes.status, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  valid: false,
                  message:
                    errData.message || 'Verificatie mislukt. Controleer je Twilio Account SID en Auth Token.',
                  code: errData.code,
                })
              );
              return;
            }

            const accountData = (await accRes.json()) as any;

            // Fetch active Twilio incoming phone numbers for 1-click selection
            let phoneNumbers: Array<{ phoneNumber: string; friendlyName: string }> = [];
            try {
              const numRes = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
                {
                  headers: { Authorization: `Basic ${basicAuth}` },
                }
              );
              if (numRes.ok) {
                const numData = (await numRes.json()) as any;
                phoneNumbers = (numData.incoming_phone_numbers || []).map(
                  (n: { phone_number: string; friendly_name?: string }) => ({
                    phoneNumber: n.phone_number,
                    friendlyName: n.friendly_name || n.phone_number,
                  })
                );
              }
            } catch (numErr) {
              console.warn('Kon inkomende telefoonnummers niet ophalen:', numErr);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                valid: true,
                friendlyName: accountData.friendly_name,
                status: accountData.status,
                type: accountData.type,
                phoneNumbers,
                message: `Twilio Account geverifieerd: "${accountData.friendly_name}" (${accountData.type})`,
              })
            );
          } catch (err: unknown) {
            const msg = (err as Error)?.message || 'Fout bij verifiëren van Twilio account.';
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: false, message: msg }));
          }
          return;
        }

        // 3. TWIML VOICE WEBHOOK ENDPOINT
        if (req.url === '/api/twilio/twiml') {
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(`
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say language="nl-NL" voice="Polly.Lotte">
                Welkom bij CRMos. U bent verbonden met de spraakservice.
              </Say>
            </Response>
          `.trim());
          return;
        }

        next();
      });
    },
  };
}
