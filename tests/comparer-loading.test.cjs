const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({cached=false}={}){
 const events=new Map();
 const node=()=>({dataset:{},style:{setProperty(k,v){this[k]=v;}},classList:{add(){},remove(){}},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){events.set(this.name+':'+k,fn);},getBoundingClientRect:()=>({left:0,right:100,top:0,bottom:100,width:100}),setPointerCapture(){},releasePointerCapture(){}});
 const stage=Object.assign(node(),{name:'stage'}),handle=Object.assign(node(),{name:'handle'});
 let decoded;const effect=Object.assign(node(),{name:'effect',complete:cached,naturalWidth:cached?1600:0,decode:()=>new Promise(r=>decoded=r)});
 const original=Object.assign(node(),{name:'original',complete:false,naturalWidth:0,dataset:{src:'before-preview.webp'}});
 const el=node(),map={'.compare-stage':stage,'.compare-handle-line':handle,'.compare-after':effect,'.compare-before':original};el.querySelector=s=>map[s];
 const source=fs.readFileSync(require.resolve('../ui.js'),'utf8'),start=source.indexOf(' function initComparers('),end=source.indexOf(' window.initComparers=');
 const init=vm.runInNewContext(source.slice(start,end)+';initComparers;',{setTimeout:()=>1,clearTimeout(){}});
 const container={querySelectorAll:()=>[el]};init(container);
 return {el,handle,original,effect,events,init:()=>init(container),fire:(name,event={})=>events.get(name)?.(event),decode:()=>decoded(),position:()=>Number(handle.attrs['aria-valuenow'])};
}
test('effect decodes before original request; original stays hidden until loaded and resets after interaction',async()=>{
 const f=fixture();assert.equal(f.original.src,undefined);assert.equal(f.position(),0);assert.equal(f.events.has('stage:pointerenter'),false);
 f.effect.naturalWidth=1600;const ready=f.fire('effect:load');assert.equal(f.original.src,undefined);
 f.decode();await ready;assert.equal(f.original.src,'before-preview.webp');
 f.fire('stage:pointermove',{pointerType:'mouse',clientX:72});assert.equal(f.position(),0);
 f.original.naturalWidth=1600;f.fire('original:load');assert.equal(f.position(),72);
 f.fire('stage:pointerleave');assert.equal(f.position(),0);
});
test('cached effects still load the original only after decode; keyboard and touch remain usable',async()=>{
 const f=fixture({cached:true});assert.equal(f.original.src,undefined);f.decode();await new Promise(setImmediate);assert.equal(f.original.src,'before-preview.webp');f.fire('original:load');
 f.fire('handle:focus');assert.equal(f.position(),50);
 f.fire('handle:keydown',{key:'End',preventDefault(){}});assert.equal(f.position(),100);
 f.fire('handle:keydown',{key:'Escape',preventDefault(){}});assert.equal(f.position(),0);
 f.fire('stage:pointerdown',{pointerType:'touch',pointerId:1,clientX:35});assert.equal(f.position(),35);
 f.fire('stage:pointerup',{pointerType:'touch',pointerId:1,clientX:35});assert.equal(f.position(),0);
 const listener=f.events.get('stage:pointermove');f.init();assert.equal(f.events.get('stage:pointermove'),listener);
});
test('failed effect or original keeps the final view at zero instead of showing a blank overlay',()=>{
 const f=fixture();f.fire('stage:pointermove',{pointerType:'mouse',clientX:100});assert.equal(f.position(),0);assert.equal(f.original.src,undefined);
});
