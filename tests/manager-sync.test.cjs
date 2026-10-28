const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const T=require('../content-core.js'),G=require('../gallery-core.js');
const raw={ 'gallery-data.js':fs.readFileSync('gallery-data.js','utf8'), 'content-data.js':fs.readFileSync('content-data.js','utf8'), 'content-templates.js':fs.readFileSync('content-templates.js','utf8')};
function fetcher(files,requests){return async (url,options)=>{requests.push({url,options});let name=url.split('?')[0].slice(2);return {ok:Object.hasOwn(files,name),text:async()=>files[name]};};}
test('management fetches current project and title data without reusing cached files',async()=>{
 const requests=[],latest=await T.loadPublished(fetcher(raw,requests),123);
 assert.equal(requests.length,3);for(const r of requests){assert.match(r.url,/\?fresh=123$/);assert.equal(r.options.cache,'no-store');}
 assert.equal(latest.content.values['project.residential.zh.title'],'时光序中小学');assert.ok(latest.gallery.projects['project-d15b5f36']);
 const old=T.clone(latest.content),local=T.clone(old);old.values['project.residential.zh.title']='住宅与公共空间';local.values['project.residential.zh.title']='住宅与公共空间';
 assert.equal(T.merge(old,local,latest.content,latest.templates).values['project.residential.zh.title'],'时光序中小学');
});
test('partial, inconsistent publication cannot replace the saved draft',async()=>{
 const data=JSON.parse(raw['gallery-data.js'].split(' = ')[1].trim().replace(/;$/,''));delete data.projects['project-d15b5f36'];
 const broken={...raw,'gallery-data.js':'window.PORTFOLIO_GALLERIES = '+JSON.stringify(data)+';'};
 await assert.rejects(T.loadPublished(fetcher(broken,[]),456),/正在同步/);
 await assert.rejects(T.loadPublished(fetcher({},[]),456),/无法读取/);
});
test('a recently published local base is retained while public Pages is behind',()=>{
 assert.equal(G.newerPublication({updatedAt:'2026-10-28T10:00:00Z'},{updatedAt:'2026-10-28T09:59:00Z'}),true);
 assert.equal(G.newerPublication({updatedAt:'2026-10-28T10:00:00Z'},{updatedAt:'2026-10-28T10:01:00Z'}),false);
 assert.equal(G.newerPublication({updatedAt:'bad'},{updatedAt:'2026-10-28T10:01:00Z'}),false);
});
test('empty role, duties and credit render without empty public headings',()=>{
 const templates=T.parseTemplates(raw['content-templates.js']),content=T.parse(raw['content-data.js'],templates),gallery=G.parse(raw['gallery-data.js']);
 const page=T.render(content,templates,gallery)['work-project-d15b5f36.html'];
 assert.ok(page.includes('项目背景'));assert.ok(!page.includes('<h2>我的工作</h2>'));assert.ok(!page.includes('<h2>职责与署名</h2>'));assert.ok(!page.includes('<span>个人职责</span>'));
});
