'use strict';
(async function(){
 const C=window.GalleryCore, T=window.ContentCore, $=id=>document.getElementById(id);
 let base=C.clone(C.validate(window.PORTFOLIO_GALLERIES)),data=C.clone(base),files=new Map(),selected=Object.keys(data.projects)[0],session=null,token='',savingTimer,busy=false;
 const urls=new Map();let db=null;
 let templates=T.validateTemplates(window.PORTFOLIO_TEMPLATES),textBase=T.clone(T.validate(window.PORTFOLIO_CONTENT,templates)),textData=T.clone(textBase),editorTab='images',textLanguage='zh';
 function status(id,message,error=false){$(id).textContent=message;$(id).classList.toggle('error',error);}
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('liu-zhi-portfolio-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbRead(){return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbWrite(value){return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 function hasChanges(){return JSON.stringify(base.projects)!==JSON.stringify(data.projects)||JSON.stringify(textBase.values)!==JSON.stringify(textData.values);}
 function updatePublish(){ $('publish-button').disabled=!session||busy||!hasChanges(); }
 async function saveDraft(){
  try{if(!db)throw new Error();files=new Map(C.usedFiles(data,files));await dbWrite({base:C.clone(base),data:C.clone(data),files:Array.from(files.entries()),selected,textBase:T.clone(textBase),textData:T.clone(textData)});status('draft-status','草稿已保存在当前浏览器。');}
  catch{status('draft-status','浏览器未能保存草稿，请导出更新文件后再关闭页面。',true);}
  updatePublish();
 }
 function changed(){status('draft-status','正在保存草稿…');clearTimeout(savingTimer);savingTimer=setTimeout(saveDraft,250);updatePublish();$('commit-link').hidden=true;}
 function preview(path){if(files.has(path)){if(!urls.has(path))urls.set(path,URL.createObjectURL(files.get(path)));return urls.get(path);}return './'+path;}
 function element(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function button(label,fn,disabled=false,extra=''){const b=element('button','mini-button '+extra,label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function renderSelect(){const select=$('project-select');select.replaceChildren();for(const[id,p]of Object.entries(data.projects)){const option=element('option','',textData.values['project.'+id+'.zh.title']||p.title);option.value=id;select.append(option);}select.value=selected;}
 function move(from,to){const list=data.projects[selected].images;if(to<0||to>=list.length)return;const [item]=list.splice(from,1);list.splice(to,0,item);render();changed();}
 function render(){
  const p=data.projects[selected],list=$('image-list');list.replaceChildren();$('image-count').textContent=String(p.images.length).padStart(2,'0');document.querySelector('.project-edit-info').textContent=textData.values['project.'+selected+'.zh.title']||p.title;document.querySelector('.view-project').href='./work-'+selected+'.html';
  p.images.forEach((item,index)=>{
   const card=element('article','image-editor-card');card.draggable=true;card.dataset.index=String(index);
   card.addEventListener('dragstart',e=>{if(e.target instanceof HTMLInputElement){e.preventDefault();return;}e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move';card.classList.add('dragging');});
   card.addEventListener('dragend',()=>card.classList.remove('dragging'));
   card.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer.types).includes('Files'))return;e.preventDefault();card.classList.add('drag-target');});
   card.addEventListener('dragleave',()=>card.classList.remove('drag-target'));
   card.addEventListener('drop',e=>{if(e.dataTransfer.files.length)return;e.preventDefault();card.classList.remove('drag-target');const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from))move(from,index);});
   const visual=element('div');const image=element('img','editor-preview');image.src=preview(item.src);image.alt=item.alt||p.title;visual.append(image);
   const controls=element('div','editor-image-tools');controls.append(button('替换此图',()=>{$('replace-file').dataset.imageId=item.id;$('replace-file').click();}));
   const coverLabel=element('label','cover-label');const radio=element('input','cover-picker');radio.type='radio';radio.name='cover';radio.checked=p.cover===item.src;radio.setAttribute('aria-label','第 '+(index+1)+' 张设为封面');radio.addEventListener('change',()=>{p.cover=item.src;render();changed();});coverLabel.append(radio,document.createTextNode('设为封面'));controls.append(coverLabel);visual.append(controls);card.append(visual);
   const fields=element('div','editor-fields');const top=element('div','editor-position');top.append(element('span','',String(index+1).padStart(2,'0')+' / '+String(p.images.length).padStart(2,'0')),element('span','',item.kind==='collage'?'现有作品总览':'独立图片'));fields.append(top);
   for(const[key,label]of[['caption','图片说明'],['alt','图片描述（便于理解画面）'],['captionEn','English caption（英文说明）'],['altEn','English image description（英文图片描述）']]){const id='image-'+key+'-'+index;const l=element('label','',label);l.htmlFor=id;const input=element('input');input.id=id;input.value=item[key]||'';input.maxLength=300;input.addEventListener('input',()=>{item[key]=input.value;changed();});fields.append(l,input);}
   const actions=element('div','image-actions');actions.append(button('↑ 上移',()=>move(index,index-1),index===0),button('↓ 下移',()=>move(index,index+1),index===p.images.length-1));
   const remove=button('从展示中移除',()=>{p.images.splice(index,1);if(p.cover===item.src)p.cover=p.images[0].src;render();changed();},p.images.length===1,'remove-image');if(p.images.length===1)remove.title='请先添加替代图片，再移除最后一张。';actions.append(remove);fields.append(actions);card.append(fields);list.append(card);
  });updatePublish();
 }

 function visibleFields(){return Object.entries(templates.fields).filter(([key])=>{
  if(editorTab==='project')return key.startsWith('project.'+selected+'.'+textLanguage+'.');
  if(editorTab!=='site'||key.startsWith('project.'))return false;
  return !/\.(zh|en)(?:\.|$)/.test(key)||key.split('.').includes(textLanguage);
 });}
 function fieldGroup(key){
  if(key.startsWith('site.')||/^ui\.(zh|en)\.(name|title|description|footer)$/.test(key))return '网站名字与搜索摘要';
  if(key.startsWith('home.'))return '主页各栏目文字';
  if(key.startsWith('cap.'))return '专业能力与使用工具';
  if(key.startsWith('profile.experience'))return '工作经历';
  if(key.startsWith('profile.education'))return '教育经历';
  if(key.startsWith('profile.'))return '工具技能与证书';
  if(key.startsWith('project.'))return '当前项目的文字与工具';
  return '导航、栏目与按钮文字';
 }
 function renderText(){
  $('image-panel').hidden=editorTab!=='images';$('text-panel').hidden=editorTab==='images';
  document.querySelectorAll('[data-editor-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.editorTab===editorTab)));
  $('text-panel-title').textContent=editorTab==='project'?'项目文字与使用工具':'主页与个人资料';
  const container=$('text-fields');container.replaceChildren();const groups=new Map();
  for(const[key,f]of visibleFields()){
   const group=fieldGroup(key);if(!groups.has(group)){
    const section=element('details','text-section');section.open=group!=='导航、栏目与按钮文字';section.append(element('summary','',group));container.append(section);groups.set(group,section);
   }
   const row=element('div','text-field');const label=element('label','',f.label);const id='text-'+key;label.htmlFor=id;
   const list=T.arrayTypes.has(f.type);const input=element(list||f.type==='multiline'||/desc|context|note|tasks|Intro/.test(key)?'textarea':'input');input.id=id;input.dataset.contentKey=key;
   if(input.tagName==='TEXTAREA')input.rows=list?4:3;else input.type=f.type==='email'?'email':'text';
   input.value=list?textData.values[key].join('\n'):textData.values[key];input.maxLength=list?30000:6000;
   input.addEventListener('input',()=>{textData.values[key]=list?input.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):input.value;changed();});
   row.append(label,input);if(list)row.append(element('small','', '每行一项，可以增加或删除。'));
   if(key==='site.brand')row.append(element('small','','这里会同步修改页眉、页脚和搜索资料中的署名；自我介绍里提到的名字请在对应文字中修改。'));
   groups.get(group).append(row);
  }
 }
 document.querySelectorAll('[data-editor-tab]').forEach(b=>b.addEventListener('click',()=>{editorTab=b.dataset.editorTab;renderText();}));
 $('text-language').addEventListener('change',e=>{textLanguage=e.target.value;renderText();});
 $('reset-text').addEventListener('click',()=>{if(!confirm('撤销当前栏目所有语言的文字修改？其他栏目和图片将保留。'))return;
  for(const key of Object.keys(templates.fields)){if(editorTab==='project'?key.startsWith('project.'+selected+'.'):!key.startsWith('project.'))textData.values[key]=T.clone(textBase.values[key]);}
  renderText();renderSelect();render();changed();
 });
 function desiredGallery(){const desired=C.clone(data);for(const[id,p]of Object.entries(desired.projects))p.title=textData.values['project.'+id+'.zh.title'];return desired;}
 function pageFiles(desired){return {...T.render(textData,templates,C.validate(desired)),'content-data.js':T.serialize(textData)};}
 $('preview-button').addEventListener('click',()=>{
  try{const desired=desiredGallery();let path=(textLanguage==='en'?'en/':'')+(editorTab==='site'?'index.html':'work-'+selected+'.html');let html=pageFiles(desired)[path];
   for(const[file]of C.usedFiles(data,files))html=html.split((textLanguage==='en'?'../':'./')+file).join(preview(file));
   const baseURL=new URL(textLanguage==='en'?'./en/':'./',location.href).href;html=html.replace('<head>','<head><base href="'+T.esc(baseURL)+'">');
   $('content-preview').srcdoc=html;$('preview-dialog').showModal();$('close-preview').focus();
  }catch(error){status('draft-status',error.message,true);}
 });
 $('close-preview').addEventListener('click',()=>$('preview-dialog').close());
 function decodeFile(file){if(!file.content)throw new Error('GitHub 未返回完整文件，请重试。');return new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
 async function verifyImage(file){if(file.size>8*1024*1024)throw new Error('“'+file.name+'”超过 8 MB，请先调整文件体积。');if(!/\.(jpe?g|png|webp|avif)$/i.test(file.name)||!/^image\/(jpeg|png|webp|avif)$/.test(file.type))throw new Error('请选择 JPG、PNG、WebP 或 AVIF 图片。');const temp=URL.createObjectURL(file);try{const img=new Image();img.src=temp;await img.decode();if(!img.naturalWidth)throw new Error();}catch{throw new Error('无法读取图片“'+file.name+'”。');}finally{URL.revokeObjectURL(temp);}}
 async function addFiles(incoming,replacement){
  if(busy)return;const incomingFiles=Array.from(incoming);if(!incomingFiles.length)return;
  try{for(const file of incomingFiles)await verifyImage(file);const p=data.projects[selected];
   for(const file of incomingFiles){const id='image-'+crypto.randomUUID();const ext=file.name.split('.').pop().toLowerCase();const path='images/uploads/'+id+'.'+ext;files.set(path,file);
    if(replacement){const item=p.images.find(i=>i.id===replacement);if(!item)throw new Error('找不到要替换的图片。');if(p.cover===item.src)p.cover=path;item.src=path;item.kind='image';}
    else p.images.push({id,src:path,caption:file.name.replace(/\.[^.]+$/,''),alt:p.title+'效果图',kind:'image'});
   }render();changed();await saveDraft();
  }catch(error){status('draft-status',error.message,true);}
 }
 $('image-files').addEventListener('change',async e=>{await addFiles(e.target.files);e.target.value='';});
 $('replace-file').addEventListener('change',async e=>{await addFiles(e.target.files,e.target.dataset.imageId);e.target.value='';});
 const drop=$('dropzone');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));drop.addEventListener('drop',async e=>{e.preventDefault();drop.classList.remove('dragover');await addFiles(e.dataTransfer.files);});
 $('project-select').addEventListener('change',e=>{selected=e.target.value;render();renderText();changed();});
 $('reset-project').addEventListener('click',()=>{if(!confirm('撤销这个项目尚未发布的图片、顺序和说明修改？'))return;data.projects[selected]=C.clone(base.projects[selected]);render();changed();});
 function setBusy(value){busy=value;document.querySelector('.manager-editor').inert=value;document.querySelector('.manager-sidebar').inert=value;document.querySelector('.manager').classList.toggle('busy',value);$('connect-button').disabled=value;$('export-button').disabled=value;$('disconnect-button').disabled=value;updatePublish();}
 async function api(path,method='GET',body){
  const repoPath='/repos/'+C.OWNER+'/'+C.REPO;
  if(!(path===repoPath||path.startsWith(repoPath+'/')))throw new Error('请求目标不是这个作品仓库。');
  if(!token)throw new Error('请先连接 GitHub。');
  const timeout=C.requestTimeout(path,method);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,redirect:'error',cache:'no-store'});
   if(!response.ok){const detail=await response.json().catch(()=>({}));throw C.httpError(response.status,typeof detail.message==='string'?detail.message:'',{remaining:response.headers.get('x-ratelimit-remaining'),retryAfter:response.headers.get('retry-after')});}
   return await response.json();
  }catch(error){throw C.networkError(error,timeout);}finally{clearTimeout(timer);}
 }
 $('connect-form').addEventListener('submit',async e=>{
  e.preventDefault();if(location.protocol!=='https:' && !(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname))){status('connection-status','请从正式 HTTPS 网站或本机预览地址打开管理页后连接。',true);return;}
  token=$('github-token').value.trim();$('github-token').value='';setBusy(true);status('connection-status','正在验证作品仓库与版本…');
  try{const path='/repos/'+C.OWNER+'/'+C.REPO;const repo=await api(path);if(repo.full_name.toLowerCase()!==(C.OWNER+'/'+C.REPO).toLowerCase()||!repo.permissions||!repo.permissions.push)throw new Error('当前授权无法写入这个作品仓库。');const branch=repo.default_branch;const ref=await api(path+'/git/ref/heads/'+encodeURIComponent(branch));const refQuery='?ref='+encodeURIComponent(ref.object.sha);
   const remoteFiles=await Promise.all(['gallery-data.js','content-data.js','content-templates.js'].map(file=>api(path+'/contents/'+file+refQuery)));
   const remote=C.parse(decodeFile(remoteFiles[0])),remoteTemplates=T.parseTemplates(decodeFile(remoteFiles[2])),remoteText=T.parse(decodeFile(remoteFiles[1]),remoteTemplates);
   const merged=C.merge(base,data,remote),mergedText=T.merge(textBase,textData,remoteText,remoteTemplates);
   data=merged;base=C.clone(remote);templates=remoteTemplates;textData=mergedText;textBase=T.clone(remoteText);session={branch,base:ref.object.sha};renderSelect();render();renderText();await saveDraft();$('disconnect-button').hidden=false;status('connection-status','已连接 vaiorett / vaiorett.github.io，读取权限已验证；发布修改还需要令牌具备 Contents 读写权限。');$('github-token').placeholder='已连接；刷新或断开后需重新输入';}
  catch(error){token='';session=null;status('connection-status',error.message,true);}finally{setBusy(false);}
 });
 $('disconnect-button').addEventListener('click',()=>{token='';session=null;$('github-token').value='';$('github-token').placeholder='在此粘贴，仅本次使用';$('disconnect-button').hidden=true;status('connection-status','已断开连接，草稿仍保存在当前浏览器。');updatePublish();});
 $('publish-button').addEventListener('click',async()=>{
  if(!session||busy||!hasChanges())return;setBusy(true);$('commit-link').hidden=true;status('publish-status','正在核对仓库版本…');const desired=desiredGallery();desired.updatedAt=new Date().toISOString();
  try{const output=pageFiles(desired);const sha=await C.publish(desired,files,session,api,message=>status('publish-status',message),output);data=desired;base=C.clone(desired);textBase=T.clone(textData);session.base=sha;files.clear();await saveDraft();status('publish-status','已提交到 GitHub。请等待 Pages 更新后打开作品页确认。');const link=$('commit-link');link.href='https://github.com/'+C.OWNER+'/'+C.REPO+'/commit/'+encodeURIComponent(sha);link.hidden=false;}
  catch(error){const phase=$('publish-status').textContent;status('publish-status',phase+'：'+error.message,true);}finally{setBusy(false);}
 });
 $('export-button').addEventListener('click',async()=>{
  setBusy(true);try{await saveDraft();const zip=new JSZip();const desired=desiredGallery();desired.updatedAt=new Date().toISOString();zip.file('gallery-data.js',C.serialize(desired));for(const[path,source]of Object.entries(pageFiles(desired)))zip.file(path,source);for(const[path,file]of C.usedFiles(data,files))zip.file(path,file);zip.file('更新说明.txt','这是图片与文字更新包，不是完整网站。\n\n解压后把所有文件按原路径合并到仓库，包括根目录和 en/ 的 HTML 网页、content-data.js、gallery-data.js 及 images/uploads/ 新图片。必须一并提交才能同步中英文与搜索摘要。\n\n日常建议直接在管理页连接 GitHub，点击发布所有修改。仅从展示中移除的图片，原文件仍在仓库。网页文字不会改动简历 PDF。\n');const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});const url=URL.createObjectURL(blob);const a=element('a');a.href=url;a.download='作品集_图片文字更新_'+new Date().toISOString().slice(0,10)+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status('publish-status','更新文件已导出。此操作不会改变公开网站。');}catch(error){status('publish-status','导出未完成：'+error.message,true);}finally{setBusy(false);}
 });
 try{db=await openDB();const saved=await dbRead();if(saved){C.validate(saved.base);C.validate(saved.data);files=new Map(saved.files||[]);try{data=C.merge(saved.base,saved.data,base);}catch{data=C.clone(saved.data);base=C.clone(saved.base);status('draft-status','线上作品可能有更新，本地草稿已恢复，请先导出再连接核对。',true);}if(saved.textBase&&saved.textData){try{textData=T.merge(saved.textBase,saved.textData,textBase,templates);}catch{textData=T.clone(saved.textData);textBase=T.clone(saved.textBase);status('draft-status','文字草稿与线上有差异，已保留草稿；请导出备份后连接核对。',true);}}if(saved.selected&&data.projects[saved.selected])selected=saved.selected;if(!$('draft-status').classList.contains('error'))status('draft-status','已恢复当前浏览器中的草稿。');}}
 catch{status('draft-status','当前浏览器无法保存草稿，请完成后导出更新文件。',true);}
 renderSelect();render();renderText();window.addEventListener('pagehide',()=>{token='';session=null;});window.addEventListener('pageshow',event=>{if(event.persisted){$('disconnect-button').hidden=true;status('connection-status','已断开连接，草稿仍然保留。需要发布时请重新连接。');updatePublish();}});
})();
