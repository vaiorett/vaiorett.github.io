'use strict';
(async function(){
 const C=window.GalleryCore, T=window.ContentCore, I=window.ImageProcess, V=window.VideoCore, $=id=>document.getElementById(id);
 let base=C.clone(C.validate(window.PORTFOLIO_GALLERIES)),data=C.clone(base),files=new Map(),selected=Object.keys(data.projects)[0],session=null,token='',savingTimer,busy=false;
 const urls=new Map();let db=null;
 let templates=T.validateTemplates(window.PORTFOLIO_TEMPLATES),textBase=T.clone(T.validate(window.PORTFOLIO_CONTENT,templates)),textData=T.clone(textBase),editorTab='images',textLanguage='zh';
 function status(id,message,error=false){$(id).textContent=message;$(id).classList.toggle('error',error);}
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('vaiorett-portfolio-private-safe-v2',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbRead(){return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function dbWrite(value){return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 function hasChanges(){return JSON.stringify(base.projects)!==JSON.stringify(data.projects)||JSON.stringify(textBase.values)!==JSON.stringify(textData.values)||JSON.stringify(T.projects(textBase,templates))!==JSON.stringify(T.projects(textData,templates));}
 function updatePublish(){ $('publish-button').disabled=!session||busy||!hasChanges(); }
 async function saveDraft(){
  try{if(!db)throw new Error();files=new Map(C.usedFiles(data,files));for(const[path,url]of urls)if(!files.has(path)){URL.revokeObjectURL(url);urls.delete(path);}await dbWrite({base:C.clone(base),data:C.clone(data),files:Array.from(files.entries()),selected,textBase:T.clone(textBase),textData:T.clone(textData)});status('draft-status','草稿已保存在当前浏览器。');}
  catch{status('draft-status','浏览器未能保存草稿，请导出更新文件后再关闭页面。',true);}
  updatePublish();
 }
 function changed(){status('draft-status','正在保存草稿…');clearTimeout(savingTimer);savingTimer=setTimeout(saveDraft,250);updatePublish();$('commit-link').hidden=true;}
 function preview(path){if(files.has(path)){if(!urls.has(path))urls.set(path,URL.createObjectURL(files.get(path)));return urls.get(path);}return './'+path;}
 const openCards=new Set();
 function updateCollapseAllButton(){
  const btn=$('toggle-collapse-all');
  if(!btn)return;
  const p=data.projects[selected];
  if(!p||!p.images.length){btn.disabled=true;return;}
  btn.disabled=false;
  const allOpen=p.images.every(i=>openCards.has(i.id));
  btn.textContent=allOpen?'全部折叠':'全部展开';
 }
 function swapCompare(item){
  const oldSrc=item.src;
  const oldCompare=item.compare;
  item.src=oldCompare;
  item.compare=oldSrc;
  const oldBefore=item.beforeLabel,oldAfter=item.afterLabel;
  if(oldBefore!==undefined||oldAfter!==undefined){
   item.beforeLabel=oldAfter!==undefined?oldAfter:'';
   item.afterLabel=oldBefore!==undefined?oldBefore:'';
   if(!item.beforeLabel)delete item.beforeLabel;
   if(!item.afterLabel)delete item.afterLabel;
  }
  const oldBeforeEn=item.beforeLabelEn,oldAfterEn=item.afterLabelEn;
  if(oldBeforeEn!==undefined||oldAfterEn!==undefined){
   item.beforeLabelEn=oldAfterEn!==undefined?oldAfterEn:'';
   item.afterLabelEn=oldBeforeEn!==undefined?oldBeforeEn:'';
   if(!item.beforeLabelEn)delete item.beforeLabelEn;
   if(!item.afterLabelEn)delete item.afterLabelEn;
  }
  const oldThumb=item.thumbnail,oldCompareThumb=item.compareThumbnail;
  item.thumbnail=oldCompareThumb;
  item.compareThumbnail=oldThumb;
  if(!item.thumbnail)delete item.thumbnail;
  if(!item.compareThumbnail)delete item.compareThumbnail;
  const p=data.projects[selected];
  if(p){
   if(p.cover===oldCompare)p.cover=item.src;
   else if(p.cover===oldSrc)p.cover=item.compare;
  }
  openCards.add(item.id);
  render();changed();
  status('image-process-status','已对调两张对比图片：左侧（原图）与右侧（效果图）画面及标签已互换。');
 }
 function element(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function button(label,fn,disabled=false,extra=''){const b=element('button','mini-button '+extra,label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function moveProject(id,dir){
  const order=Object.keys(T.projects(textData,templates));
  const fromIndex=order.indexOf(id);
  if(fromIndex===-1)return;
  const toIndex=fromIndex+dir;
  if(toIndex<0||toIndex>=order.length)return;
  const [movedId]=order.splice(fromIndex,1);
  order.splice(toIndex,0,movedId);
  T.reorderProjects(textData,templates,order);
  C.reorderProjects(data,order);
  selected=movedId;
  renderSelect();
  render();
  renderText();
  changed();
  status('draft-status','已更新首页项目展示顺序：“'+(textData.values['project.'+id+'.zh.title']||id)+'”现排在第 '+(toIndex+1)+' 位（草稿已保存）。');
 }
 function renderProjectSortList(){
  const container=$('project-sort-list');
  if(!container)return;
  container.replaceChildren();
  const order=Object.keys(T.projects(textData,templates));
  const badge=$('project-count-badge');
  if(badge)badge.textContent=order.length+' 个项目';
  order.forEach((id,index)=>{
   const p=data.projects[id];
   const zhTitle=textData.values['project.'+id+'.zh.title']||p?.title||id;
   const imgCount=p?.images?.length||0;
   const vidCount=p?.videos?.length||0;
   const mediaText=imgCount+'图'+(vidCount?' · '+vidCount+'视频':'');

   const item=element('div','project-sort-item'+(id===selected?' active':''));
   item.dataset.projectId=id;
   item.setAttribute('role','option');
   item.setAttribute('aria-selected',id===selected?'true':'false');
   item.tabIndex=0;

   const num=element('span','project-sort-num',String(index+1).padStart(2,'0'));
   const info=element('div','project-sort-info');
   const titleEl=element('div','project-sort-title',zhTitle);
   titleEl.title=zhTitle;
   const metaEl=element('span','project-sort-badge',mediaText);
   info.append(titleEl,metaEl);

   const actions=element('div','project-sort-actions');
   const upBtn=element('button','project-sort-btn','↑');
   upBtn.type='button';
   upBtn.title=index===0?'已在首页第一位':'在首页上移一位';
   upBtn.disabled=index===0;
   upBtn.addEventListener('click',e=>{e.stopPropagation();moveProject(id,-1);});

   const downBtn=element('button','project-sort-btn','↓');
   downBtn.type='button';
   downBtn.title=index===order.length-1?'已在首页最后一位':'在首页下移一位';
   downBtn.disabled=index===order.length-1;
   downBtn.addEventListener('click',e=>{e.stopPropagation();moveProject(id,1);});

   actions.append(upBtn,downBtn);
   item.append(num,info,actions);

   item.addEventListener('click',()=>{
    if(selected!==id){
     selected=id;
     if($('project-select'))$('project-select').value=id;
     renderSelect();
     render();
     renderText();
    }
   });

   item.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){
     e.preventDefault();
     item.click();
    }
   });

   container.append(item);
  });
 }
 function renderSelect(){
  const select=$('project-select');
  if(select){
   select.replaceChildren();
   for(const[id,p]of Object.entries(data.projects)){
    const option=element('option','',textData.values['project.'+id+'.zh.title']||p.title);
    option.value=id;
    select.append(option);
   }
   select.value=selected;
  }
  renderProjectSortList();
 }
 function move(from,to){const list=data.projects[selected].images;if(to<0||to>=list.length)return;const [item]=list.splice(from,1);list.splice(to,0,item);render();changed();}
 function render(){
  $('project-layout').value=data.projects[selected].layout==='story'?'stack':(data.projects[selected].layout||'auto');
  const p=data.projects[selected],list=$('image-list');list.replaceChildren();$('image-count').textContent=String(p.images.length).padStart(2,'0');document.querySelector('.project-edit-info').textContent=textData.values['project.'+selected+'.zh.title']||p.title;document.querySelector('.view-project').href='./work-'+selected+'.html';document.querySelector('.view-project').hidden=!base.projects[selected];
  updateCollapseAllButton();
  p.images.forEach((item,index)=>{
   const card=element('article','image-editor-card');card.draggable=true;card.dataset.index=String(index);
   card.addEventListener('dragstart',e=>{if(e.target.closest('input,textarea,select,button')){e.preventDefault();return;}e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move';card.classList.add('dragging');});
   card.addEventListener('dragend',()=>card.classList.remove('dragging'));
   card.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer.types).includes('Files'))return;e.preventDefault();card.classList.add('drag-target');});
   card.addEventListener('dragleave',()=>card.classList.remove('drag-target'));
   card.addEventListener('drop',e=>{if(e.dataTransfer.files.length)return;e.preventDefault();card.classList.remove('drag-target');const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from))move(from,index);});
   const visual=element('div');
   const isEffectCover=Boolean(item.compare&&p.cover===item.compare);
   const isBaseCover=p.cover===item.src;
   const image=element('img','editor-preview');
   image.loading='lazy';image.decoding='async';
   image.src=preview(item.compare?(item.compareThumbnail||item.compare):(item.thumbnail||item.src));
   image.alt=item.alt||p.title;
   visual.append(image);

   const controls=element('div','editor-image-tools');
   controls.append(button('替换此图',()=>{$('replace-file').dataset.imageId=item.id;$('replace-file').click();}));

   if(item.compare){
    const coverGroup=element('div','cover-picker-group');
    const effectLabel=element('label','cover-label');
    const effectRadio=element('input','cover-picker');
    effectRadio.type='radio';effectRadio.name='cover';
    effectRadio.checked=isEffectCover;
    effectRadio.setAttribute('aria-label','第 '+(index+1)+' 张：设效果图为封面');
    effectRadio.addEventListener('change',()=>{p.cover=item.compare;render();changed();});
    effectLabel.append(effectRadio,document.createTextNode('设效果图为封面'));

    const baseLabel=element('label','cover-label');
    const baseRadio=element('input','cover-picker');
    baseRadio.type='radio';baseRadio.name='cover';
    baseRadio.checked=isBaseCover;
    baseRadio.setAttribute('aria-label','第 '+(index+1)+' 张：设原图为封面');
    baseRadio.addEventListener('change',()=>{p.cover=item.src;render();changed();});
    baseLabel.append(baseRadio,document.createTextNode('设原图为封面'));

    coverGroup.append(effectLabel,baseLabel);
    controls.append(coverGroup);
   }else{
    const coverLabel=element('label','cover-label');
    const radio=element('input','cover-picker');
    radio.type='radio';radio.name='cover';
    radio.checked=isBaseCover;
    radio.setAttribute('aria-label','第 '+(index+1)+' 张设为封面');
    radio.addEventListener('change',()=>{p.cover=item.src;render();changed();});
    coverLabel.append(radio,document.createTextNode('设为封面'));
    controls.append(coverLabel);
   }
   visual.append(controls);
   card.append(visual);

   const fields=element('div','editor-fields');
   const top=element('div','editor-position');
   top.append(element('span','',String(index+1).padStart(2,'0')+' / '+String(p.images.length).padStart(2,'0')));
   const titleSpan=element('span','editor-item-title',item.caption||(item.kind==='collage'?'作品总览':'图片 '+(index+1)));
   top.append(titleSpan);
   if(isEffectCover){
    top.append(element('span','cover-tag-pill','项目封面（效果图）'));
   }else if(isBaseCover){
    top.append(element('span','cover-tag-pill','项目封面'));
   }
   if(item.compare){
    top.append(element('span','compare-tag-pill','滑动对比'));
   }else if(item.kind==='collage'){
    top.append(element('span','','作品总览'));
   }
   fields.append(top);

   const details=element('details','image-fields-collapse');
   if(openCards.has(item.id))details.open=true;
   const summary=element('summary','image-collapse-trigger');
   const triggerText=element('span','collapse-trigger-text',details.open?'收起图片信息与设置':'展开图片信息与设置');
   summary.append(triggerText,element('span','collapse-icon','▾'));
   details.append(summary);

   details.addEventListener('toggle',()=>{
    if(details.open){
     openCards.add(item.id);
     triggerText.textContent='收起图片信息与设置';
    }else{
     openCards.delete(item.id);
     triggerText.textContent='展开图片信息与设置';
    }
    updateCollapseAllButton();
   });

   const collapseBody=element('div','image-collapse-body');
   if(item.upload){const meta=item.upload;collapseBody.append(element('p','compression-info',formatBytes(meta.originalBytes)+' → WebP '+formatBytes(meta.bytes)+' · '+meta.width+' × '+meta.height+' px'));}
   const layoutLabel=element('label','','这张图的宽度'),layout=element('select','image-layout-field');layout.id='image-layout-'+index;layoutLabel.htmlFor=layout.id;
   for(const[value,label]of [['auto','自动'],['full','整行大图'],['half','半宽（双列）']]){const option=element('option','',label);option.value=value;layout.append(option);}
   layout.value=item.layout||'auto';layout.addEventListener('change',()=>{item.layout=layout.value;changed();});collapseBody.append(layoutLabel,layout);

   const compareBox=element('div','compare-editor-box');
   if(item.compare){
    const head=element('div','compare-editor-head');
    head.append(element('strong','','✔ 已启用两图滑动对比'));
    const headTools=element('div','compare-head-tools');
    const swapHeadBtn=button('⇄ 对调两图',()=>swapCompare(item),false,'mini-button compare-swap-btn');
    swapHeadBtn.title='将左右两张对比图互换位置（左侧基础阶段 ⇄ 右侧最终效果）';
    const cancelBtn=button('取消对比（恢复普通单图）',()=>{
     const oldCompare=item.compare;
     delete item.compare;delete item.compareThumbnail;delete item.beforeLabel;delete item.beforeLabelEn;delete item.afterLabel;delete item.afterLabelEn;
     if(p.cover===oldCompare)p.cover=item.src;
     render();changed();
    },false,'quiet-button remove-image');
    headTools.append(swapHeadBtn,cancelBtn);
    head.append(headTools);
    compareBox.append(head);

    const row=element('div','compare-preview-row');
    const leftCol=element('div','compare-thumb-col');
    leftCol.append(element('span','compare-thumb-label','左侧 · '+(item.beforeLabel||'原图')));
    const leftThumb=element('img','compare-thumb-preview');
    leftThumb.loading='lazy';leftThumb.decoding='async';
    leftThumb.src=preview(item.thumbnail||item.src);
    leftThumb.alt='左侧基础图';
    leftCol.append(leftThumb);
    if(p.cover===item.src){
     leftCol.append(element('span','cover-active-tag','✔ 当前封面'));
    }else{
     const setBaseBtn=button('设为封面',()=>{p.cover=item.src;render();changed();},false,'mini-button cover-set-btn');
     setBaseBtn.title='将左侧原图设为项目封面';
     leftCol.append(setBaseBtn);
    }

    const swapMidBtn=button('⇄ 对调',()=>swapCompare(item),false,'mini-button compare-swap-mid');
    swapMidBtn.title='互换左右两图及对应标签';

    const rightCol=element('div','compare-thumb-col');
    rightCol.append(element('span','compare-thumb-label','右侧 · '+(item.afterLabel||'效果')));
    const rightThumb=element('img','compare-thumb-preview');
    rightThumb.loading='lazy';rightThumb.decoding='async';
    rightThumb.src=preview(item.compareThumbnail||item.compare);
    rightThumb.alt='右侧效果图';
    rightCol.append(rightThumb);
    if(p.cover===item.compare){
     rightCol.append(element('span','cover-active-tag','✔ 当前封面'));
    }else{
     const setEffectBtn=button('设为封面',()=>{p.cover=item.compare;render();changed();},false,'mini-button cover-set-btn');
     setEffectBtn.title='将右侧效果图设为项目封面（推荐）';
     rightCol.append(setEffectBtn);
    }

    const replaceBtn=button('替换对比图',()=>{$('compare-file').dataset.imageId=item.id;$('compare-file').click();},false,'mini-button');
    row.append(leftCol,swapMidBtn,rightCol,replaceBtn);
    compareBox.append(row);

    const grid=element('div','compare-label-grid');
    for(const[k,lText,dflt]of[['beforeLabel','左侧标签（中文）','原图'],['beforeLabelEn','Left label (EN)','Before'],['afterLabel','右侧标签（中文）','效果'],['afterLabelEn','Right label (EN)','After']]){
     const id='cmp-'+k+'-'+index;const l=element('label','',lText);l.htmlFor=id;const inp=element('input');inp.id=id;inp.placeholder=dflt;inp.value=item[k]||'';inp.maxLength=100;
     inp.addEventListener('input',()=>{const val=inp.value.trim();if(val)item[k]=val;else delete item[k];changed();});
     grid.append(l,inp);
    }
    compareBox.append(grid);
   }else{
    const addBtn=button('＋ 添加对比效果图（制作滑动对比）',()=>{$('compare-file').dataset.imageId=item.id;$('compare-file').click();},false,'compare-add-button');
    addBtn.title='上传最终渲染/光影效果图，与当前图片形成左右滑动对比';
    const tip=element('p','compare-editor-tip','让当前图片与最终效果图形成左右滑动对比（如白模与最终灯光渲染对比）');
    compareBox.append(addBtn,tip);
   }
   collapseBody.append(compareBox);

   details.append(collapseBody);
   fields.append(details);

   const actions=element('div','image-actions');
   actions.append(button('↑ 上移',()=>move(index,index-1),index===0),button('↓ 下移',()=>move(index,index+1),index===p.images.length-1));
   const remove=button('从展示中移除',()=>{
    p.images.splice(index,1);openCards.delete(item.id);
    if(p.cover===item.src||p.cover===item.compare)p.cover=p.images[0]?.src||'project-placeholder.webp';
    render();changed();
   },p.images.length===1&&!p.videos?.length,'remove-image');
   if(p.images.length===1)remove.title='请先添加替代图片，再移除最后一张。';
   actions.append(remove);
   fields.append(actions);

   card.append(fields);
   list.append(card);
  });updatePublish();
 }

 function visibleFields(){return Object.entries(T.fieldsFor(textData,templates)).filter(([key])=>{
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
  $('image-panel').hidden=editorTab!=='images';$('video-panel').hidden=editorTab!=='videos';$('text-panel').hidden=!['project','site'].includes(editorTab);$('project-category-row').hidden=editorTab!=='project';$('project-category').value=T.projects(textData,templates)[selected]?.category||'studies';$('discard-new-project').hidden=!!base.projects[selected];if(editorTab==='videos')renderVideos();
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
  for(const key of Object.keys(T.fieldsFor(textData,templates))){if(editorTab==='project'?key.startsWith('project.'+selected+'.'):!key.startsWith('project.')){if(Object.hasOwn(textBase.values,key))textData.values[key]=T.clone(textBase.values[key]);}}
  renderText();renderSelect();render();changed();
 });

 $('new-project-button').addEventListener('click',()=>{$('new-project-form').reset();status('new-project-status','');$('new-project-dialog').showModal();$('new-project-zh').focus();});
 $('cancel-new-project').addEventListener('click',()=>$('new-project-dialog').close());
 $('new-project-form').addEventListener('submit',e=>{e.preventDefault();try{
  const id='project-'+crypto.randomUUID().slice(0,8);T.addProject(textData,data,templates,id,{zh:$('new-project-zh').value,en:$('new-project-en').value},$('new-project-category').value);
  selected=id;editorTab='project';$('new-project-dialog').close();renderSelect();render();renderText();changed();
 }catch(error){status('new-project-status',error.message,true);}});
 $('discard-new-project').addEventListener('click',()=>{
  if(base.projects[selected]||!confirm('放弃这个尚未发布的新项目及其草稿内容？'))return;
  delete data.projects[selected];delete textData.projects[selected];for(const key of Object.keys(textData.values))if(key.startsWith('project.'+selected+'.'))delete textData.values[key];
  selected=Object.keys(data.projects)[0];renderSelect();render();renderText();changed();
 });
 $('project-category').addEventListener('change',e=>{textData.projects=T.clone(T.projects(textData,templates));textData.projects[selected].category=e.target.value;changed();});
 async function getVideoCover(item,projectId){
  const url=V.info(item.url).url;status('video-status','正在自动读取视频封面…');
  try{const cover=await V.fetchCover(url);if(!cover||!data.projects[projectId]?.videos?.includes(item)||V.info(item.url).url!==url)return;Object.assign(item,cover,{posterUpdatedAt:new Date().toISOString(),posterStatus:'ready',posterError:''});if(selected===projectId)renderVideos();changed();status('video-status','已读取视频封面，发布后访客可以看到。');}
  catch{if(selected===projectId)status('video-status','浏览器未能直接读取封面，发布后自动任务会重试；也可以填写自选封面图地址。');}
 }
 function renderVideos(){
  const list=$('video-list');list.replaceChildren();const videos=data.projects[selected].videos||[];
  if(!videos.length)list.append(element('p','text-help','还没有视频。添加后会出现在这个项目的“项目视频”区域。'));
  videos.forEach((item,index)=>{
   const card=element('article','video-editor-card');card.append(element('h3','', '视频 '+(index+1)));const provider=V.info(item.url);const poster=V.poster(item,C.coverPath(data.projects[selected]));const posterImage=element('img','video-manager-poster');posterImage.src=C.safePath(poster)?preview(poster):poster;posterImage.alt='视频封面预览';posterImage.referrerPolicy='no-referrer';posterImage.addEventListener('error',()=>{posterImage.src=preview(C.coverPath(data.projects[selected]));},{once:true});card.append(posterImage);if(item.posterStatus==='unavailable'&&!item.posterOverride)card.append(element('p','text-help','平台暂时拒绝读取封面，已保留旧图或项目封面。可上传封面，或稍后重新获取。'));card.append(element('p','text-help',provider.provider==='bilibili'&&!item.poster&&!item.posterOverride?'发布后会尝试读取 B 站真实封面；当前显示项目封面。受平台限制时可上传封面。':provider.provider==='file'?'视频直链默认使用项目封面，也可以填写自己的封面图地址。':'已自动识别视频封面，也可以填写自己的封面图地址。'));
   for(const[key,label]of [['url','视频链接'],['title','中文视频标题'],['titleEn','英文视频标题'],['posterOverride','自选封面图地址（可选，留空自动）'],['playbackUrl','纯净播放版本（可选，自己的 MP4 / WebM 直链）']]){
    const l=element('label','',label),input=element('input');l.htmlFor='video-'+key+'-'+index;input.id=l.htmlFor;input.value=item[key]||'';input.maxLength=['url','posterOverride','playbackUrl'].includes(key)?2000:300;
    input.addEventListener(['url','posterOverride','playbackUrl'].includes(key)?'change':'input',()=>{try{if(key==='url'){const url=V.info(input.value).url;if(url!==item.url){for(const old of ['poster','posterFor','posterUpdatedAt','posterOverride','posterStatus','posterError','posterAttemptedAt','posterRefresh','playbackUrl'])delete item[old];item.url=url;}}else if(key==='playbackUrl'){const value=input.value.trim();if(value&&V.info(value).provider!=='file')throw new Error('请使用自己的 HTTPS MP4 / WebM 视频文件地址。');item.playbackUrl=value;}else if(key==='posterOverride'){const value=input.value.trim();if(value&&!V.imageURL(value))throw new Error('封面请使用 HTTPS 图片地址，或已上传图片在仓库中的路径。');item.posterOverride=value;}else item[key]=input.value;status('video-status','');changed();if(['url','posterOverride','playbackUrl'].includes(key))renderVideos();}catch(error){status('video-status',error.message+' 原内容已保留。',true);}});card.append(l,input);
   }
   const actions=element('div','image-actions');actions.append(button('上传封面',()=>{const input=$('video-cover-file');input.dataset.project=selected;input.dataset.video=item.id;input.click();}));
   const moveVideo=to=>{const [value]=videos.splice(index,1);videos.splice(to,0,value);renderVideos();changed();};
   actions.append(button('↑ 上移',()=>moveVideo(index-1),index===0),button('↓ 下移',()=>moveVideo(index+1),index===videos.length-1),button('移除视频',()=>{videos.splice(index,1);renderVideos();render();changed();}));
   if(provider.provider==='bilibili')actions.append(button('重新获取封面',()=>{item.posterRefresh=new Date().toISOString();renderVideos();changed();getVideoCover(item,selected);}));const link=element('a','', '打开原视频 ↗');link.href=item.url;link.target='_blank';link.rel='noopener';actions.append(link);card.append(actions);list.append(card);
  });
 }
 $('video-cover-file').addEventListener('change',async event=>{const input=event.target,file=input.files[0];if(!file||busy)return;const projectId=input.dataset.project,item=data.projects[projectId]?.videos?.find(v=>v.id===input.dataset.video);if(!item)return;setBusy(true);status('video-status','正在转换视频封面…');try{const result=await I.convert(file,'balanced'),path='images/uploads/video-cover-'+crypto.randomUUID()+'.webp';files.set(path,result.thumbnail||result.blob);item.posterOverride=path;renderVideos();changed();await saveDraft();status('video-status','封面已保存为草稿，发布后生效。');}catch(error){status('video-status',error.message,true);}finally{input.value='';setBusy(false);}});
 $('add-video-form').addEventListener('submit',e=>{e.preventDefault();try{
  const info=C.videoInfo($('new-video-url').value),p=data.projects[selected];if((p.videos||[]).length>=30)throw new Error('每个项目最多添加 30 个视频。');
  if(!p.videos)p.videos=[];const item={id:'video-'+crypto.randomUUID(),url:info.url,title:'',titleEn:''};p.videos.push(item);$('new-video-url').value='';renderVideos();render();changed();status('video-status','已添加到草稿。可以填写中英文标题，发布后访客才能看到。');if(info.provider==='bilibili')getVideoCover(item,selected);
 }catch(error){status('video-status',error.message,true);}});
 function desiredGallery(){const desired=C.clone(data);for(const[id,p]of Object.entries(desired.projects))p.title=textData.values['project.'+id+'.zh.title'];return desired;}
 function pageFiles(desired){return {...T.render(textData,templates,C.validate(desired)),'content-data.js':T.serialize(textData)};}
 $('preview-button').addEventListener('click',()=>{
  try{const desired=desiredGallery();let path=(textLanguage==='en'?'en/':'')+(editorTab==='site'?'index.html':'work-'+selected+'.html');let html=pageFiles(desired)[path];
   for(const[file]of C.usedFiles(data,files))html=html.split((textLanguage==='en'?'../':'./')+file).join(preview(file));
   const baseURL=new URL(textLanguage==='en'?'./en/':'./',location.href).href;html=html.replace('<html ', '<html data-theme="'+document.documentElement.dataset.theme+'" ');html=html.replace('<head>','<head><base href="'+T.esc(baseURL)+'">');
   $('content-preview').srcdoc=html;$('preview-dialog').showModal();$('close-preview').focus();
  }catch(error){status('draft-status',error.message,true);}
 });
 $('close-preview').addEventListener('click',()=>$('preview-dialog').close());
 function decodeFile(file){if(!file.content)throw new Error('GitHub 未返回完整文件，请重试。');return new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
 function formatBytes(bytes){return bytes>=1024*1024?(bytes/1024/1024).toFixed(2)+' MB':Math.max(1,Math.round(bytes/1024))+' KB';}
 async function addFiles(incoming,replacement){
  if(busy)return;const incomingFiles=Array.from(incoming);if(!incomingFiles.length)return;
  const projectId=selected;setBusy(true);clearTimeout(savingTimer);status('image-process-status','正在准备图片转换…');
  try{
   for(const file of incomingFiles)I.validateFile(file);
   const prepared=[];for(const[index,file]of incomingFiles.entries()){
    status('image-process-status','正在转换 '+(index+1)+' / '+incomingFiles.length+'：'+file.name);
    prepared.push({file,result:await I.convert(file,$('image-quality').value)});
   }
   const p=data.projects[projectId];if(replacement&&!p.images.some(i=>i.id===replacement))throw new Error('找不到要替换的图片。');
   let before=0,after=0;
   for(const {file,result}of prepared){
    const id='image-'+crypto.randomUUID(),path='images/uploads/'+id+'.webp';files.set(path,result.blob);let thumbnail;
    if(result.thumbnail){thumbnail='images/uploads/'+id+'-cover.webp';files.set(thumbnail,result.thumbnail);}
    const record={src:path,kind:'image',width:result.width,height:result.height,upload:{originalBytes:result.originalBytes,bytes:result.bytes,width:result.width,height:result.height,preset:result.preset}};if(thumbnail)record.thumbnail=thumbnail;
    if(replacement){const item=p.images.find(i=>i.id===replacement);if(p.cover===item.src)p.cover=path;delete item.thumbnail;Object.assign(item,record);}
    else{if(!p.images.length)p.cover=path;p.images.push({id,caption:'',alt:'',...record});}
    before+=result.originalBytes;after+=result.bytes+(result.thumbnail?.size||0);
   }
   render();changed();clearTimeout(savingTimer);await saveDraft();
   const difference=before?Math.round((1-after/before)*100):0;
   status('image-process-status','已转换 '+prepared.length+' 张：'+formatBytes(before)+' → '+formatBytes(after)+'（含封面小图）'+(difference>=0?'，减少约 '+difference+'%。':'；本批转换后体积增加约 '+Math.abs(difference)+'%，可选择“更小文件”重新添加。'));
  }catch(error){status('image-process-status',error.message+' 本批图片未加入，原草稿已保留。',true);}finally{setBusy(false);}
 }
 async function addCompareFile(incoming,targetId){
  if(busy)return;const file=incoming&&incoming[0];if(!file)return;
  const p=data.projects[selected],item=p.images.find(i=>i.id===targetId);if(!item)return;
  setBusy(true);clearTimeout(savingTimer);status('image-process-status','正在准备对比效果图转换…');
  try{
   I.validateFile(file);
   const result=await I.convert(file,$('image-quality').value);
   const id='image-'+crypto.randomUUID(),path='images/uploads/'+id+'.webp';
   files.set(path,result.blob);
   const previousCompare=item.compare;
   item.compare=path;
   if(p.cover===previousCompare)p.cover=path;
   delete item.compareThumbnail;
   if(result.thumbnail){
    const thumbPath='images/uploads/'+id+'-cover.webp';
    files.set(thumbPath,result.thumbnail);
    item.compareThumbnail=thumbPath;
   }
   if(!item.beforeLabel)item.beforeLabel='原图';
   if(!item.beforeLabelEn)item.beforeLabelEn='Before';
   if(!item.afterLabel)item.afterLabel='效果';
   if(!item.afterLabelEn)item.afterLabelEn='After';
   openCards.add(targetId);
   render();changed();clearTimeout(savingTimer);await saveDraft();
   status('image-process-status','已添加对比效果图：'+formatBytes(result.originalBytes)+' → WebP '+formatBytes(result.bytes)+'。可点击“预览未发布修改”查看滑动效果。');
  }catch(error){status('image-process-status',error.message+' 对比图未加入，原草稿已保留。',true);}
  finally{setBusy(false);}
 }
 $('project-layout').addEventListener('change',e=>{data.projects[selected].layout=e.target.value;changed();});
 $('auto-layout').addEventListener('click',()=>{data.projects[selected].layout='auto';data.projects[selected].images.forEach(i=>delete i.layout);render();changed();});
 const toggleCollapseBtn=$('toggle-collapse-all');
 if(toggleCollapseBtn){
  toggleCollapseBtn.addEventListener('click',()=>{
   const p=data.projects[selected];if(!p)return;
   const allOpen=p.images.every(i=>openCards.has(i.id));
   if(allOpen)openCards.clear();else p.images.forEach(i=>openCards.add(i.id));
   render();
  });
 }
 $('image-files').addEventListener('change',async e=>{await addFiles(e.target.files);e.target.value='';});
 $('replace-file').addEventListener('change',async e=>{await addFiles(e.target.files,e.target.dataset.imageId);e.target.value='';});
 $('compare-file').addEventListener('change',async e=>{await addCompareFile(e.target.files,e.target.dataset.imageId);e.target.value='';});
 const drop=$('dropzone');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));drop.addEventListener('drop',async e=>{e.preventDefault();drop.classList.remove('dragover');await addFiles(e.dataTransfer.files);});
 $('project-select').addEventListener('change',e=>{selected=e.target.value;renderSelect();render();renderText();changed();});
 $('reset-project').addEventListener('click',()=>{if(!confirm('撤销这个项目尚未发布的图片与顺序修改？'))return;const current=data.projects[selected],original=base.projects[selected];current.cover=original?.cover||'project-placeholder.webp';current.images=C.clone(original?.images||[]);render();changed();});
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
  try{T.readyToPublish(textData,templates,desired);const output=pageFiles(desired);const sha=await C.publish(desired,files,session,api,message=>status('publish-status',message),output);data=desired;base=C.clone(desired);textBase=T.clone(textData);session.base=sha;files.clear();renderSelect();render();renderText();await saveDraft();status('publish-status','已提交到 GitHub。请等待 Pages 更新后打开作品页确认。');const link=$('commit-link');link.href='https://github.com/'+C.OWNER+'/'+C.REPO+'/commit/'+encodeURIComponent(sha);link.hidden=false;}
  catch(error){const phase=$('publish-status').textContent;status('publish-status',phase+'：'+error.message,true);}finally{setBusy(false);}
 });
 let zipLoader;
 function loadZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(!zipLoader)zipLoader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='./jszip.min.js';
   script.onload=()=>resolve(window.JSZip);
   script.onerror=()=>{script.remove();zipLoader=null;reject(new Error('导出组件加载失败，请检查网络后重试。'));};
   document.head.append(script);
  });
  return zipLoader;
 }
 $('export-button').addEventListener('click',async()=>{
  setBusy(true);try{await saveDraft();const Zip=await loadZip();const zip=new Zip();const desired=desiredGallery();desired.updatedAt=new Date().toISOString();zip.file('gallery-data.js',C.serialize(desired));for(const[path,source]of Object.entries(pageFiles(desired)))zip.file(path,source);for(const[path,file]of C.usedFiles(data,files))zip.file(path,file);zip.file('更新说明.txt','这是图片与文字更新包，不是完整网站。\n\n解压后把所有文件按原路径合并到仓库，包括根目录和 en/ 的 HTML 网页、content-data.js、gallery-data.js 、sitemap.xml 及 images/uploads/ 新图片。必须一并提交才能同步中英文与搜索摘要。\n\n日常建议直接在管理页连接 GitHub，点击发布所有修改。仅从展示中移除的图片，原文件仍在仓库。完整简历不在公开网站中维护。\n');const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});const url=URL.createObjectURL(blob);const a=element('a');a.href=url;a.download='作品集_图片文字更新_'+new Date().toISOString().slice(0,10)+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status('publish-status','更新文件已导出。此操作不会改变公开网站。');}catch(error){status('publish-status','导出未完成：'+error.message,true);}finally{setBusy(false);}
 });
 try{db=await openDB();const saved=await dbRead();if(saved){C.validate(saved.base);C.validate(saved.data);files=new Map(saved.files||[]);try{data=C.merge(saved.base,saved.data,base);}catch{data=C.clone(saved.data);base=C.clone(saved.base);status('draft-status','线上作品可能有更新，本地草稿已恢复，请先导出再连接核对。',true);}if(saved.textBase&&saved.textData){try{textData=T.merge(saved.textBase,saved.textData,textBase,templates);}catch{textData=T.clone(saved.textData);textBase=T.clone(saved.textBase);status('draft-status','文字草稿与线上有差异，已保留草稿；请导出备份后连接核对。',true);}}if(saved.selected&&data.projects[saved.selected])selected=saved.selected;if(!$('draft-status').classList.contains('error'))status('draft-status','已恢复当前浏览器中的草稿。');}}
 catch{status('draft-status','当前浏览器无法保存草稿，请完成后导出更新文件。',true);}
 renderSelect();render();renderText();window.addEventListener('pagehide',()=>{token='';session=null;});window.addEventListener('pageshow',event=>{if(event.persisted){$('disconnect-button').hidden=true;status('connection-status','已断开连接，草稿仍然保留。需要发布时请重新连接。');updatePublish();}});
})();
