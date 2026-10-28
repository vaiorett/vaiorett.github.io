const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const T=require('../content-core.js'),G=require('../gallery-core.js');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').split(' = ',2)[1].trim().replace(/;$/,''));
test('every generated page has one doctype and requests video parsing only when needed',()=>{
 const content=read('content-data.js'),templates=read('content-templates.js'),galleries=read('gallery-data.js');
 const pages=T.render(content,templates,galleries);
 for(const [path,html]of Object.entries(pages)){
  if(!path.endsWith('.html'))continue;
  assert.equal((html.match(/<!doctype html>/gi)||[]).length,1,path);
  const id=path.match(/work-([a-z0-9-]+)\.html$/)?.[1];
  assert.equal(html.includes('video-core.js'),Boolean(id&&galleries.projects[id].videos?.length),path);
 }
});
test('public previews retain safe sources in both languages and defer comparison originals',()=>{
 const galleries=G.validate(read('gallery-data.js'));
 for(const p of Object.values(galleries.projects))for(const item of p.images)for(const key of ['responsive','compareResponsive']){
  const variants=item[key];if(!variants)continue;
  assert.equal(new Set(variants.map(v=>v.width)).size,variants.length);
  assert.ok(variants.every(v=>fs.existsSync(v.src)));
 }
 const templates=read('content-templates.js'),pages=T.render(read('content-data.js'),templates,galleries);
 assert.match(pages['index.html'],/sizes="[^\"]*543px"/);
 assert.match(pages['work-yunba-depot.html'],/data-srcset=/);
 assert.match(pages['en/work-yunba-depot.html'],/srcset="\.\.\//);
});
