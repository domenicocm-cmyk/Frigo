import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const dir = process.env.FLEET_DATA_DIR || resolve(root, 'private-data');
mkdirSync(dir, {recursive:true, mode:0o700});
const db = new DatabaseSync(resolve(dir,'fleet.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, username TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, profile TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, userId TEXT NOT NULL, expires INTEGER NOT NULL, seen INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS stores(tenant TEXT NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(tenant,key));`);
if(!db.prepare("PRAGMA table_info(stores)").all().some(c => c.name === 'version')) db.exec('ALTER TABLE stores ADD COLUMN version INTEGER NOT NULL DEFAULT 0');
db.exec('CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, data TEXT NOT NULL)');
function commitStore(tenant,key,data,version,user,before) {
 db.exec('BEGIN IMMEDIATE');
 try {
  db.prepare('INSERT INTO stores(tenant,key,data,version) VALUES(?,?,?,?) ON CONFLICT(tenant,key) DO UPDATE SET data=excluded.data,version=excluded.version').run(tenant,key,JSON.stringify(data),version);
  if(Array.isArray(before)&&Array.isArray(data)){
   const currentIds=new Set(data.map(r=>r?.id).filter(Boolean));
   for(const record of before)if(record?.id&&!currentIds.has(record.id)){
    const event={id:randomBytes(16).toString('hex'),module:policy[key]||key,record:String(record.plate||record.name||record.number||record.id),userName:user.fullName,userRole:user.role,timestamp:new Date().toISOString()};
    db.prepare('INSERT INTO audit_events VALUES(?,?,?)').run(event.id,tenant,JSON.stringify(event));
   }
  }
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
}
const hash = password => { const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex'); };
const verify = (password, encoded) => { const [salt, digest] = encoded.split(':'); return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(digest,'hex')); };
const digest = text => createHash('sha256').update(text).digest('hex');
const roles = new Set(['super_admin','fleet_manager','amministrazione','officina','operativo','sola_lettura']);
const policy={tires:'pneumatici',vehicles:'flotta',contracts:'contratti',deadlines:'scadenze',maintenance:'manutenzione',claims:'sinistri',fines:'verbali',partners:'partner',companies:'societa',subRentals:'subnoleggio',fuelTransactions:'rifornimenti',vehicleEvents:'flotta',parts:'magazzino',stockMoves:'magazzino',transferBatches:'trasferimenti_massivi',fuelCards:'carburante',fuelCardTx:'carburante',tollDevices:'pedaggi',tollTx:'pedaggi',equipment:'dotazioni',equipmentRecords:'dotazioni',calendarEvents:'calendario',docRequirements:'conformita_doc',handovers:'prese',chatThreads:'chat',chatMessages:'chat',mailAccounts:'email',mails:'email',budgets:'budget',downtimeEvents:'flotta',subRentalInvoices:'fatturazione',supplierInvoices:'fatturazione',tankRefills:'cisterne',tanks:'cisterne',vehicleRefuels:'cisterne',cookieConsent:'compliance',attachments:'conformita_doc',__diagnostica__:'backup'};
function profile(row) {return row ? JSON.parse(row.profile) : null;}
function can(u,key,edit=false) {return u.role==='super_admin' || (key==='cookieConsent') || (edit ? u.permissions?.[policy[key]]==='edit' : ['edit','view'].includes(u.permissions?.[policy[key]]));}
function checkPassword(p) {if(typeof p!=='string'||p.length<12||p.length>256) throw new Error('La password deve contenere da 12 a 256 caratteri');}
if(process.argv.includes('--bootstrap') || process.argv.includes('--bootstrap-if-empty')) {
 if(db.prepare('SELECT count(*) n FROM users').get().n) {
  if(process.argv.includes('--bootstrap-if-empty')) {console.log('Installazione già inizializzata: account invariati.'); db.close(); process.exit(0);}
  throw new Error('Installazione già inizializzata');
 }
 const username=process.env.FLEET_ADMIN_USER, password=process.env.FLEET_ADMIN_PASSWORD, tenant=process.env.FLEET_COMPANY_ID || 'matherion';
 if(!username) throw new Error('Impostare FLEET_ADMIN_USER'); checkPassword(password);
 const id=randomBytes(16).toString('hex');
 const u={id,username:username.trim().toLowerCase(),fullName:process.env.FLEET_ADMIN_NAME || 'Amministratore',email:process.env.FLEET_ADMIN_EMAIL || '',company:tenant,role:'super_admin',active:true,permissions:{}};
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,tenant,u.username,hash(password),JSON.stringify(u));
 db.prepare('INSERT INTO stores(tenant,key,data) VALUES(?,?,?)').run(tenant,'companies',JSON.stringify([{id:tenant,name:process.env.FLEET_COMPANY_NAME || 'Matherion S.r.l.',platformEnabled:true}]));
 console.log('Amministratore creato. Nessuna password predefinita.'); db.close(); process.exit(0);
}
const dummyHash=hash(randomBytes(32).toString('hex'));
const attempts=new Map();
const cookieSecure=process.env.FLEET_COOKIE_SECURE!=='false';
const cookie=(value,maxAge)=>`fleet_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${cookieSecure?'; Secure':''}`;
function send(res,status,body,headers={}) {res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));}
async function json(req) {let b='';for await(const chunk of req){b+=chunk;if(Buffer.byteLength(b)>8*1024*1024) throw new Error('Richiesta troppo grande');}return b?JSON.parse(b):{};}
const docModules={veicolo:'flotta',contratto:'contratti',sinistro:'sinistri',partner:'partner',verbale:'verbali',manutenzione:'manutenzione',cisterna:'cisterne',utente:'utenti'};
function docCan(u,doc,edit=false){const module=docModules[doc.entityType];return !!module&&(u.role==='super_admin'||(edit?u.permissions?.[module]==='edit':['view','edit'].includes(u.permissions?.[module])));}
const origin=(process.env.FLEET_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,origin), path=url.pathname;
  if(path==='/healthz' && ['GET','HEAD'].includes(req.method)){db.prepare('SELECT 1').get();return send(res,200,{ok:true});}
  if(path.startsWith('/api/')) {
   if(!['GET','HEAD'].includes(req.method) && req.headers.origin!==origin) return send(res,403,{error:'Origine della richiesta non consentita'});
   if(path==='/api/auth/login' && req.method==='POST') {
    const now=Date.now(), ip=req.socket.remoteAddress;
    for(const [key,value] of attempts) if(value.until<now) attempts.delete(key);
    const rate=attempts.get(ip)||{count:0,until:now+900000};
    if(rate.count>=10) return send(res,429,{error:'Troppi tentativi. Riprova tra 15 minuti.'});
    const {username,password}=await json(req);
    if(typeof username!=='string'||typeof password!=='string'||username.length>254||password.length>256) return send(res,400,{error:'Credenziali non valide'});
    const row=db.prepare('SELECT * FROM users WHERE username=?').get(username.trim().toLowerCase());
    const correct=verify(password,row?.hash||dummyHash); const u=profile(row);
    if(!u?.active||!correct){rate.count++;attempts.set(ip,rate);return send(res,401,{error:'Credenziali non valide o utenza disabilitata'});}
    attempts.delete(ip);
    const token=randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires<? OR seen<?').run(now,now-1200000);
    db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),u.id,now+28800000,now);
    return send(res,200,{user:u},{'Set-Cookie':cookie(token,28800)});
   }
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('fleet_session='))?.slice(14);
   const session=token?db.prepare('SELECT * FROM sessions WHERE token=?').get(digest(token)):null;
   const row=session?db.prepare('SELECT * FROM users WHERE id=?').get(session.userId):null;
   const u=profile(row),now=Date.now();
   if(!u?.active||!session||session.expires<now||session.seen<now-1200000) return send(res,401,{error:'Sessione scaduta. Accedi nuovamente.'},{'Set-Cookie':cookie('',0)});
   if(req.headers['x-fleet-user']&&req.headers['x-fleet-user']!==u.id)return send(res,401,{error:'La sessione è cambiata. Operazione annullata.'});
   db.prepare('UPDATE sessions SET seen=? WHERE token=?').run(now,session.token);
   if(path==='/api/auth/session'&&req.method==='GET') return send(res,200,{user:u});
   if(path==='/api/auth/reauth'&&req.method==='POST'){
    const ip='reauth:'+u.id, rate=attempts.get(ip)||{count:0,until:now+900000};
    if(rate.until<now){rate.count=0;rate.until=now+900000;}
    if(rate.count>=5)return send(res,429,{error:'Troppi tentativi di conferma. Riprova più tardi.'});
    const {password}=await json(req);
    if(typeof password!=='string'||password.length>256||!verify(password,row.hash)){rate.count++;attempts.set(ip,rate);return send(res,403,{error:'Password non corretta'});}
    attempts.delete(ip);return send(res,200,{user:u});
   }
   if(path==='/api/auth/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(session.token);return send(res,200,{ok:true},{'Set-Cookie':cookie('',0)});}
   if(path==='/api/audit'&&req.method==='GET'){if(u.role!=='super_admin'&&!['view','edit'].includes(u.permissions?.audit))return send(res,200,{data:[]});return send(res,200,{data:db.prepare('SELECT data FROM audit_events WHERE tenant=? ORDER BY rowid DESC LIMIT 1000').all(row.tenant).map(r=>JSON.parse(r.data))});}
   if(!path.startsWith('/api/store/')) return send(res,404,{error:'Risorsa inesistente'});
   const key=decodeURIComponent(path.slice(11));
   if(key==='users') {
    if(req.method==='GET') {const rows=u.role==='super_admin'?db.prepare('SELECT * FROM users WHERE tenant=?').all(row.tenant):[row];return send(res,200,{data:rows.map(profile)});}
    if(u.role!=='super_admin'||req.method!=='PUT')return send(res,403,{error:'Gestione utenze riservata all’amministratore'});
    const {data}=await json(req); if(!Array.isArray(data)||!data.length) return send(res,400,{error:'Mantenere almeno un amministratore attivo'});
    const self=data.find(x=>x.id===u.id); if(!self?.active||self.role!=='super_admin') return send(res,400,{error:'Non puoi eliminare, disabilitare o declassare la tua utenza'});
    const known=db.prepare('SELECT * FROM users WHERE tenant=?').all(row.tenant); const seen=new Set();
    const updates=data.map(x=>{
     if(!x.id||seen.has(x.id)||!roles.has(x.role)||typeof x.username!=='string'||!x.username.trim())throw new Error('Utenza non valida o duplicata');seen.add(x.id);
     const owner=db.prepare('SELECT tenant FROM users WHERE id=?').get(x.id);if(owner && owner.tenant!==row.tenant)throw new Error('Identificativo utenza non disponibile');
     const old=known.find(y=>y.id===x.id);let secret=old?.hash;
     if(x.password){checkPassword(x.password);secret=hash(x.password);}if(!secret)throw new Error('Password richiesta per la nuova utenza');
     const clean={id:x.id,username:x.username.trim().toLowerCase(),fullName:String(x.fullName||''),email:String(x.email||''),company:row.tenant,active:x.active===true,role:x.role,permissions:Object.fromEntries(Object.entries(x.permissions||{}).filter(([,v])=>['none','view','edit'].includes(v)))};
     return {clean,secret,changed:!old||old.hash!==secret||old.profile!==JSON.stringify(clean)};
    });
    db.exec('BEGIN IMMEDIATE');try {
     for(const x of updates){db.prepare('INSERT INTO users VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,hash=excluded.hash,profile=excluded.profile WHERE tenant=excluded.tenant').run(x.clean.id,row.tenant,x.clean.username,x.secret,JSON.stringify(x.clean));if(x.changed) db.prepare('DELETE FROM sessions WHERE userId=? AND token<>?').run(x.clean.id,session.token);}
     for(const old of known)if(!seen.has(old.id)){db.prepare('DELETE FROM users WHERE id=?').run(old.id);db.prepare('DELETE FROM sessions WHERE userId=?').run(old.id);}
     db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    return send(res,200,{ok:true,via:'server'});
   }
   if(!Object.hasOwn(policy,key))return send(res,404,{error:'Archivio non riconosciuto'});
   const stored=db.prepare('SELECT data,version FROM stores WHERE tenant=? AND key=?').get(row.tenant,key);
   const version=stored?.version || 0;
   if(req.method==='GET') {
    if(key==='attachments'){const docs=stored?JSON.parse(stored.data):[];return send(res,200,{data:docs.filter(d=>docCan(u,d)),version});}
    if(!can(u,key))return send(res,200,{data:[],version});
    return send(res,200,{data:stored?JSON.parse(stored.data):(key==='cookieConsent'?null:key==='docRequirements'?{veicolo:['Carta di circolazione','Polizza assicurativa','Certificato di proprietà'],contratto:['Contratto di noleggio','Fattura'],sinistro:['CID / Constatazione amichevole','Fotografia'],partner:['Visura camerale']}:[]),version});
   }
   const payload=req.method==='PUT'?await json(req):null;
   // Re-read after asynchronous body parsing: another request may have committed.
   const current=db.prepare('SELECT data,version FROM stores WHERE tenant=? AND key=?').get(row.tenant,key);
   const revision=current?.version || 0;
   if(Number(req.headers['x-fleet-version'])!==revision)return send(res,409,{error:'Archivio modificato da un altro operatore. Ricarica i dati prima di ripetere la modifica.'});
   if(key!=='attachments'&&!can(u,key,true))return send(res,403,{error:'Non hai il permesso di modificare questo archivio'});
   let data=payload?.data;
   if(key==='attachments'){
    const old=current?JSON.parse(current.data):[];
    if(req.method!=='PUT'||!Array.isArray(data)||data.some(d=>!docCan(u,d))){return send(res,403,{error:'Allegati non autorizzati'});}
    const oldById=new Map(old.map(d=>[d.id,d])),ids=new Set();
    for(const d of data){if(!d.id||ids.has(d.id)||typeof d.dataUrl!=='string')return send(res,400,{error:'Allegato non valido'});ids.add(d.id);const before=oldById.get(d.id);if((!before||JSON.stringify(before)!==JSON.stringify(d))&&(!docCan(u,d,true)||(before&&!docCan(u,before,true))))return send(res,403,{error:'Modifica allegato non autorizzata'});}
    if(old.some(d=>docCan(u,d)&&!ids.has(d.id)&&!docCan(u,d,true)))return send(res,403,{error:'Eliminazione allegato non autorizzata'});
    data=[...old.filter(d=>!docCan(u,d)),...data];
   }
   if(req.method==='PUT'){
    if(data===undefined)return send(res,400,{error:'Dati mancanti'});
    if(key==='docRequirements'){if(!data||typeof data!=='object'||Array.isArray(data)||Object.values(data).some(v=>!Array.isArray(v)||v.some(x=>typeof x!=='string')))return send(res,400,{error:'Requisiti documentali non validi'});}
    else if(key==='cookieConsent'){if(data!==null&&(!data||typeof data!=='object'||Array.isArray(data)||Object.values(data).some(v=>typeof v!=='boolean')))return send(res,400,{error:'Preferenze cookie non valide'});}
    else if(key!=='__diagnostica__'&&!Array.isArray(data))return send(res,400,{error:'Archivio non valido: è richiesto un elenco'});
    commitStore(row.tenant,key,data,revision+1,u,current?JSON.parse(current.data):[]);
    return send(res,200,{ok:true,via:'server',version:revision+1});
   }
   if(req.method==='DELETE'){
    commitStore(row.tenant,key,key==='cookieConsent'?null:key==='docRequirements'?{}:[],revision+1,u,current?JSON.parse(current.data):[]);
    return send(res,200,{ok:true,version:revision+1});
   }
   return send(res,405,{error:'Metodo non consentito'});
  }
  if(req.method!=='GET')return send(res,405,{error:'Metodo non consentito'});
  const dist=resolve(root,'dist');let target=resolve(dist,'.'+decodeURIComponent(path));
  if(!target.startsWith(dist+'/')&&target!==dist)return send(res,403,{error:'Accesso negato'});
  if(!existsSync(target)||path==='/')target=resolve(dist,'index.html');
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
  res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'});res.end(readFileSync(target));
 }catch(e){console.error('Richiesta fallita:',e.message);if(!res.headersSent)send(res,400,{error:'Richiesta non valida o operazione non completata'});else res.end();}
});
const host=process.env.HOST || '127.0.0.1';
server.listen(Number(process.env.PORT||3000),host,()=>console.log('Fleet OS in ascolto su '+host+':'+ (process.env.PORT||3000)));
