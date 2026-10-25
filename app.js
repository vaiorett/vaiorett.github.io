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
if(galleryData && galleryData.projects){
  document.querySelectorAll('[data-project-card]').forEach(card=>{
    const project=galleryData.projects[card.dataset.projectCard];
    if(project && validImagePath(project.cover))card.querySelector('img').src=assetRoot+project.cover;
  });
  const heroImage=document.querySelector('.hero-art>img');
  const heroProject=galleryData.projects['yunba-depot'];
  if(heroImage && heroProject && validImagePath(heroProject.cover))heroImage.src=assetRoot+heroProject.cover;
}
document.querySelectorAll('[data-project-preview]').forEach(image => {
  const cover = galleryData?.projects?.[image.dataset.projectPreview]?.cover;
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
  gallery.replaceChildren();
  projectGallery.images.filter(item=>validImagePath(item.src)).forEach((item,index)=>{
    const figure=document.createElement('figure');figure.className='gallery-item'+(item.kind==='collage'?' legacy':'');
    const button=document.createElement('button');button.type='button';button.className='gallery-button';button.dataset.galleryIndex=String(lightboxItems.length);button.setAttribute('aria-label',localized('放大查看第 '+(index+1)+' 张：', 'Enlarge image '+(index+1)+': ')+imageCaption(item));
    const image=document.createElement('img');image.src=root+item.src;image.alt=imageAlt(item);image.loading='lazy';button.append(image);figure.append(button);
    const caption=document.createElement('figcaption');caption.textContent=String(index+1).padStart(2,'0')+' / '+imageCaption(item);figure.append(caption);gallery.append(figure);lightboxItems.push({...item,url:root+item.src});
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

// Only load the official Bilibili player after a visitor chooses to watch.
document.querySelectorAll('[data-video-embed]').forEach(button=>button.addEventListener('click',()=>{
  let url;try{url=new URL(button.dataset.videoEmbed);}catch{return;}
  if(url.origin!=='https://player.bilibili.com'||url.pathname!=='/player.html'||!/^BV[0-9A-Za-z]{10}$/.test(url.searchParams.get('bvid')||''))return;
  const frame=document.createElement('iframe');frame.src=url.href;frame.title=button.dataset.videoTitle||localized('项目视频','Project video');frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.className='video-player';
  const screen=button.closest('.video-screen');screen.replaceChildren(frame);frame.focus();
}));
