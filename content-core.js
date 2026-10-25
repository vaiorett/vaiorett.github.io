(function(root){
 'use strict';
 const G=typeof module!=='undefined'&&module.exports?require('./gallery-core.js'):root.GalleryCore;
 const PREFIX='window.PORTFOLIO_CONTENT = ', TEMPLATE_PREFIX='window.PORTFOLIO_TEMPLATES = ';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arrayTypes=new Set(['tools','tasks','tags','paragraphs']);
 const pagePath=path=>/^(?:en\/)?(?:index|work-[a-z0-9-]+)\.html$/.test(path);
 function validateTemplates(t){
  if(!t||t.version!==2||!t.fields||!t.pages||!t.details?.zh||!t.details?.en||!t.cards?.zh||!t.cards?.en||!t.projects)throw new Error('网页模板版本不匹配，请先导出草稿，再刷新管理页。');
  for(const [key,f]of Object.entries(t.fields))if(!/^[\w.-]+$/.test(key)||!['text','multiline','email',...arrayTypes].includes(f.type)||typeof f.label!=='string')throw new Error('文字字段格式不正确。');
  for(const [path,html]of Object.entries(t.pages))if(!pagePath(path)||typeof html!=='string')throw new Error('网页模板路径不正确。');
  return t;
 }
 const categories=['architecture','assets','product','studies'];
 const projectLabels={title:'标题',desc:'项目简介',role:'个人职责',context:'项目背景',note:'职责与署名',tools:'使用工具',tasks:'我的工作（每行一项）'};
 function projects(data,templates){return data.projects||templates.projects;}
 function fieldsFor(data,templates){const fields={...templates.fields};for(const id of Object.keys(projects(data,templates)))for(const lang of ['zh','en'])for(const [key,label]of Object.entries(projectLabels))fields['project.'+id+'.'+lang+'.'+key]={type:['tools','tasks'].includes(key)?key:'text',label};return fields;}
 function addProject(data,galleries,templates,id,titles,category){
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||Object.hasOwn(projects(data,templates),id)||Object.hasOwn(galleries.projects,id))throw new Error('项目地址已存在或格式不正确。');
  if(!categories.includes(category)||!titles.zh?.trim()||!titles.en?.trim())throw new Error('请填写中英文标题并选择项目分类。');
  data.projects=clone(projects(data,templates));data.projects[id]={category};
  for(const lang of ['zh','en'])for(const key of Object.keys(projectLabels))data.values['project.'+id+'.'+lang+'.'+key]=key==='title'?titles[lang].trim():['tools','tasks'].includes(key)?[]:'';
  galleries.projects[id]={title:titles.zh.trim(),cover:'project-placeholder.webp',images:[],videos:[]};
 }
 function readyToPublish(data,templates,galleries){
  validate(data,templates);G.validate(galleries);
  for(const id of Object.keys(projects(data,templates))){if(['zh','en'].some(lang=>!data.values['project.'+id+'.'+lang+'.desc']?.trim()))throw new Error('请为“'+data.values['project.'+id+'.zh.title']+'”填写中英文项目简介，用于主页和搜索摘要。');const p=galleries.projects[id];if(!p||(!p.images.length&&!p.videos?.length))throw new Error('请为“'+data.values['project.'+id+'.zh.title']+'”添加至少一张图片或一个视频。');}
 }
 function validate(data,templates){
  validateTemplates(templates);
  if(!data||data.version!==1||!data.values)throw new Error('文字数据格式不正确。');
  const meta=projects(data,templates);if(!meta||!Object.keys(meta).length||Object.keys(meta).length>100)throw new Error('项目数量不正确（最多 100 个）。');
  for(const[id,p]of Object.entries(meta)){
   if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||!p||!categories.includes(p.category))throw new Error('项目分类或地址不正确。');
   if(p.source){let u;try{u=new URL(p.source);}catch{throw new Error('项目来源链接不正确。');}if(u.protocol!=='https:'||u.username||u.password)throw new Error('项目来源链接不正确。');}
  }
  for(const [key,f]of Object.entries(fieldsFor(data,templates))){
   const v=data.values[key];const list=arrayTypes.has(f.type);
   if(list?(!Array.isArray(v)||v.length>100||v.some(s=>typeof s!=='string'||s.length>6000)):(typeof v!=='string'||v.length>6000))throw new Error('请检查字段：'+f.label);
   if(f.type==='email'&&!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(v))throw new Error('请填写有效的联系邮箱。');
   if((/\.title$|^ui\.(?:zh|en)\.(?:name|description)$|^site\.brand$/.test(key))&&typeof v==='string'&&!v.trim())throw new Error('请填写：'+f.label);
  }
  return data;
 }
 function serialize(data){return PREFIX+JSON.stringify(data,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';}
 function parse(source,templates){if(!source.startsWith(PREFIX))throw new Error('文字文件格式不正确。');return validate(JSON.parse(source.slice(PREFIX.length).trim().replace(/;$/,'')),templates);}
 function parseTemplates(source){if(!source.startsWith(TEMPLATE_PREFIX))throw new Error('模板文件格式不正确。');return validateTemplates(JSON.parse(source.slice(TEMPLATE_PREFIX.length).trim().replace(/;$/,'')));}
 function merge(base,local,remote,templates){
  validate(remote,templates);const merged=clone(remote),conflicts=[];
  const bm=projects(base,templates),lm=projects(local,templates),rm=projects(remote,templates);merged.projects=clone(rm);
  for(const[id,p]of Object.entries(lm)){
   if(JSON.stringify(p)===JSON.stringify(bm[id])||JSON.stringify(p)===JSON.stringify(rm[id]))continue;
   if(JSON.stringify(rm[id])!==JSON.stringify(bm[id]))conflicts.push('项目 '+id);else merged.projects[id]=clone(p);
  }
  const fields=fieldsFor(merged,templates);
  for(const[key,value]of Object.entries(local.values)){
   if(JSON.stringify(value)===JSON.stringify(base.values[key])||JSON.stringify(value)===JSON.stringify(remote.values[key]))continue;
   if(!Object.hasOwn(fields,key)||JSON.stringify(remote.values[key])!==JSON.stringify(base.values[key]))conflicts.push(fields[key]?.label||key);
   else merged.values[key]=clone(value);
  }
  if(conflicts.length)throw new Error('这些文字已在线上被修改，请先导出草稿核对：'+conflicts.join('、'));
  return validate(merged,templates);
 }
 function render(data,templates,galleries){
  validate(data,templates);
  const v=data.values,fields=fieldsFor(data,templates),meta=projects(data,templates),order=Object.keys(meta);G.validate(galleries);
  for(const id of order)if(!galleries.projects[id])throw new Error('缺少项目图片资料：'+id);
  function text(key){const value=v[key],kind=fields[key].type;
   if(['tags','tasks','paragraphs'].includes(kind)){const tag={tags:'span',tasks:'li',paragraphs:'p'}[kind];return value.map(s=>'<'+tag+'>'+esc(s)+'</'+tag+'>').join('');}
   if(kind==='tools')return esc(value.join(' / '));
   if(kind==='multiline')return esc(value).replace(/\n/g,'<br>');
   return esc(value);
  }
  function gallery(id,lang){const prefix=lang==='en'?'../':'./';return galleries.projects[id].images.map((item,i)=>{
   const caption=(lang==='en'?item.captionEn:item.caption)||v['ui.'+lang+'.overview'];
   const alt=(lang==='en'?item.altEn:item.alt)||v['project.'+id+'.'+lang+'.title'];
   return '<figure class="gallery-item '+(item.kind==='collage'?'legacy':'')+'"><a class="gallery-button" href="'+prefix+esc(item.src)+'" aria-label="'+esc(v['ui.'+lang+'.open'])+': '+esc(caption)+'"><img src="'+prefix+esc(item.src)+'" alt="'+esc(alt)+'" loading="lazy"></a><figcaption>'+String(i+1).padStart(2,'0')+' / '+esc(caption)+'</figcaption></figure>';
  }).join('');}
  function videos(id,lang){
   const items=galleries.projects[id].videos||[];if(!items.length)return '';
   const zh=lang==='zh';return '<section class="project-videos" aria-label="'+(zh?'项目视频':'Project videos')+'"><h2>'+(zh?'项目视频':'Project videos')+'</h2>'+items.map((item,i)=>{
    const info=G.videoInfo(item.url),title=(zh?item.title:item.titleEn)||(zh?'项目视频 ':'Project video ')+(i+1);
    return '<article class="project-video"><h3>'+esc(title)+'</h3><div class="video-screen"><button type="button" class="video-play" data-video-embed="'+esc(info.embed)+'" data-video-title="'+esc(title)+'"><span aria-hidden="true">▶</span> '+(zh?'点击加载 B 站播放器':'Load Bilibili player')+'</button></div><p class="video-help">'+(zh?'加载后点击播放器中的播放键；若无法播放，可以打开原视频。':'Press play after loading. If playback is unavailable, open the original video.')+'</p><a href="'+esc(info.url)+'" target="_blank" rel="noopener">'+(zh?'在 B 站观看':'Watch on Bilibili')+' ↗</a></article>';
   }).join('')+'</section>';
  }
  function resolve(html){return html.replace(/@@([\w.-]+)@@/g,replace);}
  function replace(_,key){
   if(Object.hasOwn(fields,key))return text(key);
   if(key==='galleryVersion')return String(galleries.updatedAt||'1').replace(/[^a-zA-Z0-9]/g,'');
   if(key.startsWith('cards.')){const lang=key.split('.')[1];return order.map(id=>resolve(templates.cards[lang].replaceAll('__project__',id))).join('');}
   if(key.startsWith('total.')){const group=key.split('.')[1];return String(order.filter(id=>group==='all'||meta[id].category===group).length).padStart(2,'0');}
   if(key.startsWith('group.'))return esc(meta[key.slice(6)].category);
   if(key.startsWith('number.'))return String(order.indexOf(key.slice(7))+1).padStart(2,'0');
   if(key.startsWith('category.')){const[,id,lang]=key.split('.');return esc(v['ui.'+lang+'.'+meta[id].category]);}
   if(key.startsWith('videos.')){const[,id,lang]=key.split('.');return videos(id,lang);}
   if(key.startsWith('source.')){const[,id,lang]=key.split('.');return meta[id].source?'<a href="'+esc(meta[id].source)+'" target="_blank" rel="noopener">'+esc(v['ui.'+lang+'.source'])+' ↗</a>':'';}
   if(key.startsWith('next.')){const[,id,lang]=key.split('.'),next=order[(order.indexOf(id)+1)%order.length];return '<a class="next-project" href="./work-'+next+'.html"><span>'+esc(v['ui.'+lang+'.next'])+'</span><strong>'+esc(v['project.'+next+'.'+lang+'.title'])+' ↗</strong></a>';}
   if(key.startsWith('cover.'))return esc(galleries.projects[key.slice(6)].cover);
   if(key.startsWith('count.'))return String(galleries.projects[key.slice(6)].images.length);
   if(key.startsWith('gallery.')){const[,id,lang]=key.split('.');return gallery(id,lang);}
   throw new Error('未识别的文字字段：'+key);
  }
  const result={},pages={...templates.pages};
  for(const id of order)for(const lang of ['zh','en'])pages[(lang==='en'?'en/':'')+'work-'+id+'.html']=templates.details[lang].replaceAll('__project__',id);
  for(const[path,html]of Object.entries(pages))result[path]=html.split(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)/g).map(part=>part.startsWith('<script type="application/ld+json">')?part.replace(/@@([\w.-]+)@@/g,(_,key)=>{
   const value=Object.hasOwn(fields,key)?v[key]:galleries.projects[key.slice(6)].cover;
   return JSON.stringify(value).slice(1,-1).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  }):part.replace(/@@([\w.-]+)@@/g,replace)).join('');
  result['sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+Object.keys(pages).map(path=>'<url><loc>https://vaiorett.github.io/'+path.replace(/index\.html$/,'')+'</loc></url>\n').join('')+'</urlset>\n';
  return result;
 }
 const core={clone,esc,arrayTypes,pagePath,categories,projects,fieldsFor,addProject,readyToPublish,validateTemplates,validate,serialize,parse,parseTemplates,merge,render};
 if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.ContentCore=core;
})(typeof window!=='undefined'?window:globalThis);
