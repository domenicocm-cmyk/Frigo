import {DatabaseSync} from 'node:sqlite';
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'fleet-test-'));
const port=32000+Math.floor(Math.random()*10000), origin=`http://localhost:${port}`;
const env={...process.env,HOST:'0.0.0.0',FLEET_DATA_DIR:dir,FLEET_ADMIN_USER:'admin',FLEET_ADMIN_PASSWORD:'A-secure-test-passphrase-2026',FLEET_COMPANY_ID:'tenant-a',FLEET_ORIGIN:'',RENDER_EXTERNAL_URL:origin,FLEET_COOKIE_SECURE:'false',PORT:String(port)};
let server,cookie;
async function call(path,method='GET',data,session=cookie,requestOrigin=origin){const r=await fetch(origin+path,{method,headers:{...(session?{Cookie:session}:{}),Origin:requestOrigin,'Content-Type':'application/json',...(['PUT','DELETE'].includes(method)&&path!=='/api/store/users'?{'X-Fleet-Version':String((await call(path,'GET',undefined,session)).body.version||0)}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],rawCookie:r.headers.get('set-cookie')};}
before(async()=>{
 const boot=spawnSync(process.execPath,['server.mjs','--bootstrap'],{env,cwd:new URL('..',import.meta.url),encoding:'utf8'});assert.equal(boot.status,0,boot.stderr);
 server=spawn(process.execPath,['server.mjs'],{env,cwd:new URL('..',import.meta.url),stdio:'ignore'});
 for(let i=0;i<100;i++){try{await call('/api/auth/session');break;}catch{await new Promise(r=>setTimeout(r,30));}}
});
after(()=>{server?.kill();rmSync(dir,{recursive:true,force:true});});
test('health check is available without exposing data or requiring credentials',async()=>{const response=await call('/healthz');assert.equal(response.status,200);assert.deepEqual(response.body,{ok:true});});
test('API rejects anonymous requests and wrong origin',async()=>{assert.equal((await call('/api/store/vehicles')).status,401);assert.equal((await call('/api/auth/login','POST',{username:'admin',password:env.FLEET_ADMIN_PASSWORD},null,'https://attacker.example')).status,403);});
test('real credentials, HTTP-only session, safe user DTO',async()=>{
 assert.equal((await call('/api/auth/login','POST',{username:'admin',password:'wrong'})).status,401);
 const r=await call('/api/auth/login','POST',{username:'admin',password:env.FLEET_ADMIN_PASSWORD});assert.equal(r.status,200);cookie=r.cookie;assert.ok(cookie);assert.match(r.rawCookie,/HttpOnly/);assert.match(r.rawCookie,/SameSite=Strict/);assert.equal(r.body.user.password,undefined);assert.equal(r.body.user.hash,undefined);
 assert.equal((await call('/api/auth/session')).body.user.company,'tenant-a');
});
test('writes survive reads; unknown storage keys blocked',async()=>{assert.equal((await call('/api/store/vehicles','PUT',{data:[{id:'v1',plate:'AB123CD'}]})).status,200);assert.equal((await call('/api/store/vehicles')).body.data[0].plate,'AB123CD');assert.equal((await call('/api/store/arbitrary','PUT',{data:[]})).status,404);});
test('cannot delete own administrator',async()=>{assert.equal((await call('/api/store/users','PUT',{data:[]})).status,400);});
test('reader cannot mutate data, escalate role, or read hidden modules',async()=>{
 const users=(await call('/api/store/users')).body.data;
 const reader={id:'reader',username:'reader',password:'Reader-strong-passphrase',fullName:'Reader',active:true,role:'sola_lettura',permissions:{flotta:'view'}};
 assert.equal((await call('/api/store/users','PUT',{data:[...users,reader]})).status,200);
 const login=await call('/api/auth/login','POST',{username:'reader',password:reader.password},null);assert.equal(login.status,200);
 assert.equal((await call('/api/store/vehicles','PUT',{data:[]},login.cookie)).status,403);
 assert.equal((await call('/api/store/users','PUT',{data:users},login.cookie)).status,403);
 assert.deepEqual((await call('/api/store/contracts','GET',undefined,login.cookie)).body.data,[]);
 assert.equal((await call('/api/store/vehicles','GET',undefined,login.cookie)).body.data.length,1);
});
test('stale writes cannot overwrite newer data',async()=>{
 const before=await call('/api/store/vehicles');
 await call('/api/store/vehicles','PUT',{data:[{id:'latest'}]});
 const response=await fetch(origin+'/api/store/vehicles',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-Fleet-Version':String(before.body.version)},body:JSON.stringify({data:[{id:'stale'}]})});
 assert.equal(response.status,409);assert.equal((await call('/api/store/vehicles')).body.data[0].id,'latest');
});
test('deletion confirmation requires current account password',async()=>{
 assert.equal((await call('/api/auth/reauth','POST',{password:'2026'})).status,403);
 assert.equal((await call('/api/auth/reauth','POST',{password:env.FLEET_ADMIN_PASSWORD})).status,200);
});
test('attachments persist and are hidden from unrelated modules',async()=>{
 assert.equal((await call('/api/store/attachments','PUT',{data:[{id:'doc1',entityType:'contratto',entityId:'c1',name:'test.txt',dataUrl:'data:text/plain;base64,dGVzdA=='}]})).status,200);
 const login=await call('/api/auth/login','POST',{username:'reader',password:'Reader-strong-passphrase'},null);
 assert.deepEqual((await call('/api/store/attachments','GET',undefined,login.cookie)).body.data,[]);
 assert.equal((await call('/api/store/attachments')).body.data.length,1);
});
test('different tenant cannot read or overwrite the first company',async()=>{
 const database=new DatabaseSync(join(dir,'fleet.sqlite'));
 const admin=database.prepare('SELECT * FROM users WHERE username=?').get('admin');
 const other={...JSON.parse(admin.profile),id:'tenant-b-admin',username:'other-admin',company:'tenant-b'};
 database.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(other.id,'tenant-b',other.username,admin.hash,JSON.stringify(other));database.close();
 const login=await call('/api/auth/login','POST',{username:other.username,password:env.FLEET_ADMIN_PASSWORD},null);
 assert.equal(login.status,200);assert.deepEqual((await call('/api/store/vehicles','GET',undefined,login.cookie)).body.data,[]);
 await call('/api/store/vehicles','PUT',{data:[{id:'other-company'}]},login.cookie);
 assert.equal((await call('/api/store/vehicles')).body.data[0].id,'latest');
});
test('administrator cannot modify an identity belonging to another tenant',async()=>{
 const users=(await call('/api/store/users')).body.data;
 const response=await call('/api/store/users','PUT',{data:[...users,{id:'tenant-b-admin',username:'intrusion',password:'Intrusion-test-password',fullName:'Invalid',role:'super_admin',active:true,permissions:{}}]});
 assert.equal(response.status,400);
});

for(const [key,data] of Object.entries({contracts:[{id:'contract-1',vehicle:'latest',fee:650}],deadlines:[{id:'deadline-1',due:'2027-01-01'}],maintenance:[{id:'maintenance-1',cost:200,status:'completata'}],claims:[{id:'claim-1',damage:1000,status:'aperto'}],fines:[{id:'fine-1',amount:50}],subRentals:[{id:'rental-1',fee:700,vehicleCost:650}],fuelTransactions:[{id:'fuel-1',amount:100,litres:50}],calendarEvents:[{id:'event-1',title:'Test calendario'}],budgets:[{id:'budget-1',budget:2000}],tires:[{id:'tire-1',size:'205/55 R16'}]}))test(`business archive ${key} supports create, update, deletion and audit`,async()=>{
 assert.equal((await call('/api/store/'+key,'PUT',{data})).status,200);assert.deepEqual((await call('/api/store/'+key)).body.data,data);
 const update=[{...data[0],note:'Aggiornato'}];assert.equal((await call('/api/store/'+key,'PUT',{data:update})).status,200);assert.deepEqual((await call('/api/store/'+key)).body.data,update);
 assert.equal((await call('/api/store/'+key,'PUT',{data:[]})).status,200);assert.deepEqual((await call('/api/store/'+key)).body.data,[]);
 const audit=(await call('/api/audit')).body.data;assert.ok(audit.some(e=>e.record===data[0].id&&e.userName==='Amministratore'));
});
test('malformed archive cannot replace a valid record list',async()=>{
 const before=(await call('/api/store/vehicles')).body.data;assert.equal((await call('/api/store/vehicles','PUT',{data:'corrupted'})).status,400);assert.deepEqual((await call('/api/store/vehicles')).body.data,before);
});
test('document requirements and cookie settings retain correct object shapes',async()=>{
 assert.equal((await call('/api/store/docRequirements','PUT',{data:{veicolo:['Libretto']}})).status,200);
 assert.equal((await call('/api/store/docRequirements','PUT',{data:[]})).status,400);
 assert.equal((await call('/api/store/cookieConsent','PUT',{data:{tecnici:true}})).status,200);
 assert.equal((await call('/api/store/cookieConsent','PUT',{data:{tecnici:'yes'}})).status,400);
});
test('audit endpoint cannot be altered by any client',async()=>{assert.equal((await call('/api/audit','PUT',{data:[]})).status,404);});

test('concurrent updates of the same revision accept exactly one writer',async()=>{
 const version=(await call('/api/store/vehicles')).body.version;
 const send=value=>fetch(origin+'/api/store/vehicles',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-Fleet-Version':String(version)},body:JSON.stringify({data:[{id:value}]})});
 const responses=await Promise.all([send('concurrent-a'),send('concurrent-b')]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
});
test('a fleet of 3500 vehicles survives storage round trip',async()=>{
 const fleet=Array.from({length:3500},(_,i)=>({id:'large-'+i,plate:'TEST'+i,make:'Fiat',model:'Ducato',km:i,status:'disponibile',company:'tenant-a'}));
 assert.equal((await call('/api/store/vehicles','PUT',{data:fleet})).status,200);const result=(await call('/api/store/vehicles')).body.data;assert.equal(result.length,3500);assert.equal(result[3499].plate,'TEST3499');
});
test('records, sessions and deletion audit survive server restart',async()=>{
 const before=(await call('/api/store/vehicles')).body.data, audit=(await call('/api/audit')).body.data;
 const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;
 server=spawn(process.execPath,['server.mjs'],{env,cwd:new URL('..',import.meta.url),stdio:'ignore'});
 for(let i=0;i<100;i++){try{await call('/api/auth/session');break;}catch{await new Promise(r=>setTimeout(r,20));}}
 assert.equal((await call('/api/auth/session')).status,200);assert.deepEqual((await call('/api/store/vehicles')).body.data,before);assert.equal((await call('/api/audit')).body.data.length,audit.length);
});
test('idle session expires and requires authenticating again',async()=>{
 const database=new DatabaseSync(join(dir,'fleet.sqlite'));const user=database.prepare('SELECT id FROM users WHERE username=?').get('admin');database.prepare('UPDATE sessions SET seen=0 WHERE userId=?').run(user.id);database.close();assert.equal((await call('/api/store/vehicles')).status,401);
 const login=await call('/api/auth/login','POST',{username:'admin',password:env.FLEET_ADMIN_PASSWORD});assert.equal(login.status,200);cookie=login.cookie;
});
test('logout invalidates session',async()=>{assert.equal((await call('/api/auth/logout','POST')).status,200);assert.equal((await call('/api/store/vehicles')).status,401);});
