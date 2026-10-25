const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const T=require('../content-core.js'),G=require('../gallery-core.js'),root=path.join(__dirname,'..');
const templates=T.parseTemplates(fs.readFileSync(path.join(root,'content-templates.js'),'utf8'));const base=T.parse(fs.readFileSync(path.join(root,'content-data.js'),'utf8'),templates),gallery=G.parse(fs.readFileSync(path.join(root,'gallery-data.js'),'utf8'));
function fresh(id='new-project'){const d=T.clone(base),g=T.clone(gallery);T.addProject(d,g,templates,id,{zh:'真实项目标题',en:'Real project title'},'studies');d.values['project.'+id+'.zh.desc']='新的项目介绍';d.values['project.'+id+'.en.desc']='New project description';return {d,g};}
test('Bilibili URLs and BV IDs normalize to an allowlisted HTTPS player and preserve part number',()=>{
 for(const url of ['BV1B7411m7LV','https://www.bilibili.com/video/BV1B7411m7LV/?p=2&spm_id_from=tracking','https://player.bilibili.com/player.html?bvid=BV1B7411m7LV&p=2']){const v=G.videoInfo(url);assert.equal(v.bvid,'BV1B7411m7LV');assert.match(v.embed,/^https:\/\/player.bilibili.com\/player.html/);assert.ok(!v.url.includes('tracking'));}
 assert.equal(G.videoInfo('https://m.bilibili.com/video/BV1B7411m7LV/?p=2').page,2);
 for(const url of ['javascript:alert(1)','https://evil.test/video/BV1B7411m7LV','https://www.bilibili.com.evil.test/video/BV1B7411m7LV','https://user@www.bilibili.com/video/BV1B7411m7LV','https://www.bilibili.com:444/video/BV1B7411m7LV','https://www.bilibili.com/video/BV1B7411m7LV/?p=0','https://www.bilibili.com/video/BVwrong','https://b23.tv/abc'])assert.throws(()=>G.videoInfo(url));
});
test('new projects create both pages, homepage cards, filter counts, sitemap and reciprocal language links',()=>{
 const {d,g}=fresh();const pages=T.render(d,templates,g);assert.equal(Object.keys(pages).length,21);
 assert.match(pages['index.html'],/data-project-card="new-project" data-category="studies"/);assert.match(pages['index.html'],/class="section-count">09/);
 for(const lang of ['zh','en']){const p=pages[(lang==='en'?'en/':'')+'work-new-project.html'];assert.match(p,/hreflang="en" href="https:\/\/vaiorett.github.io\/en\/work-new-project.html"/);assert.ok(!p.includes('post6dummy'));assert.ok(!p.includes('@@'));}
 assert.ok(!pages['sitemap.xml'].includes('<loc>')); assert.match(pages['work-cgi.html'],/class="next-project" href=".\/work-new-project.html"/);
});
test('empty project remains a draft; video-only project can publish without fabricated images',()=>{
 const {d,g}=fresh();assert.throws(()=>T.readyToPublish(d,templates,g),/至少/);
 g.projects['new-project'].videos=[{id:'v1',url:'BV1B7411m7LV',title:'视频说明',titleEn:'Video description'}];T.readyToPublish(d,templates,g);
 const pages=T.render(d,templates,g);assert.match(pages['work-new-project.html'],/data-video-url="https:\/\/www.bilibili.com/);assert.match(pages['en/work-new-project.html'],/Video description/);assert.ok(!pages['work-new-project.html'].includes('<iframe'));assert.match(pages['work-new-project.html'],/class="video-toolbar" hidden/);assert.ok(!pages['work-new-project.html'].includes('video-caption'));
 d.values['project.new-project.zh.desc']='';assert.throws(()=>T.readyToPublish(d,templates,g),/简介/);
});
test('different new projects merge without losing either side; same-id additions conflict',()=>{
 const a=fresh('local-new'),b=fresh('remote-new');const merged=T.merge(base,a.d,b.d,templates),gm=G.merge(gallery,a.g,b.g);assert.ok(merged.projects['local-new']);assert.ok(merged.projects['remote-new']);assert.ok(gm.projects['local-new']);assert.ok(gm.projects['remote-new']);T.render(merged,templates,gm);
 const c=fresh('local-new');c.d.values['project.local-new.zh.title']='冲突名称';assert.throws(()=>T.merge(base,a.d,c.d,templates),/线上被修改/);
});
test('saved new projects survive parse/restore and unsafe identifiers cannot become paths',()=>{
 const {d,g}=fresh();const restored=T.parse(T.serialize(d),templates);assert.equal(restored.values['project.new-project.en.title'],'Real project title');G.parse(G.serialize(g));
 for(const id of ['../escape','en/x','constructor','grandstand'])assert.throws(()=>T.addProject(d,g,templates,id,{zh:'标题',en:'Title'},'studies'));
});
test('dynamic project, video, escaping and sitemap match Python rendering',()=>{
 const {d,g}=fresh();d.values['project.new-project.zh.title']='标题 <script> & "';g.projects['new-project'].videos=[{id:'v',url:'https://www.bilibili.com/video/BV1B7411m7LV/?p=2',title:'视频 <iframe> & "',titleEn:'Video <iframe> & "'}];
 const script='import sys,json;sys.path.insert(0,"scripts");from content_render import render;x=json.load(sys.stdin);print(json.dumps(render(*x),ensure_ascii=False))';
 const py=JSON.parse(cp.execFileSync('python3',['-c',script],{cwd:root,input:JSON.stringify([d,templates,g]),maxBuffer:2*1024*1024,timeout:10000}).toString());assert.deepEqual(T.render(d,templates,g),py);
 assert.ok(!py['work-new-project.html'].includes('<iframe>'));
});
