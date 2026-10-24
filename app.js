'use strict';
const filters = Array.from(document.querySelectorAll('[data-filter]'));
const cards = Array.from(document.querySelectorAll('.project-card'));
filters.forEach(button => button.addEventListener('click', () => {
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
  document.getElementById('filter-status').textContent = `当前显示 ${visible} 组作品`;
}));
const copy = document.querySelector('.copy-email');
if (copy) copy.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(copy.dataset.email);
    status.textContent = '邮箱已复制，可以粘贴到邮件应用。';
  } catch {
    status.textContent = `请复制邮箱：${copy.dataset.email}`;
  }
});
const backTop = document.querySelector('.back-top');
if (backTop) {
  const update = () => backTop.classList.toggle('visible', window.scrollY > 650);
  window.addEventListener('scroll', update, {passive:true});
  update();
  backTop.addEventListener('click', () => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}

const galleryData=window.PORTFOLIO_GALLERIES;
const validImagePath=path=>typeof path==='string' && /^(?:images\/uploads\/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(path) && !path.includes('..');
if(galleryData && galleryData.projects){
  document.querySelectorAll('[data-project-card]').forEach(card=>{
    const project=galleryData.projects[card.dataset.projectCard];
    if(project && validImagePath(project.cover))card.querySelector('img').src='./'+project.cover;
  });
  const heroImage=document.querySelector('.hero-art>img');
  const heroProject=galleryData.projects['yunba-depot'];
  if(heroImage && heroProject && validImagePath(heroProject.cover))heroImage.src='./'+heroProject.cover;
}
const gallery=document.querySelector('[data-gallery]');
const projectGallery=gallery && galleryData && galleryData.projects[gallery.dataset.gallery];
let lightboxItems=[];
if(projectGallery){
  const root=gallery.dataset.root;
  gallery.replaceChildren();
  projectGallery.images.filter(item=>validImagePath(item.src)).forEach((item,index)=>{
    const figure=document.createElement('figure');figure.className='gallery-item'+(item.kind==='collage'?' legacy':'');
    const button=document.createElement('button');button.type='button';button.className='gallery-button';button.dataset.galleryIndex=String(lightboxItems.length);button.setAttribute('aria-label','放大查看第 '+(index+1)+' 张：'+(item.caption||projectGallery.title));
    const image=document.createElement('img');image.src=root+item.src;image.alt=item.alt||projectGallery.title;image.loading='lazy';button.append(image);figure.append(button);
    const caption=document.createElement('figcaption');caption.textContent=String(index+1).padStart(2,'0')+' / '+(item.caption||projectGallery.title);figure.append(caption);gallery.append(figure);lightboxItems.push({...item,url:root+item.src});
  });
  document.querySelector('[data-gallery-count]').textContent=lightboxItems.length+' 张图片 · 点击放大查看';
}
const dialog=document.querySelector('.lightbox');
if(dialog && lightboxItems.length){
  let currentIndex=0,lastTrigger=null;
  const picture=dialog.querySelector('.lightbox-scroll img'),previous=dialog.querySelector('.previous-image'),next=dialog.querySelector('.next-image');
  function show(index){
    currentIndex=index;const item=lightboxItems[index];picture.src=item.url;picture.alt=item.alt||projectGallery.title;
    dialog.querySelector('.lightbox-toolbar>span').textContent=item.caption||projectGallery.title;
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
