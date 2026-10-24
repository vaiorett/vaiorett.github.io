(function(root){
 'use strict';
 const PREFIX='window.PORTFOLIO_CONTENT = ', TEMPLATE_PREFIX='window.PORTFOLIO_TEMPLATES = ';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arrayTypes=new Set(['tools','tasks','tags','paragraphs']);
 const pagePath=path=>/^(?:en\/)?(?:index|work-[a-z0-9-]+)\.html$/.test(path);
 function validateTemplates(t){
  if(!t||t.version!==1||!t.fields||!t.pages||Object.keys(t.pages).length!==18)throw new Error('网页模板版本不匹配，请先导出草稿，再刷新管理页。');
  for(const [key,f]of Object.entries(t.fields))if(!/^[\w.-]+$/.test(key)||!['text','multiline','email',...arrayTypes].includes(f.type)||typeof f.label!=='string')throw new Error('文字字段格式不正确。');
  for(const [path,html]of Object.entries(t.pages))if(!pagePath(path)||typeof html!=='string')throw new Error('网页模板路径不正确。');
  return t;
 }
 function validate(data,templates){
  validateTemplates(templates);
  if(!data||data.version!==1||!data.values)throw new Error('文字数据格式不正确。');
  for(const [key,f]of Object.entries(templates.fields)){
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
  for(const[key,value]of Object.entries(local.values)){
   if(JSON.stringify(value)===JSON.stringify(base.values[key])||JSON.stringify(value)===JSON.stringify(remote.values[key]))continue;
   if(!Object.hasOwn(templates.fields,key)||JSON.stringify(remote.values[key])!==JSON.stringify(base.values[key]))conflicts.push(templates.fields[key]?.label||key);
   else merged.values[key]=clone(value);
  }
  if(conflicts.length)throw new Error('这些文字已在线上被修改，请先导出草稿核对：'+conflicts.join('、'));
  return validate(merged,templates);
 }
 function render(data,templates,galleries){
  validate(data,templates);
  const v=data.values,fields=templates.fields;
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
  function replace(_,key){
   if(Object.hasOwn(fields,key))return text(key);
   if(key==='galleryVersion')return String(galleries.updatedAt||'1').replace(/[^a-zA-Z0-9]/g,'');
   if(key.startsWith('cover.'))return esc(galleries.projects[key.slice(6)].cover);
   if(key.startsWith('count.'))return String(galleries.projects[key.slice(6)].images.length);
   if(key.startsWith('gallery.')){const[,id,lang]=key.split('.');return gallery(id,lang);}
   throw new Error('未识别的文字字段：'+key);
  }
  const result={};
  for(const[path,html]of Object.entries(templates.pages))result[path]=html.split(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)/g).map(part=>part.startsWith('<script type="application/ld+json">')?part.replace(/@@([\w.-]+)@@/g,(_,key)=>{
   const value=Object.hasOwn(fields,key)?v[key]:galleries.projects[key.slice(6)].cover;
   return JSON.stringify(value).slice(1,-1).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  }):part.replace(/@@([\w.-]+)@@/g,replace)).join('');
  return result;
 }
 const core={clone,esc,arrayTypes,pagePath,validateTemplates,validate,serialize,parse,parseTemplates,merge,render};
 if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.ContentCore=core;
})(typeof window!=='undefined'?window:globalThis);
