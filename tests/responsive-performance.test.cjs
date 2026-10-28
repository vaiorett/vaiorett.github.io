const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const G=require('../gallery-core.js'),L=require('../layout-core.js'),T=require('../content-core.js');
const read=path=>JSON.parse(fs.readFileSync(path,'utf8').split(' = ',2)[1].trim().replace(/;$/,''));
test('responsive variants retain safe assets and are rendered in both languages',()=>{
 const galleries=G.validate(read('gallery-data.js'));
 const item=Object.values(galleries.projects).flatMap(p=>p.images).find(i=>i.responsive?.length);
 assert.ok(item);for(const v of item.responsive)assert.ok(fs.existsSync(v.src));
 const markup=L.markup({images:[item]},'en',{title:'Project',overview:'Project',open:'Open'});
 assert.match(markup,/srcset="\.\.\//);assert.match(markup,/sizes="/);
 const bad=G.clone(galleries);Object.values(bad.projects).flatMap(p=>p.images).find(i=>i.responsive?.length).responsive[0].src='../secret.webp';assert.throws(()=>G.validate(bad));
 const files=new Map(item.responsive.map(v=>[v.src,{}]));assert.equal(G.usedFiles(galleries,files).length,new Set(item.responsive.map(v=>v.src)).size);
});
test('responsive cover HTML matches browser and build renderers',()=>{
 const cp=require('node:child_process');const galleries=read('gallery-data.js'),content=read('content-data.js'),templates=read('content-templates.js');
 const js=T.render(content,templates,galleries);const py=JSON.parse(cp.execFileSync('python3',['-c',"import sys,json;sys.path.insert(0,'scripts');from content_render import render;read=lambda p:json.loads(open(p).read().split(' = ',1)[1].strip().rstrip(';'));print(json.dumps(render(read('content-data.js'),read('content-templates.js'),read('gallery-data.js'))))"],{encoding:'utf8',maxBuffer:10*1024*1024}));
 assert.equal(js['index.html'],py['index.html']);assert.equal(js['en/index.html'],py['en/index.html']);assert.match(js['index.html'],/srcset="\.\/images\/responsive\//);
});

test('generated variants merge into a local draft without overwriting replaced images',()=>{
 const base={version:1,projects:{x:{title:'X',cover:'a.webp',images:[{id:'a',src:'a.webp',caption:'',alt:''}]}}};
 const local=G.clone(base),remote=G.clone(base);local.projects.x.images[0].caption='Draft edit';remote.projects.x.images[0].responsive=[{src:'images/responsive/a.webp',width:800}];
 const merged=G.merge(base,local,remote);assert.equal(merged.projects.x.images[0].caption,'Draft edit');assert.deepEqual(merged.projects.x.images[0].responsive,remote.projects.x.images[0].responsive);
 local.projects.x.images[0].src='replacement.webp';assert.equal(G.merge(base,local,remote).projects.x.images[0].responsive,undefined);
});
