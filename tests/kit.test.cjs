const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.existsSync(path.join(__dirname, '../kit-model.js')) ? fs.readFileSync(path.join(__dirname, '../kit-model.js'), 'utf8') : '';
const sandbox = {}; vm.runInNewContext(source, sandbox);
const M = sandbox.CampusKit || {};
function app(saved) {
 const nodes = new Map(); const handlers={}; const store={...(saved || {})};
 const node = key => {if(!nodes.has(key)) nodes.set(key,{textContent:'',innerHTML:'',dataset:{},value:'',hidden:false}); return nodes.get(key);};
 const controls=[];
 const root={querySelector:node,querySelectorAll:()=>controls,addEventListener:(name,fn)=>handlers[name]=fn,contains:()=>false};
 const context={CampusKit:M, document:{getElementById:()=>root,activeElement:null},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},FormData:class {constructor(f){this.values=f.values;}get(k){return this.values[k] || '';}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
 return {nodes,store,controls,context,click(action,val=''){handlers.click({target:{closest:()=>({dataset:{action,val}})}});},submit(type,values){handlers.submit({preventDefault(){},target:{values,matches:s=>s===`[data-${type}]`}});},html:()=>node('[data-page]').innerHTML};
} 
test('requests show linked kit progress and physical units', () => {
 const a=app(); a.click('request','RQ-214');
 assert.match(a.html(),/Not started/); assert.match(a.html(),/Not yet issued/); assert.match(a.html(),/data-action="issue-request"/);
});

test('return confirmation requires the exact physical unit and a named returner', () => {
 const a=app(); a.click('return','401');
 assert.match(a.html(),/Which unit is in your hand/);
 a.submit('return',{asset:'AD-15',returnedBy:'Leela Das'});
 assert.equal(JSON.parse(a.store['campus-stores.shift.v2']).loans[0].back,false);
 a.submit('return',{asset:'MI-09',returnedBy:''});
 assert.equal(JSON.parse(a.store['campus-stores.shift.v2']).loans[0].back,false);
 a.submit('return',{asset:'MI-09',returnedBy:'Tara Shah'});
 const l=JSON.parse(a.store['campus-stores.shift.v2']).loans[0];
 assert.equal(l.back,true); assert.equal(l.returnedBy,'Tara Shah'); assert.equal(l.returnedAt,0);
});
test('custody records holder, reason and agreed return without changing original collector', () => {
 const a=app(); a.click('custody','401'); assert.match(a.html(),/Current holder/);
 a.submit('custody',{holder:'Leela Das',reason:'',due:'Sat 9 am'});
 assert.equal(JSON.parse(a.store['campus-stores.shift.v2']).loans[0].who,'Tara Shah');
 assert.notEqual(JSON.parse(a.store['campus-stores.shift.v2']).loans[0].holder,'Leela Das');
 a.submit('custody',{holder:'Leela Das',reason:'Tara confirmed the handoff',due:'Sat 9 am'});
 const l=JSON.parse(a.store['campus-stores.shift.v2']).loans[0];
 assert.equal(l.holder,'Leela Das'); assert.equal(l.who,'Tara Shah'); assert.equal(l.due,'Sat 9 am');
 assert.equal(l.custody.at(-1).reason,'Tara confirmed the handoff'); assert.equal(l.custody.at(-1).due,'Sat 9 am');
 a.click('tab','Inventory'); assert.match(a.html(),/Leela Das/);
});
test('handover snapshots outstanding loans and is linked and pinned next shift', () => {
 const a=app(); a.click('tab','Desk book'); a.submit('note',{note:''});
 let d=JSON.parse(a.store['campus-stores.shift.v2']);
 assert.equal(d.notes.length,1); assert.equal(d.notes[0].outstanding[0].asset,'MI-09');
 assert.equal(d.notes[0].outstanding[0].req,'RQ-209');
 a.click('return','401'); a.submit('return',{asset:'MI-09',returnedBy:'Tara Shah'});
 a.click('advance');
 assert.match(a.nodes.get('[data-handover]').innerHTML,/MI-09/);
 assert.match(a.nodes.get('[data-handover]').innerHTML,/Snapshot/);
 a.click('tab','Desk book'); assert.match(a.html(),/data-action="request"/);
 a.click('request','RQ-209'); assert.match(a.html(),/Finals rehearsal/);
});
test('v1 migrates to validated v2 without losing slips; malformed v2 resets safely', () => {
 const old={version:1,tab:'Requests',phase:1,selected:'RQ-209',notes:[],loans:[{num:401,req:'RQ-209',asset:'MI-09',who:'Tara Shah',due:'Sat 10 am',back:false}]};
 const a=app({'campus-stores.shift.v1':JSON.stringify(old)}); a.click('tab','Loan register');
 const migrated=JSON.parse(a.store['campus-stores.shift.v2']);
 assert.equal(migrated.version,2); assert.equal(migrated.loans[0].holder,'Tara Shah'); assert.equal(migrated.phase,1);
 const b=app({'campus-stores.shift.v2':JSON.stringify({...migrated,loans:[{...migrated.loans[0],back:'yes'}]})});
 b.click('tab','Loan register'); assert.equal(JSON.parse(b.store['campus-stores.shift.v2']).loans[0].back,false);
});
test('linked issue prefills request and retains guards and collector context', () => {
 const a=app(); a.click('issue-request','RQ-214');
 assert.equal(a.nodes.get('[name="req"]').value,'RQ-214');
 assert.equal(a.nodes.get('[name="due"]').value,'Fri 8 pm');
 assert.match(a.html(),/USB-C-only laptop/);
 const issue=(asset,req='RQ-214')=>a.submit('issue',{asset,req,who:'Kabir Sen',due:'Fri 8 pm'});
 issue('PR-06'); issue('CA-03'); issue('MI-09','RQ-209');
 issue('AD-12'); issue('AD-15');
 assert.equal(JSON.parse(a.store['campus-stores.shift.v2']).loans.length,2);
});
test('repaint restores active named control focus and selection', () => {
 const a=app(); let focused=false, selection;
 const active={name:'note',value:'Remember Leela',selectionStart:3,selectionEnd:6,closest:()=>({getAttribute:()=> 'data-note',dataset:{note:''}}),getAttribute:k=>k==='name'?'note':null};
 a.context.document.activeElement=active;
 a.nodes.set('[name="note"]',{value:'',focus:()=>{focused=true;},setSelectionRange:(x,y)=>selection=[x,y]});
 a.click('advance'); assert.equal(focused,true); assert.deepEqual(selection,[3,6]);
 assert.equal(a.nodes.get('[name="note"]').value,'Remember Leela');
});
test('Film Society vertical shift keeps adapter custody evidence and closes only matching unit', () => {
 const a=app();
 for(const asset of ['PR-04','SP-02','AD-12']) {a.click('issue-request','RQ-214'); a.submit('issue',{asset,req:'RQ-214',who:'Kabir Sen',due:'Fri 8 pm'});}
 a.click('advance');
 for(const [num,asset] of [[402,'PR-04'],[403,'SP-02']]){a.click('return',String(num));a.submit('return',{asset,returnedBy:'Kabir Sen'});}
 a.click('custody','404'); a.submit('custody',{holder:'Leela Das',due:'Sat 9 am',reason:'Kabir confirmed Leela will return the adapter'});
 a.click('request','RQ-214'); assert.match(a.html(),/Partly returned/); assert.match(a.html(),/2 of 3/);
 assert.match(a.html(),/Kabir confirmed Leela will return the adapter/);
 assert.match(a.html(),/Still out: AD-12 · with Leela Das · agreed return Sat 9 am/);
 assert.match(a.html(),/Returned to desk · Collected by Kabir Sen/);
 assert.doesNotMatch(a.html(),/Returned · Collected by Kabir Sen · Holder: Kabir Sen/);
 a.click('tab','Desk book');a.submit('note',{note:'Check the adapter label'}); a.click('advance');
 assert.match(a.nodes.get('[data-handover]').innerHTML,/Leela Das/);
 a.click('return','404');a.submit('return',{asset:'AD-15',returnedBy:'Leela Das'});
 assert.equal(JSON.parse(a.store['campus-stores.shift.v2']).loans.at(-1).back,false);
 a.submit('return',{asset:'AD-12',returnedBy:'Leela Das'});a.click('request','RQ-214');
 assert.match(a.html(),/Complete/);assert.match(a.html(),/Returned by Leela Das/);
});
test('opening a return check focuses its unit field', () => {
 const a=app();let focused=false;
 a.nodes.set('[data-return] [name="asset"]',{focus:()=>focused=true});
 a.click('return','401'); assert.equal(focused,true);
});
test('successful handover clears the submitted note instead of replaying its draft', () => {
 const a=app();a.click('tab','Desk book');
 const control={name:'note',value:'Already saved'};a.controls.push(control);
 a.submit('note',{note:'Already saved'});assert.equal(control.value,'');
});
const request = { id: 'RQ-214', items: ['Projector', 'Speaker', 'Adapter'] };
const assets = [{id:'PR-04',type:'Projector'}, {id:'SP-02',type:'Speaker'}, {id:'AD-12',type:'Adapter'}, {id:'AD-15',type:'Adapter'}];
const loans = () => assets.slice(0,3).map((a,i) => ({num:402+i,req:request.id,asset:a.id,who:'Kabir Sen',holder:'Kabir Sen',due:'Fri 8 pm',back:false,custody:[]}));
test('kit tracks not started, out, partial return, complete and unissued lines', () => {
 assert.equal(typeof M.kit, 'function');
 assert.equal(M.kit(request, [], assets).status, 'Not started');
 const l = loans();
 assert.equal(M.kit(request, l, assets).status, 'Out');
 l[0].back=true; l[1].back=true;
 let k=M.kit(request,l,assets);
 assert.equal(k.status,'Partly returned'); assert.equal(k.returned,2); assert.equal(k.total,3);
 assert.equal(k.lines[2].loans[0].asset,'AD-12');
 assert.equal(M.kit(request,l.slice(0,2),assets).status,'Partly returned');
 assert.equal(M.kit(request,l.slice(0,2),assets).lines[2].state,'Not yet issued');
 l[2].back=true; assert.equal(M.kit(request,l,assets).status,'Complete');
});
