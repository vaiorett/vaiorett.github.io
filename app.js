'use strict';
const english = document.documentElement.lang === 'en';
const assetRoot = document.body.dataset.root || './';
const localized = (zh, en) => english ? en : zh;
// Real links keep the equivalent page available without JavaScript.
document.querySelectorAll('[data-language]').forEach(link => {
  const target = new URL(link.href);
  target.hash = location.hash;
  // Keep the active category when switching the home page language.
  if (location.search) target.search = location.search;
  link.href = target.href;
});

const filters = Array.from(document.querySelectorAll('[data-filter]'));
const cards = Array.from(document.querySelectorAll('.project-card'));
document.querySelector('.filter-bar')?.removeAttribute('hidden');
function filterProjects(button, updateURL = true) {
  const category = button.dataset.filter;
  filters.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  let visible = 0;
  cards.forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) visible++;
  });
  document.getElementById('filter-status').textContent = localized(`当前显示 ${visible} 组作品`, `Showing ${visible} projects`);
  if (updateURL) {
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('filter'); else url.searchParams.set('filter', category);
    history.replaceState(null, '', url);
    document.querySelectorAll('[data-language]').forEach(link => { const target = new URL(link.href); target.search = url.search; target.hash = location.hash; link.href = target.href; });
  }
}
filters.forEach(button => button.addEventListener('click', () => filterProjects(button)));
const requestedFilter = new URLSearchParams(location.search).get('filter');
if (requestedFilter) {
  const button = filters.find(item => item.dataset.filter === requestedFilter);
  if (button) filterProjects(button, false);
}
const requestedRole = (new URLSearchParams(location.search).get('role') || '').toLowerCase();
const rolePresets = {
  visual: {
    zh: { title: 'Vaiorett · 视觉设计与 AIGC 工作流作品集', hero: '数字视觉设计与', accent: 'AIGC 生成式工作流。', intro: '经验丰富的产品、空间与品牌视觉制作，结合三维渲染、平面排版（Photoshop / InDesign）与 ComfyUI / Stable Diffusion 生成式管线，高效交付高质量视觉内容。', aboutLead: '我是 Vaiorett，经验丰富的数字视觉设计、三维渲染表现与 AIGC 生成式工作流实践者。', contactTitle: '寻找视觉设计、渲染\n与 AIGC 创作机会。', contactIntro: '专注非销售类的视觉设计、AIGC 内容制作、产品与空间表现及图文排版岗位，欢迎通过邮件联系。' },
    en: { title: 'Vaiorett · Visual Design & AIGC Workflow Portfolio', hero: 'Visual design &', accent: 'AIGC workflows.', intro: 'Experienced in product, spatial, and brand visuals—combining 3D rendering, editorial layout (Photoshop / InDesign), and ComfyUI / Stable Diffusion generative pipelines.', aboutLead: 'I’m Vaiorett, an experienced specialist in digital visual design, 3D rendering, and AIGC generative workflows.', contactTitle: 'Open to visual design\n& AIGC roles.', contactIntro: 'Focused on non-sales roles in visual design, AIGC content production, product rendering, and layout.' }
  },
  engineering: {
    zh: { title: 'Vaiorett · 工程制图与三维数字化技术作品集', hero: '工程制图与', accent: '三维数字化技术。', intro: '经验丰富的工程制图与三维建模实践，从 AutoCAD / 天正建筑 / Revit 图纸深化，到工业与建筑三维建模（UG / Blender / 3ds Max）、实景扫描重建与数字资产标准化交付。', aboutLead: '我是 Vaiorett，经验丰富的工程制图、三维数字化建模与数字资产技术实践者。', contactTitle: '寻找工程制图、建模\n与数字化技术岗位。', contactIntro: '专注非销售类的 CAD / BIM 工程制图、三维数字化工程师、工业与建筑建模及技术支持岗位，欢迎通过邮件联系。' },
    en: { title: 'Vaiorett · CAD Drafting & 3D Digitization Engineering Portfolio', hero: 'CAD drafting &', accent: '3D digitization.', intro: 'Experienced in engineering drafting and 3D modeling—from AutoCAD / TArch / Revit drawing development to industrial & architectural 3D modeling (UG / Blender / 3ds Max) and photogrammetry asset delivery.', aboutLead: 'I’m Vaiorett, an experienced practitioner in CAD engineering drafting, 3D digitization modeling, and digital asset production.', contactTitle: 'Open to CAD drafting\n& 3D engineering roles.', contactIntro: 'Focused on non-sales roles in CAD/BIM drafting, 3D digitization engineering, and technical modeling.' }
  },
  ops: {
    zh: { title: 'Vaiorett · 数字化项目协作与技术文控作品集', hero: '数字化项目协作与', accent: '技术文控 · 流程规范。', intro: '经验丰富的数字化项目协作与流程规范实践，结合三维与工程制图背景、工商企业管理知识、ISO 9001:2015 内审员资质与 AI / MS Office 提效工具，推进设计协作与标准化技术文档管理。', aboutLead: '我是 Vaiorett，经验丰富的数字化项目协作、技术文档规范与跨工具流程实践者。', contactTitle: '寻找项目协作、文控\n与数字化运营岗位。', contactIntro: '专注非销售类的设计项目协调、技术文档与数字资产管理、ISO 质量体系文控及数字化运营支持岗位，欢迎通过邮件联系。' },
    en: { title: 'Vaiorett · Project Coordination & Technical Documentation Portfolio', hero: 'Project coordination &', accent: 'technical documentation.', intro: 'Experienced in project coordination and workflow standardization—combining 3D/CAD production experience, Business Administration studies, ISO 9001:2015 Internal Auditor certification, and AI/Office workflows.', aboutLead: 'I’m Vaiorett, an experienced coordinator in digital project workflows, technical documentation, and cross-tool execution.', contactTitle: 'Open to coordination &\ndocumentation roles.', contactIntro: 'Focused on non-sales roles in design coordination, technical documentation, ISO quality control, and digital operations.' }
  },
  tech: {
    zh: { title: 'Vaiorett · 数字化工具链与 Linux / AI 技术支持作品集', hero: '数字化工具链与', accent: 'Linux · AI 技术支持。', intro: '经验丰富的数字化工具链部署与技术支持实践，熟悉 Linux（Fedora KDE / Ubuntu GNOME）桌面环境、本地 AI 工作流（ComfyUI / Stable Diffusion）部署及三维数字资产管线维护与排障。', aboutLead: '我是 Vaiorett，经验丰富的 Linux 桌面环境、AI 工具链部署与三维数字资产管线技术实践者。', contactTitle: '寻找数字化工具支持\n与系统技术运维岗位。', contactIntro: '专注非销售类的 Linux 桌面与工具链支持、AIGC 环境部署、数字资产归档及技术运维支持岗位，欢迎通过邮件联系。' },
    en: { title: 'Vaiorett · Linux, AI Toolchain & 3D Technical Support Portfolio', hero: 'Digital toolchains &', accent: 'Linux · AI support.', intro: 'Experienced with Linux desktops (Fedora KDE / Ubuntu GNOME), local AI workflow deployment (ComfyUI / Stable Diffusion), and 3D digital asset pipeline maintenance.', aboutLead: 'I’m Vaiorett, an experienced specialist in Linux desktop environments, local AI toolchain deployment, and 3D digital asset pipelines.', contactTitle: 'Open to technical support\n& Linux/AI workflow roles.', contactIntro: 'Focused on non-sales roles in Linux desktop support, AI toolchain deployment, and digital asset management.' }
  }
};
rolePresets.aigc = rolePresets.visual;
rolePresets.cad = rolePresets.engineering;
rolePresets.coord = rolePresets.ops;
rolePresets.linux = rolePresets.tech;
if (rolePresets[requestedRole]) {
  const preset = rolePresets[requestedRole][english ? 'en' : 'zh'];
  document.title = preset.title;
  const h1 = document.getElementById('intro-title');
  if (h1) {
    h1.textContent = preset.hero;
    h1.append(document.createElement('br'));
    const span = document.createElement('span');
    span.innerHTML = preset.accent.replace(/\n/g, '<br>');
    h1.append(span);
  }
  const introEl = document.querySelector('.hero-intro');
  if (introEl) introEl.innerHTML = preset.intro.replace(/\n/g, '<br>');
  const aboutLeadEl = document.querySelector('.about-intro p:first-child');
  if (aboutLeadEl && preset.aboutLead) aboutLeadEl.textContent = preset.aboutLead;
  const contactH2 = document.querySelector('#contact h2');
  if (contactH2) contactH2.innerHTML = preset.contactTitle.replace(/\n/g, '<br>');
  const contactP = document.querySelector('#contact > div > p:last-child');
  if (contactP) contactP.textContent = preset.contactIntro;
  document.querySelectorAll('[data-language], .brand, .site-header nav a').forEach(link => {
    try { const url = new URL(link.href, location.href); url.searchParams.set('role', requestedRole); link.href = url.pathname + url.search + url.hash; } catch {}
  });
}
window.addEventListener('hashchange', () => document.querySelectorAll('[data-language]').forEach(link => { const url = new URL(link.href); url.hash = location.hash; link.href = url.href; }));
const copy = document.querySelector('.copy-email');
if (copy) copy.hidden = false;
if (copy) copy.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(copy.dataset.email);
    status.textContent = localized('邮箱已复制，可以粘贴到邮件应用。', 'Email copied. You can paste it into your mail app.');
  } catch {
    status.textContent = localized(`请复制邮箱：${copy.dataset.email}`, `Please copy this address: ${copy.dataset.email}`);
  }
});
const backTop = document.querySelector('.back-top');
if (backTop) {
  const update = () => { backTop.hidden = window.scrollY <= 650; backTop.classList.toggle('visible', !backTop.hidden); };
  window.addEventListener('scroll', update, {passive:true});
  update();
  backTop.addEventListener('click', () => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}

const galleryData=window.PORTFOLIO_GALLERIES;
const validImagePath=path=>typeof path==='string' && /^(?:images\/uploads\/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(path) && !path.includes('..');
const displayCover=p=>p.images.find(i=>i.src===p.cover)?.thumbnail||p.cover;
if(galleryData && galleryData.projects){
  document.querySelectorAll('[data-project-card]').forEach(card=>{
    const project=galleryData.projects[card.dataset.projectCard];
    if(project && validImagePath(project.cover))card.querySelector('img').src=assetRoot+displayCover(project);
  });
  const heroImage=document.querySelector('.hero-art>img');
  const heroProject=galleryData.projects['yunba-depot'];
  if(heroImage && heroProject && validImagePath(heroProject.cover))heroImage.src=assetRoot+displayCover(heroProject);
}
document.querySelectorAll('[data-project-preview]').forEach(image => {
  const p=galleryData?.projects?.[image.dataset.projectPreview];const cover=p?displayCover(p):null;
  if (validImagePath(cover)) image.src = assetRoot + cover;
});
const gallery=document.querySelector('[data-gallery]');
const projectTitle = gallery?.dataset.title || '';
const imageCaption = item => english ? (item.captionEn || 'Project image') : (item.caption || projectTitle);
const imageAlt = item => english ? (item.altEn || projectTitle) : (item.alt || projectTitle);
const projectGallery=gallery && galleryData && galleryData.projects[gallery.dataset.gallery];
let lightboxItems=[];
if(projectGallery){
  const root=gallery.dataset.root;
  gallery.innerHTML=window.LayoutCore.markup(projectGallery,english?'en':'zh',{title:projectTitle,overview:localized('项目作品','Project image'),open:localized('打开原图','Open original image')});
  gallery.querySelectorAll('.gallery-button').forEach((link,index)=>{
    const item=projectGallery.images[index];if(!validImagePath(item.src))return;
    const button=document.createElement('button');button.type='button';button.className='gallery-button';button.dataset.galleryIndex=String(lightboxItems.length);button.setAttribute('aria-label',localized('放大查看第 '+(index+1)+' 张：','Enlarge image '+(index+1)+': ')+imageCaption(item));
    while(link.firstChild)button.append(link.firstChild);link.replaceWith(button);lightboxItems.push({...item,url:root+item.src});
  });
  document.querySelector('[data-gallery-count]').textContent=localized(lightboxItems.length+' 张图片 · 点击放大查看',lightboxItems.length+' image'+(lightboxItems.length===1?'':'s')+' · Click to enlarge');
}
const dialog=document.querySelector('.lightbox');
if(dialog && lightboxItems.length){
  let currentIndex=0,lastTrigger=null;
  const picture=dialog.querySelector('.lightbox-scroll img'),previous=dialog.querySelector('.previous-image'),next=dialog.querySelector('.next-image');
  function show(index){
    currentIndex=index;const item=lightboxItems[index];picture.src=item.url;picture.alt=imageAlt(item);
    dialog.querySelector('.lightbox-toolbar>span').textContent=imageCaption(item);
    dialog.querySelector('.lightbox-position').textContent=(index+1)+' / '+lightboxItems.length;
    previous.disabled=index===0;next.disabled=index===lightboxItems.length-1;dialog.querySelector('.lightbox-scroll').scrollTop=0;
  }
  gallery.querySelectorAll('[data-gallery-index]').forEach(button=>button.addEventListener('click',()=>{lastTrigger=button;show(Number(button.dataset.galleryIndex));dialog.showModal();document.body.style.overflow='hidden';}));
  previous.addEventListener('click',()=>{if(currentIndex>0)show(currentIndex-1);});
  next.addEventListener('click',()=>{if(currentIndex<lightboxItems.length-1)show(currentIndex+1);});
  dialog.querySelector('.close-lightbox').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&currentIndex>0){event.preventDefault();show(currentIndex-1);}if(event.key==='ArrowRight'&&currentIndex<lightboxItems.length-1){event.preventDefault();show(currentIndex+1);}});
  dialog.addEventListener('close',()=>{document.body.style.overflow='';if(lastTrigger)lastTrigger.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}

// Video cards use native platform controls; no overlays intercept third-party players.
document.querySelectorAll('.video-poster').forEach(image=>{
 let attempts=0;
 const fallback=()=>{const next=attempts++===0?image.dataset.posterFallback:image.dataset.projectPoster;if(next&&attempts<=2&&new URL(next,location.href).href!==image.src)image.src=next;else image.hidden=true;};
 image.addEventListener('error',fallback);
 const verify=()=>{if(image.src.includes('/maxresdefault.jpg')&&image.naturalWidth<200)fallback();};image.addEventListener('load',verify);if(image.complete&&image.naturalWidth)verify();
});
document.querySelectorAll('[data-video-url]').forEach(button=>button.addEventListener('click',()=>{
 const V=window.VideoCore;let info;try{info=V.info(button.dataset.videoUrl);}catch{return;}
 const card=button.closest('.project-video'),screen=card.querySelector('.video-screen'),status=card.querySelector('.video-play-status'),title=button.dataset.videoTitle||localized('项目视频','Project video');
 let player;
 if(info.provider==='file'){
  player=document.createElement('video');player.controls=true;player.playsInline=true;player.preload='metadata';player.src=info.url;player.setAttribute('aria-label',title);
  const cover=button.querySelector('img');if(cover&&!cover.hidden)player.poster=cover.src;
  player.addEventListener('click',event=>{const rect=player.getBoundingClientRect();if(event.clientY>rect.bottom-56)return;if(player.paused)player.play().catch(()=>{});else player.pause();});
  player.addEventListener('error',()=>{status.textContent=localized('视频暂时无法播放，可在“播放选项”中打开来源。','Video unavailable. Open the source from Playback options.');});
 }else{
  player=document.createElement('iframe');player.title=title;player.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';player.allowFullscreen=true;player.referrerPolicy='strict-origin-when-cross-origin';
  let embedUrl=info.embed;
  if(info.provider==='bilibili'){
   player.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');
   embedUrl='https://www.bilibili.com/blackboard/html5mobileplayer.html?isOutside=true&bvid='+encodeURIComponent(info.bvid)+'&page='+(info.page||1)+'&p='+(info.page||1)+'&autoplay=1&danmaku=0&hideDanmakuButton=1&high_quality=1';
  }else if(info.provider==='youtube'){
   embedUrl='https://www.youtube.com/embed/'+info.id+'?autoplay=1&playsinline=1&rel=0&modestbranding=1';
   if(location.protocol.startsWith('http')&&location.hostname!=='127.0.0.1')embedUrl+='&origin='+encodeURIComponent(location.origin);
  }
  player.src=embedUrl;
 }
 player.className='video-player';screen.replaceChildren(player);
 const toolbar=card.querySelector('.video-toolbar');
 if(info.provider!=='bilibili'){
  toolbar.hidden=false;
  const close=document.createElement('button');close.type='button';close.className='video-collapse';close.textContent='×';close.setAttribute('aria-label',localized('收起视频','Close video'));close.title=close.getAttribute('aria-label');toolbar.prepend(close);
  close.addEventListener('click',()=>{if(info.provider==='file'){player.pause();player.removeAttribute('src');player.load();}screen.replaceChildren(button);close.remove();toolbar.hidden=true;toolbar.querySelector('details').open=false;status.textContent='';button.focus();});
 }
 if(info.provider==='file')player.play().catch(()=>{status.textContent=localized('点击视频画面或播放键开始播放。','Press play to start the video.');});
}));
