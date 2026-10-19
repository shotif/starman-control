// Checks that each service's key works, without making (or paying for) a picture: lists the models
// the key can use and says whether the default image model is among them.
//
//   npm run art:ping

import { apiKey, KEY_NAMES } from './env.ts';
import { DEFAULT_MODELS, PROVIDERS, imageModelsFromPing, pingRequest } from './providers.ts';

let failures = 0;
for (const provider of PROVIDERS) {
  const key = apiKey(provider);
  if (!key) {
    console.log(`${provider}: no ${KEY_NAMES[provider]} set.`);
    failures++;
    continue;
  }
  const call = pingRequest(provider, key);
  try {
    const res = await fetch(call.url, call.init);
    if (!res.ok) {
      console.log(`${provider}: the key was refused (${res.status}): ${(await res.text()).slice(0, 300)}`);
      failures++;
      continue;
    }
    const models = imageModelsFromPing(provider, await res.json());
    const def = DEFAULT_MODELS[provider];
    console.log(`${provider}: key works. Image models: ${models.join(', ') || '(none listed)'}`);
    console.log(`${provider}: default ${def} is ${models.includes(def) ? 'available' : 'NOT listed for this key'}.`);
  } catch (err) {
    console.log(`${provider}: could not reach the service: ${(err as Error).message}`);
    failures++;
  }
}
process.exit(failures > 0 ? 1 : 0);
