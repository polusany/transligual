import fs from 'node:fs';
const filename=process.argv[2]||'.env.production';
if(!fs.existsSync(filename)){console.error('Missing '+filename);process.exit(1);}
const env=Object.fromEntries(fs.readFileSync(filename,'utf8').split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')];}));
const required=['SITE_DOMAIN','APP_URL','DATABASE_URL','DIRECT_DATABASE_URL','AUTH_JWT_SECRET','RESEND_API_KEY','EMAIL_FROM','WEB_APP_URL','GOOGLE_TRANSLATE_API_KEY','PAYSTACK_SECRET_KEY','PAYSTACK_CALLBACK_URL'];
let failed=false;
for(const key of required){const ok=Boolean(env[key])&&!/replace|example|change-me|your-/i.test(env[key]);console.log(key+': '+(ok?'configured':'NEEDS CONFIGURATION'));if(!ok)failed=true;}
if(env.AUTH_JWT_SECRET?.length<32)failed=true;
for(const key of ['APP_URL','WEB_APP_URL','PAYSTACK_CALLBACK_URL']){try{if(new URL(env[key]).protocol!=='https:')failed=true;}catch{failed=true;}}
console.log(failed?'Preflight incomplete. No secrets were printed.':'Required values are present. Verify provider accounts and DNS before deployment.');
process.exitCode=failed?1:0;
