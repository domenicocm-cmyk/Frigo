import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../FleetPlatform.jsx',import.meta.url),'utf8');
function setup(){
 const context=vm.createContext({LIVE:{companies:[{id:'demopartner',name:'Demo'}]},statusMeta:{disponibile:{label:'Disponibile'}},availabilityLabel:{noleggio:'Noleggio'}});
 const fields=source.slice(source.indexOf('const VEHICLE_FORM_FIELDS = ['),source.indexOf('\nfunction FlottaView'));
 const helper=source.slice(source.indexOf('function initialFormValues('),source.indexOf('function SimpleFormModal('));
 vm.runInContext(fields+'\n'+helper+'\nglobalThis.fields=VEHICLE_FORM_FIELDS;globalThis.init=initialFormValues;',context);
 return context;
}
test('company choices follow hydrated company registry instead of demo snapshot',()=>{
 const c=setup();c.LIVE.companies=[{id:'matherion',name:'Matherion S.r.l.'}];
 const field=c.fields.find(f=>f.key==='company');assert.equal(field.options.length,1);assert.equal(field.options[0].value,'matherion');assert.equal(field.options[0].label,'Matherion S.r.l.');
});
test('new vehicle selects the sole actual company; existing invalid company needs explicit selection',()=>{
 const c=setup();c.LIVE.companies=[{id:'matherion',name:'Matherion S.r.l.'}];
 assert.equal(c.init(c.fields).company,'matherion');assert.equal(c.init(c.fields,{company:'demopartner'}).company,'');assert.equal(c.fields.find(f=>f.key==='company').required,true);
});
test('company choices update when a company is added without restarting app',()=>{
 const c=setup();c.LIVE.companies=[];assert.equal(c.fields.find(f=>f.key==='company').options.length,0);
 c.LIVE.companies.push({id:'matherion',name:'Matherion S.r.l.'});assert.equal(c.fields.find(f=>f.key==='company').options[0].value,'matherion');
});
