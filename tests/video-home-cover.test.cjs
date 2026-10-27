const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const G=require('../gallery-core.js'),T=require('../content-core.js');
const templates=T.parseTemplates(fs.readFileSync('content-templates.js','utf8'));
const base=T.parse(fs.readFileSync('content-data.js','utf8'),templates),gallery=G.parse(fs.readFileSync('gallery-data.js','utf8'));
const url='https://www.bilibili.com/video/BV1Ujn96XEjP/?p=1',cover='https://i0.hdslb.com/bfs/archive/5a531e32f228fef144243d813c754cef70754ffb.jpg';
function fixture(){return {title:'Test',cover:'project-placeholder.webp',images:[],videos:[{id:'one',url,title:'',titleEn:'',poster:cover,posterFor:url}]};}
test('video-only projects use the first video cover and fall back when no poster is available',()=>{
 const p=fixture();assert.equal(G.homeCover(p),cover);
 p.videos[0].posterFor='https://www.bilibili.com/video/BV16inH6SEvM/?p=1';assert.equal(G.homeCover(p),'project-placeholder.webp');
 p.videos[0].posterOverride='images/uploads/custom.webp';assert.equal(G.homeCover(p),'images/uploads/custom.webp');
});
test('an explicit video choice works with existing images, remains safe if removed and retains local uploads',()=>{
 const p=fixture();p.cover='example.webp';p.images=[{id:'image',src:'example.webp',caption:'',alt:''}];
 p.videos.push({id:'two',url:'https://youtu.be/M7lc1UVf-VE',title:'',titleEn:'',posterOverride:'images/uploads/custom.webp'});
 assert.equal(G.homeCover(p),'example.webp');p.coverVideo='two';assert.equal(G.homeCover(p),'images/uploads/custom.webp');
 const data={version:1,projects:{p}};G.validate(data);assert.equal(G.usedFiles(data,new Map([['images/uploads/custom.webp',{}]])).length,1);
 p.coverVideo='removed';assert.throws(()=>G.validate(data),/封面选择/);
});
test('generated home cards use video covers, correct fallback paths and match Python in both languages',()=>{
 const d=T.clone(base),g=T.clone(gallery),id='project-3ba57396';g.projects[id]=fixture();
 for(const [key,v] of Object.entries(d.values))if(key.startsWith('project.'+id+'.'))assert.notEqual(v,undefined);
 const pages=T.render(d,templates,g);
 for(const name of ['index.html','en/index.html']){
  const card=pages[name].match(/<article class="project-card" data-project-card="project-3ba57396"[\s\S]*?<\/article>/)[0];
  assert.ok(card.includes('src="'+cover+'"'));assert.ok(card.includes('referrerpolicy="no-referrer"'));assert.ok(card.includes('data-card-fallback="'+(name.startsWith('en/')?'../':'./')+'project-placeholder.webp"'));
 }
 const script='import sys,json;sys.path.insert(0,"scripts");from content_render import render;x=json.load(sys.stdin);print(json.dumps(render(*x),ensure_ascii=False))';
 const py=JSON.parse(cp.execFileSync('python3',['-c',script],{input:JSON.stringify([d,templates,g]),maxBuffer:4*1024*1024,timeout:10000}).toString());assert.deepEqual(pages,py);
});
