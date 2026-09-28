const origin=process.env.MONITOR_ORIGIN;
if(!origin || new URL(origin).protocol!=='https:') throw new Error('Set MONITOR_ORIGIN to the HTTPS website origin.');
let failed=false;
for(const path of ['/','/api/v1/health/ready','/services/translation','/courses']){
 try {const r=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('HTTP '+r.status);console.log(JSON.stringify({time:new Date().toISOString(),path,status:'ok'}));}
 catch(e){failed=true;console.error(JSON.stringify({time:new Date().toISOString(),path,status:'failed',message:e.message}));}
}
process.exitCode=failed?1:0;
