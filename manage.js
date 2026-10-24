'use strict';
(async function(){
 const C=window.GalleryCore, $=id=>document.getElementById(id);
 let base=C.clone(C.validate(window.PORTFOLIO_GALLERIES)),data=C.clone(base),files=new Map(),selected=Object.keys(data.projects)[0],session=null,token='',savingTimer,busy=false;
 const urls=new Map();let db=null;
 function status(id,message,error=false){$(id).textContent=message;$(id).classList.toggle('error',error);}
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('liu-zhi-portfolio-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbRead(){return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbWrite(value){return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 function hasChanges(){return JSON.stringify(base.projects)!==JSON.stringify(data.projects);}
 function updatePublish(){ $('publish-button').disabled=!session||busy||!hasChanges(); }
 async function saveDraft(){
  try{if(!db)throw new Error();files=new Map(C.usedFiles(data,files));await dbWrite({base:C.clone(base),data:C.clone(data),files:Array.from(files.entries()),selected});status('draft-status','草稿已保存在当前浏览器。');}
  catch{status('draft-status','浏览器未能保存草稿，请导出更新文件后再关闭页面。',true);}
  updatePublish();
 }
 function changed(){status('draft-status','正在保存草稿…');clearTimeout(savingTimer);savingTimer=setTimeout(saveDraft,250);updatePublish();$('commit-link').hidden=true;}
 function preview(path){if(files.has(path)){if(!urls.has(path))urls.set(path,URL.createObjectURL(files.get(path)));return urls.get(path);}return './'+path;}
 function element(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function button(label,fn,disabled=false,extra=''){const b=element('button','mini-button '+extra,label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function renderSelect(){const select=$('project-select');select.replaceChildren();for(const[id,p]of Object.entries(data.projects)){const option=element('option','',p.title);option.value=id;select.append(option);}select.value=selected;}
 function move(from,to){const list=data.projects[selected].images;if(to<0||to>=list.length)return;const [item]=list.splice(from,1);list.splice(to,0,item);render();changed();}
 function render(){
  const p=data.projects[selected],list=$('image-list');list.replaceChildren();$('image-count').textContent=String(p.images.length).padStart(2,'0');document.querySelector('.project-edit-info').textContent=p.title;document.querySelector('.view-project').href='./work-'+selected+'.html';
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
   for(const[key,label]of[['caption','图片说明'],['alt','图片描述（便于理解画面）']]){const id='image-'+key+'-'+index;const l=element('label','',label);l.htmlFor=id;const input=element('input');input.id=id;input.value=item[key];input.maxLength=300;input.addEventListener('input',()=>{item[key]=input.value;changed();});fields.append(l,input);}
   const actions=element('div','image-actions');actions.append(button('↑ 上移',()=>move(index,index-1),index===0),button('↓ 下移',()=>move(index,index+1),index===p.images.length-1));
   const remove=button('从展示中移除',()=>{p.images.splice(index,1);if(p.cover===item.src)p.cover=p.images[0].src;render();changed();},p.images.length===1,'remove-image');if(p.images.length===1)remove.title='请先添加替代图片，再移除最后一张。';actions.append(remove);fields.append(actions);card.append(fields);list.append(card);
  });updatePublish();
 }
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
 $('project-select').addEventListener('change',e=>{selected=e.target.value;render();changed();});
 $('reset-project').addEventListener('click',()=>{if(!confirm('撤销这个项目尚未发布的图片、顺序和说明修改？'))return;data.projects[selected]=C.clone(base.projects[selected]);render();changed();});
 function setBusy(value){busy=value;document.querySelector('.manager-editor').inert=value;document.querySelector('.manager-sidebar').inert=value;document.querySelector('.manager').classList.toggle('busy',value);$('connect-button').disabled=value;$('export-button').disabled=value;$('disconnect-button').disabled=value;updatePublish();}
 async function api(path,method='GET',body){
  const repoPath='/repos/'+C.OWNER+'/'+C.REPO;
  if(!(path===repoPath||path.startsWith(repoPath+'/')))throw new Error('请求目标不是这个作品仓库。');
  if(!token)throw new Error('请先连接 GitHub。');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,redirect:'error',cache:'no-store'});
   if(!response.ok){if(response.status===401)throw new Error('授权令牌无效或已过期，请重新连接。');if(response.status===403)throw new Error('GitHub 拒绝了操作，请确认该令牌允许此仓库的 Contents 写入权限。');if(response.status===404)throw new Error('无法访问作品仓库，请确认仓库已创建，且令牌已选中此仓库。');if(response.status===409||response.status===422)throw new Error('仓库状态有变化，请重新连接后再发布。');throw new Error('GitHub 暂时无法完成操作，请稍后重试。');}
   return await response.json();
  }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw new Error('未能连接 GitHub。草稿已保留，请检查网络后重试；如果刚才已点击发布，请先查看仓库提交记录。');throw error;}finally{clearTimeout(timer);}
 }
 $('connect-form').addEventListener('submit',async e=>{
  e.preventDefault();if(location.protocol!=='https:' && !(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname))){status('connection-status','请从正式 HTTPS 网站或本机预览地址打开管理页后连接。',true);return;}
  token=$('github-token').value.trim();$('github-token').value='';setBusy(true);status('connection-status','正在验证作品仓库与版本…');
  try{const path='/repos/'+C.OWNER+'/'+C.REPO;const repo=await api(path);if(repo.full_name.toLowerCase()!==(C.OWNER+'/'+C.REPO).toLowerCase()||!repo.permissions||!repo.permissions.push)throw new Error('当前授权无法写入这个作品仓库。');const branch=repo.default_branch;const ref=await api(path+'/git/ref/heads/'+encodeURIComponent(branch));const remoteFile=await api(path+'/contents/gallery-data.js?ref='+encodeURIComponent(ref.object.sha));const bytes=Uint8Array.from(atob(remoteFile.content.replace(/\s/g,'')),c=>c.charCodeAt(0));const remote=C.parse(new TextDecoder().decode(bytes));data=C.merge(base,data,remote);base=C.clone(remote);session={branch,base:ref.object.sha};renderSelect();render();await saveDraft();$('disconnect-button').hidden=false;status('connection-status','已连接 vaiorett / vaiorett.github.io，可以发布图片更新。');$('github-token').placeholder='已连接；刷新或断开后需重新输入';}
  catch(error){token='';session=null;status('connection-status',error.message,true);}finally{setBusy(false);}
 });
 $('disconnect-button').addEventListener('click',()=>{token='';session=null;$('github-token').value='';$('github-token').placeholder='在此粘贴，仅本次使用';$('disconnect-button').hidden=true;status('connection-status','已断开连接，草稿仍保存在当前浏览器。');updatePublish();});
 $('publish-button').addEventListener('click',async()=>{
  if(!session||busy||!hasChanges())return;setBusy(true);$('commit-link').hidden=true;const desired=C.clone(data);desired.updatedAt=new Date().toISOString();
  try{const sha=await C.publish(desired,files,session,api,message=>status('publish-status',message));data=desired;base=C.clone(desired);session.base=sha;files.clear();await saveDraft();status('publish-status','已提交到 GitHub。请等待 Pages 更新后打开作品页确认。');const link=$('commit-link');link.href='https://github.com/'+C.OWNER+'/'+C.REPO+'/commit/'+encodeURIComponent(sha);link.hidden=false;}
  catch(error){status('publish-status',error.message,true);}finally{setBusy(false);}
 });
 $('export-button').addEventListener('click',async()=>{
  setBusy(true);try{await saveDraft();const zip=new JSZip();const desired=C.clone(data);desired.updatedAt=new Date().toISOString();zip.file('gallery-data.js',C.serialize(desired));for(const[path,file]of C.usedFiles(data,files))zip.file(path,file);zip.file('更新说明.txt','这是作品图片更新包，不是完整网站。\n\n1. 解压后，将更新文件按原路径合并到原网站文件夹。\n2. 在 GitHub 上传 gallery-data.js，并将新图上传到 images/uploads/。\n3. 等待 GitHub Pages 更新。\n\n也可以把本更新包发到原聊天中，由助手继续更新发布。\n仅从展示中移除的图片，原文件仍在仓库中。\n');const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});const url=URL.createObjectURL(blob);const a=element('a');a.href=url;a.download='刘志_作品图片更新_'+new Date().toISOString().slice(0,10)+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status('publish-status','更新文件已导出。此操作不会改变公开网站。');}catch{status('publish-status','导出未完成，请稍后重试。',true);}finally{setBusy(false);}
 });
 try{db=await openDB();const saved=await dbRead();if(saved){C.validate(saved.base);C.validate(saved.data);files=new Map(saved.files||[]);try{data=C.merge(saved.base,saved.data,base);}catch{data=C.clone(saved.data);base=C.clone(saved.base);status('draft-status','线上作品可能有更新，本地草稿已恢复，请先导出再连接核对。',true);}if(saved.selected&&data.projects[saved.selected])selected=saved.selected;if(!$('draft-status').classList.contains('error'))status('draft-status','已恢复当前浏览器中的草稿。');}}
 catch{status('draft-status','当前浏览器无法保存草稿，请完成后导出更新文件。',true);}
 renderSelect();render();window.addEventListener('pagehide',()=>{token='';session=null;});window.addEventListener('pageshow',event=>{if(event.persisted){$('disconnect-button').hidden=true;status('connection-status','已断开连接，草稿仍然保留。需要发布时请重新连接。');updatePublish();}});
})();
