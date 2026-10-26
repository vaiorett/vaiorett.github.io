const{test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const I=require('../image-process.js'),G=require('../gallery-core.js');
function theme({dark=false,saved=null,blocked=false}={}){
 const events={},dom={},media={matches:dark,addEventListener:(name,fn)=>events.media=fn},root={dataset:{},style:{}},select={value:'',addEventListener:(name,fn)=>events.select=fn};
 const store=new Map(saved===null?[]:[['portfolio-theme-v1',saved]]),storage={getItem:k=>{if(blocked)throw Error();return store.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error();store.set(k,v);},removeItem:k=>{if(blocked)throw Error();store.delete(k);}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../theme.js'),'utf8'),{document:{documentElement:root,querySelectorAll:()=>[select],addEventListener:(name,fn)=>dom[name]=fn},window:{matchMedia:()=>media,addEventListener:(name,fn)=>events[name]=fn},localStorage:storage});dom.DOMContentLoaded();
 return {root,select,store,choose:value=>{select.value=value;events.select();},system:dark=>{media.matches=dark;events.media();},storage:value=>events.storage({key:'portfolio-theme-v1',newValue:value})};
}
test('theme follows a changing system preference until explicitly overridden',()=>{const t=theme();assert.equal(t.root.dataset.theme,'light');t.system(true);assert.equal(t.root.dataset.theme,'dark');t.choose('light');t.system(false);t.system(true);assert.equal(t.root.dataset.theme,'light');assert.equal(t.select.value,'light');t.choose('system');assert.equal(t.root.dataset.theme,'dark');assert.equal(t.store.size,0);});
test('saved manual choice survives loading and synchronizes across tabs',()=>{const t=theme({saved:'dark'});assert.equal(t.root.dataset.theme,'dark');t.storage('light');assert.equal(t.root.dataset.theme,'light');t.storage(null);assert.equal(t.root.dataset.themePreference,'system');});
test('blocked storage and invalid saved values still allow theme changes',()=>{const t=theme({dark:true,saved:'bad',blocked:true});assert.equal(t.root.dataset.theme,'dark');t.choose('light');assert.equal(t.root.dataset.theme,'light');assert.equal(theme({saved:'garbage'}).root.dataset.themePreference,'system');});
test('browser language auto-selects Chinese or English while respecting manual switcher and query params',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 function visit({langAttr='zh-CN',pathname='/index.html',search='',hash='',browserLang='en-US'}){
  let redirected=null,clickHandler=null;
  const root={lang:langAttr,dataset:{},style:{}},media={matches:false,addEventListener:()=>{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../theme.js'),'utf8'),{
   document:{documentElement:root,querySelectorAll:()=>[],addEventListener:(name,fn)=>{if(name==='click')clickHandler=fn;}},
   window:{matchMedia:()=>media,addEventListener:()=>{}},
   navigator:{languages:[browserLang],language:browserLang},
   location:{pathname,search,hash,replace:url=>{redirected=url;}},
   URLSearchParams,
   localStorage:storage
  });
  return {redirected,clickLanguage:code=>clickHandler&&clickHandler({target:{closest:()=>({getAttribute:()=>code})}})};
 }
 assert.equal(visit({langAttr:'zh-CN',pathname:'/',search:'?role=visual',hash:'#about',browserLang:'en-US'}).redirected,'/en/?role=visual#about');
 assert.equal(visit({langAttr:'en',pathname:'/en/work-cgi.html',browserLang:'zh-CN'}).redirected,'/work-cgi.html');
 assert.equal(visit({langAttr:'zh-CN',pathname:'/manage.html',browserLang:'en-US'}).redirected,null);
 const zhPage=visit({langAttr:'zh-CN',pathname:'/index.html',browserLang:'zh-CN'});
 assert.equal(zhPage.redirected,null);
 zhPage.clickLanguage('en');
 assert.equal(visit({langAttr:'en',pathname:'/en/index.html',browserLang:'zh-CN'}).redirected,null);
});
test('image sizing keeps long boards and detail mode intact while limiting ordinary large images',()=>{assert.deepEqual(I.dimensions(8000,4000),{width:3840,height:1920,quality:.88});assert.equal(I.dimensions(1000,15000).height,15000);assert.equal(I.dimensions(8000,4000,'detail').width,8000);assert.equal(I.dimensions(4000,3000,'small').width,2560);assert.equal(I.dimensions(400,300).width,400);assert.throws(()=>I.dimensions(10000,10000),/尺寸/);});
test('WebP detection checks bytes, not filename; animated WebP is detected',()=>{const b=Buffer.from('RIFFxxxxWEBPVP8 xxxx');assert.equal(I.isWebP(b),true);assert.equal(I.isWebP(Buffer.from('not a webp')),false);const a=Buffer.alloc(20);a.write('RIFF',0);a.write('WEBP',8);a.write('ANIM',12);assert.equal(I.animated(a),true);assert.equal(I.animated(b),false);});
test('invalid or oversized input is rejected before image processing',()=>{assert.throws(()=>I.validateFile({name:'x.gif',type:'image/gif',size:50}),/静态/);assert.throws(()=>I.validateFile({name:'x.jpg',type:'image/jpeg',size:33*1024*1024}),/32 MB/);I.validateFile({name:'valid.png',type:'image/png',size:10});});
test('thumbnail and full image are both retained for upload while unused files are omitted',()=>{const d={version:1,projects:{test:{title:'x',cover:'images/uploads/a.webp',images:[{id:'a',src:'images/uploads/a.webp',thumbnail:'images/uploads/a-cover.webp',caption:'',alt:'',width:2000,height:1000}]}}};G.validate(d);assert.equal(G.coverPath(d.projects.test),'images/uploads/a-cover.webp');const f=new Map([['images/uploads/a.webp',{}],['images/uploads/a-cover.webp',{}],['images/uploads/unused.webp',{}]]);assert.equal(G.usedFiles(d,f).length,2);d.projects.test.images[0].thumbnail='../escape.webp';assert.throws(()=>G.validate(d),/路径/);});
test('comparison effect image can be used as project cover with fallback and thumbnail support',()=>{const d={version:1,projects:{test:{title:'x',cover:'images/uploads/effect.webp',images:[{id:'a',src:'images/uploads/base.webp',compare:'images/uploads/effect.webp',caption:'',alt:'',width:2000,height:1000}]}}};G.validate(d);assert.equal(G.coverPath(d.projects.test),'images/uploads/effect.webp');d.projects.test.images[0].compareThumbnail='images/uploads/effect-thumb.webp';assert.equal(G.coverPath(d.projects.test),'images/uploads/effect-thumb.webp');});
