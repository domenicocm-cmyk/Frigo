import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=new URL('..',import.meta.url), source=readFileSync(new URL('../FleetPlatform.jsx',import.meta.url),'utf8');
const routes=[...source.slice(source.indexOf('const NAV = ['),source.indexOf('// TRANSFER WORKFLOW MODAL')).matchAll(/id: "([^"]+)", label: "([^"]+)"/g)].map(([,id,label])=>({id,label})).concat({id:'utenti',label:'Utenti & Permessi'});
const groups=[...source.slice(source.indexOf('const NAV_STRUCTURE = ['),source.indexOf('function NewRecordButton')).matchAll(/group: "[^"]+", label: "([^"]+)"/g)].map(m=>m[1]);
const directory=mkdtempSync(join(tmpdir(),'fleet-ui-')), port=42000+Math.floor(Math.random()*5000), origin=`http://localhost:${port}`;
const env={...process.env,HOST:'127.0.0.1',FLEET_DATA_DIR:directory,PORT:String(port),FLEET_ORIGIN:origin,FLEET_COOKIE_SECURE:'false',FLEET_ADMIN_USER:'uiadmin',FLEET_ADMIN_NAME:'Amministratore',FLEET_ADMIN_EMAIL:'',FLEET_ADMIN_PASSWORD:'UI-private-test-passphrase',FLEET_COMPANY_ID:'matherion',FLEET_COMPANY_NAME:'Matherion S.r.l.'};
let server,dom,w,cookie='',errors=[],downloads=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const button=(label,scope=w.document)=>[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
function fill(input,value){assert.ok(input,'input exists');const proto=input.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new w.Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));}
async function expandGroups(){for(const label of groups){const b=button(label,w.document.querySelector('aside'));if(b && b.parentElement.querySelectorAll('button').length===1){b.click();await wait(10);}}}
async function navigate(label){await expandGroups();const b=button(label,w.document.querySelector('aside'));assert.ok(b,`navigation exists: ${label}`);b.click();await wait(160);}
async function api(path,method='GET',data){const response=await w.fetch(path,{method,headers:{'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:response.status,...await response.json()};}
before(async()=>{
 const result=spawnSync(process.execPath,['server.mjs','--bootstrap'],{cwd:root,env,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 server=spawn(process.execPath,['server.mjs'],{cwd:root,env,stdio:'ignore'});
 for(let i=0;i<100;i++){try{await fetch(origin+'/api/auth/session');break;}catch{await wait(20);}}
 const out=await build({entryPoints:[new URL('../main.jsx',import.meta.url).pathname],bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
 const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));vc.on('error',(...args)=>errors.push(args.map(x=>x?.message||String(x)).join(' ')));
 dom=new JSDOM('<div id="root"></div>',{url:origin,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});w=dom.window;
 w.fetch=async(path,options={})=>{const response=await fetch(new URL(path,origin),{...options,headers:{...options.headers,Origin:origin,...(cookie?{Cookie:cookie}:{})}});const next=response.headers.get('set-cookie');if(next)cookie=next.split(';')[0];return response;};
 w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.confirm=()=>true;w.alert=()=>{};w.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 w.eval(out.outputFiles[0].text);await wait(200);
 const inputs=w.document.querySelectorAll('input');fill(inputs[0],'uiadmin');fill(inputs[1],env.FLEET_ADMIN_PASSWORD);await wait(20);
 w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(1000);
 const reject=button('Rifiuta i non necessari');if(reject){reject.click();await wait(100);}
 assert.match(w.document.body.textContent,/Fleet Control Tower/);
});
after(()=>{dom?.window.close();server?.kill();rmSync(directory,{recursive:true,force:true});});
for(const route of routes)test(`UI opens ${route.id}: ${route.label}`,async()=>{
 const count=errors.length;await navigate(route.label);
 assert.ok(w.document.querySelector('main')?.textContent.trim(),`nonempty page ${route.id}`);
 assert.doesNotMatch(w.document.querySelector('main').textContent,/La sezione .* non si è aperta/);
 assert.deepEqual(errors.slice(count),[],`no runtime errors in ${route.id}`);
});
test('UI creates a vehicle and preserves company, engine details and driver after server save',async()=>{
 await navigate('Anagrafica Flotta');button('Nuovo veicolo').click();await wait(30);
 async function field(label,value){const p=[...w.document.querySelectorAll('p')].find(p=>p.textContent.trim().replace(/ \*$/,'')===label);assert.ok(p,`field ${label}`);fill(p.parentElement.querySelector('input,select'),value);await wait(10);}
 await field('Telaio (VIN)','ZFA00000000000001');await field('Targa','ZZ999ZZ');await field('N° Carta di circolazione','DOC-TEST');
 button('Omologazione').click();await wait(10);await field('Marca','Fiat');await field('Modello','Ducato TEST');await field('Versione','L2H2');
 button('Gestione').click();await wait(10);await field('Km attuali','1000');await field('Conducente','Autista Test');
 const company=[...w.document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='matherion'));assert.ok(company);assert.equal(company.value,'matherion');
 button('Aggiungi veicolo').click();await wait(700);
 const saved=await api('/api/store/vehicles');assert.equal(saved.data.length,1);const v=saved.data[0];assert.equal(v.company,'matherion');assert.equal(v.driver,'Autista Test');assert.equal(v.docNumber,'DOC-TEST');assert.equal(v.version,'L2H2');assert.equal(v.km,1000);
});
test('UI dashboard count reflects saved vehicle rather than demo data',async()=>{
 await navigate('Dashboard');const main=w.document.querySelector('main');assert.match(main.textContent,/Veicoli totali1/);assert.doesNotMatch(main.textContent,/Demo Partner|Demo Trasporti/);
});
test('UI required fields prevent saving an empty vehicle',async()=>{
 await navigate('Anagrafica Flotta');button('Nuovo veicolo').click();await wait(20);button('Aggiungi veicolo').click();await wait(20);assert.match(w.document.body.textContent,/campi obbligatori da compilare/);assert.equal((await api('/api/store/vehicles')).data.length,1);
 const heading=[...w.document.querySelectorAll('h3')].find(h=>h.textContent==='Nuovo veicolo');heading?.parentElement.querySelector('button').click();await wait(20);
});

async function formField(label,value){const p=[...w.document.querySelectorAll('p')].find(p=>p.textContent.trim().replace(/ \*$/,'')===label);assert.ok(p,`field ${label}`);fill(p.parentElement.querySelector('input,select'),value);await wait(10);}
function readBlob(blob,mode='text'){return new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;if(mode==='text')r.readAsText(blob);else r.readAsArrayBuffer(blob);});}
test('UI creates a contract linked to the saved vehicle',async()=>{
 await navigate('Contratti');button('Nuovo contratto').click();await wait(20);
 await formField('Targa','ZZ999ZZ');await formField('Tipo','noleggio');await formField('Fornitore','Fornitore Test');await formField('Decorrenza','2026-01-01');await formField('Scadenza','2027-12-31');await formField('Canone mensile (€)','650');
 button('Aggiungi contratto').click();await wait(700);const result=await api('/api/store/contracts');assert.equal(result.data.length,1);assert.equal(result.data[0].vehicle,'ZZ999ZZ');assert.equal(Number(result.data[0].fee),650);
});
test('UI tire records survive leaving and reopening the module',async()=>{
 await navigate('Pneumatici');button('Nuovo pneumatico').click();await wait(20);await formField('Targa','ZZ999ZZ');await formField('Posizione','Ant. Sx');await formField('Misura','205/55 R16');button('Aggiungi').click();await wait(700);
 assert.equal((await api('/api/store/tires')).data.length,1);await navigate('Dashboard');await navigate('Pneumatici');assert.match(w.document.querySelector('main').textContent,/205\/55 R16/);
});
test('UI deadline remaining days uses the current Rome date',async()=>{
 await navigate('Scadenze & Compliance');button('Nuova scadenza').click();await wait(20);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 await formField('Targa','ZZ999ZZ');await formField('Tipo scadenza','Revisione');await formField('Data scadenza',today);button('Aggiungi scadenza').click();await wait(700);assert.match(w.document.querySelector('main').textContent,/0 giorni/);
});
test('UI exports a genuine Excel workbook with saved vehicle and company',async()=>{
 await navigate('Anagrafica Flotta');downloads=[];button('Esporta Excel').click();await wait(500);assert.equal(downloads.length,1);
 const XLSX=await import('xlsx');const bytes=await readBlob(downloads[0],'array');const book=XLSX.read(Buffer.from(bytes));const rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);assert.equal(rows[0].Targa,'ZZ999ZZ');assert.equal(rows[0]['Società'],'Matherion S.r.l.');
});
let backup;
test('UI backup contains persisted vehicle, contract and tires without identities or credentials',async()=>{
 await navigate('Dati & Backup');downloads=[];button('Esporta tutti i dati').click();await wait(700);assert.equal(downloads.length,1);
 backup=JSON.parse(await readBlob(downloads[0]));assert.equal(backup.dati.vehicles[0].plate,'ZZ999ZZ');assert.equal(backup.dati.contracts.length,1);assert.equal(backup.dati.tires.length,1);assert.equal(backup.dati.users,undefined);assert.doesNotMatch(JSON.stringify(backup),/UI-private-test-passphrase|passwordHash/);
});
test('UI backup restore reads the file and restores selected application records',async()=>{
 const copy=structuredClone(backup);copy.dati.vehicles[0].km=4321;
 const input=w.document.querySelector('input[type=file][accept=".json"]');assert.ok(input);Object.defineProperty(input,'files',{value:[new w.File([JSON.stringify(copy)],'restore-test.json',{type:'application/json'})],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(50);
 button('Ripristina questi dati').click();for(let i=0;i<100&&!w.document.querySelector('main').textContent.includes('Ripristinati');i++)await wait(100);assert.match(w.document.querySelector('main').textContent,/Ripristinati/);assert.equal((await api('/api/store/vehicles')).data[0].km,4321);
});

test('UI attachment upload preserves content in server and offers download after reopening',async()=>{
 await navigate('Anagrafica Flotta');w.document.querySelector('main button[title="Documenti allegati"]').click();await wait(20);
 const input=w.document.querySelector('input[type=file][title="Carica file"]');assert.ok(input);Object.defineProperty(input,'files',{value:[new w.File(['documento di prova'],'prova.txt',{type:'text/plain'})],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(700);
 const response=await api('/api/store/attachments');assert.equal(response.data.length,1);assert.equal(response.data[0].name,'prova.txt');assert.equal(Buffer.from(response.data[0].dataUrl.split(',')[1],'base64').toString(),'documento di prova');
 const close=[...w.document.querySelectorAll('p')].find(p=>p.textContent==='DOCUMENTI ALLEGATI').parentElement.parentElement.querySelector('button');close.click();await wait(10);
 w.document.querySelector('main button[title="Documenti allegati"]').click();await wait(10);assert.equal(w.document.querySelector('a[title="Scarica"]').getAttribute('download'),'prova.txt');
 [...w.document.querySelectorAll('p')].find(p=>p.textContent==='DOCUMENTI ALLEGATI').parentElement.parentElement.querySelector('button').click();await wait(10);
});
test('UI deletion requires password and remains in server audit',async()=>{
 await navigate('Pneumatici');w.document.querySelector('main button[title="Elimina"]').click();await wait(20);
 fill(w.document.querySelector('input[type=password]'),env.FLEET_ADMIN_PASSWORD);await wait(10);const confirm=[...w.document.querySelectorAll('form')].find(f=>f.textContent.includes('Conferma eliminazione'));confirm.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(700);
 assert.deepEqual((await api('/api/store/tires')).data,[]);const audit=await api('/api/audit');assert.ok(audit.data.some(e=>e.module==='pneumatici'&&e.userName==='Amministratore'));
 await navigate('Registro Eliminazioni');assert.match(w.document.querySelector('main').textContent,/pneumatici/);
});
test('UI administrator creates a real read-only account',async()=>{
 await navigate('Utenti & Permessi');button('Nuova utenza').click();await wait(20);
 await formField('Nome utente','ui.reader');await formField('Nome e cognome','Lettore Test');await formField('Email','reader@example.com');await formField('Password','Reader-test-2026');await formField('Conferma password','Reader-test-2026');button('Sola lettura').click();await wait(10);button('Registra utenza').click();await wait(700);
 const result=await api('/api/store/users');const reader=result.data.find(u=>u.username==='ui.reader');assert.ok(reader);assert.equal(reader.company,'matherion');assert.equal(reader.password,undefined);assert.equal(reader.permissions.flotta,'view');
});
test('UI logout and read-only login hide mutation controls including attachments',async()=>{
 button('Esci',w.document.querySelector('aside')).click();await wait(150);assert.equal(w.document.querySelector('aside'),null);
 const inputs=w.document.querySelectorAll('input');fill(inputs[0],'ui.reader');fill(inputs[1],'Reader-test-2026');await wait(10);w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(900);
 await navigate('Anagrafica Flotta');assert.equal(button('Nuovo veicolo'),undefined);assert.equal(w.document.querySelector('main button[title="Elimina"]'),null);assert.equal(w.document.querySelector('main button[title="Modifica"]'),null);
 w.document.querySelector('main button[title="Documenti allegati"]').click();await wait(20);assert.ok(w.document.querySelector('a[title="Scarica"]'));assert.equal(w.document.querySelector('button[title="Elimina"]'),null);assert.equal(w.document.querySelector('input[type=file][title="Carica file"]').disabled,true);
});
