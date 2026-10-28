/* Local interface icons and image comparison controls. Background is static CSS. */
(function(){
 'use strict';
 const en=document.documentElement.lang==='en',root=document.body.dataset.root||'./';
 const paths={
  sun:'M12 19a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1m6.364-2.05a1 1 0 1 0-1.414 1.414l.707.707a1 1 0 0 0 1.414-1.414zm-11.314 0a1 1 0 0 0-1.414 0l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414M12 6a6 6 0 1 0 0 12a6 6 0 0 0 0-12m8 5a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zM3 11a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zm16.071-6.071a1 1 0 0 0-1.414 0l-.707.707a1 1 0 1 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414m-12.728 0a1 1 0 0 0-1.414 1.414l.707.707A1 1 0 1 0 7.05 5.636zM12 2a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1',
  moon:'M13.574 3.137a1.01 1.01 0 0 0-1.097 1.408a6 6 0 0 1-7.931 7.931c-.747-.335-1.548.307-1.409 1.098A9 9 0 0 0 21 12c0-4.435-3.206-8.118-7.426-8.863',
  mail:'M3 5h18v14H3zM3 5l9 7 9-7',
  copy:'M9 9h12v12H9zM5 15H3V3h12v2'
 };
 function icon(name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('width','20');
  svg.setAttribute('height','20');
  svg.setAttribute('aria-hidden','true');
  const p=document.createElementNS(svg.namespaceURI,'path');
  p.setAttribute('d',paths[name]);
  if(name==='sun'||name==='moon'){
   svg.setAttribute('fill','currentColor');
   p.setAttribute('fill','currentColor');
   if(name==='moon'){p.setAttribute('fill-rule','evenodd');p.setAttribute('clip-rule','evenodd');}
  }else{
   svg.setAttribute('fill','none');
   svg.setAttribute('stroke','currentColor');
   svg.setAttribute('stroke-width','1.6');
   svg.setAttribute('stroke-linecap','round');
   svg.setAttribute('stroke-linejoin','round');
  }
  svg.append(p);
  return svg;
 }
 function init(){
  document.querySelectorAll('[data-theme-select]').forEach(select=>{
   const label=select.closest('label');if(!label)return;
   const btn=document.createElement('button');
   btn.type='button';
   btn.className='button-light-primary md dark-mode-switch';
   btn.addEventListener('click',()=>{
    const isDark=document.documentElement.dataset.theme==='dark';
    select.value=isDark?'light':'dark';
    select.dispatchEvent(new Event('change',{bubbles:true}));
   });
   label.after(btn);label.hidden=true;
   function sync(){
    const isDark=document.documentElement.dataset.theme==='dark';
    document.documentElement.classList.toggle('dark',isDark);
    select.value=document.documentElement.dataset.themePreference||(isDark?'dark':'light');
    btn.replaceChildren(icon(isDark?'sun':'moon'));
    const labelText=isDark?(en?'Change to light mode':'切换到浅色模式'):(en?'Change to dark mode':'切换到深色模式');
    btn.setAttribute('aria-label',labelText);
    btn.title=labelText;
   }
   sync();
   new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-theme-preference']});
  });
  document.querySelectorAll('.site-header nav a').forEach(a=>a.classList.add('md','link-button','button-light-primary'));
  document.querySelectorAll('.language-switch a').forEach(a=>{
   a.classList.add('md','link-button',a.hasAttribute('aria-current')?'button-solid-primary':'button-light-primary');
   if(a.dataset.language==='en')a.textContent='English';
   if(a.dataset.language==='zh')a.textContent='中文';
  });
  document.querySelectorAll('.contact-links a[href^="mailto:"]').forEach(a=>{a.classList.add('contact-email');a.prepend(icon('mail'));});
  document.querySelectorAll('.copy-email').forEach(b=>b.prepend(icon('copy')));
  const logos={'Gemini CLI':'geminicli','Google Antigravity':'googleantigravity','Substance 3D Designer':'substancedesigner','Marvelous Designer':'marvelousdesigner','ZBrush':'zbrush','Windows':'windows','DaVinci Resolve':'davinciresolve','Adobe Premiere Pro':'adobepremierepro','Blender':'blender','3ds Max':'autodesk','SketchUp':'sketchup','Rhino':'rhinoceros','UG':'siemens','RealityCapture':'epicgames','UE5':'unrealengine','V-Ray':'vray','Corona':'coronarenderer','Chaos Vantage':'chaosvantage','D5':'d5render','Enscape':'enscape','AutoCAD':'autocad','天正建筑':'tarch','TArch':'tarch','Revit':'autodeskrevit','Gemini':'googlegemini','ChatGPT':'openai','Claude':'claude','ComfyUI':'comfyui','Comfy UI':'comfyui','Stable Diffusion':'stablediffusion','AIGC':'aigc','Photoshop':'adobephotoshop','InDesign':'adobeindesign','MS Office':'msoffice','Linux':'linux','Fedora KDE':'fedora','Fedora':'fedora','KDE':'kde','Ubuntu GNOME':'ubuntu','Ubuntu Gonme':'ubuntu','Ubuntu':'ubuntu','GNOME':'gnome'};
  const monograms={'V-Ray':'VR','Chaos Vantage':'CV','D5':'D5','Photoshop':'Ps','InDesign':'Id','AIGC':'AI','MS Office':'Of'};
  document.querySelectorAll('.skill-tags>span').forEach(tag=>{const tool=tag.textContent.trim();const match=Object.keys(logos).find(k=>k.toLowerCase()===tool.toLowerCase());const key=logos[tool]||(match&&logos[match]);if(key){const img=document.createElement('img');img.src=root+'assets/icons/'+key+'.svg';img.alt='';img.width=22;img.height=22;if(key==='marvelousdesigner')img.className='brand-color';tag.prepend(img);}else{const mark=document.createElement('span');mark.className='tool-monogram';mark.setAttribute('aria-hidden','true');mark.textContent=monograms[tool]||tool.slice(0,2);tag.prepend(mark);}});
  initComparers();
 }
 function initComparers(container=document){
  container.querySelectorAll('[data-comparer]').forEach(el=>{
   if(el.__comparerInit)return;
   el.__comparerInit=true;
   const stage=el.querySelector('.compare-stage'),handle=el.querySelector('.compare-handle-line');
   const badgeBefore=el.querySelector('.compare-badge-before'),badgeAfter=el.querySelector('.compare-badge-after');
   if(!stage||!handle)return;
   const effect=el.querySelector('.compare-after'),original=el.querySelector('.compare-before');
   let originalReady=Boolean(original?.complete&&original.naturalWidth),requestedPos=0;
   function loadOriginal(){
    if(!original?.dataset.src)return;
    original.addEventListener('load',()=>{originalReady=true;setPos(requestedPos);},{once:true});
    if(original.dataset.srcset){original.srcset=original.dataset.srcset;delete original.dataset.srcset;}
    original.src=original.dataset.src;delete original.dataset.src;
   }
   async function effectReady(){
    if(!effect?.naturalWidth)return;
    try{await effect.decode();}catch{}
    loadOriginal();
   }
   if(effect?.complete&&effect.naturalWidth)effectReady();
   else effect?.addEventListener('load',effectReady,{once:true});
   let dragging=false,pos=0,resetTimer=null;
   function setPos(percent){
    requestedPos=Math.max(0,Math.min(100,percent));
    pos=originalReady?requestedPos:0;
    el.style.setProperty('--pos',pos+'%');
    handle.setAttribute('aria-valuenow',Math.round(pos));
    if(badgeBefore)badgeBefore.style.opacity=pos<12?'0':(pos<24?String((pos-12)/12):'1');
    if(badgeAfter)badgeAfter.style.opacity=pos>88?'0':(pos>76?String((88-pos)/12):'1');
   }
   function cancelReset(){
    if(resetTimer){clearTimeout(resetTimer);resetTimer=null;}
    el.classList.remove('is-resetting');
   }
   function resetToFinal(){
    cancelReset();
    el.classList.add('is-resetting');
    el.classList.remove('is-active','is-dragging');
    setPos(0);
    resetTimer=setTimeout(()=>{
     el.classList.remove('is-resetting');
     resetTimer=null;
    },260);
   }
   function posFromEvent(e){
    const rect=stage.getBoundingClientRect();
    if(rect.width<=0)return 0;
    const clientX=e.clientX!=null?e.clientX:(e.touches&&e.touches[0]?e.touches[0].clientX:0);
    return ((clientX-rect.left)/rect.width)*100;
   }
   stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'){
     cancelReset();
     el.classList.add('is-active');
     setPos(posFromEvent(e));
    }else if(dragging){
     setPos(posFromEvent(e));
    }
   });
   stage.addEventListener('pointerleave',e=>{
    if(!dragging)resetToFinal();
   });
   stage.addEventListener('pointerdown',e=>{
    cancelReset();
    dragging=true;
    try{stage.setPointerCapture(e.pointerId);}catch{}
    el.classList.add('is-active','is-dragging');
    setPos(posFromEvent(e));
   });
   const stop=e=>{
    if(!dragging)return;
    dragging=false;
    try{stage.releasePointerCapture(e.pointerId);}catch{}
    el.classList.remove('is-dragging');
    if(e.pointerType!=='mouse'){
     resetToFinal();
    }else{
     const rect=stage.getBoundingClientRect();
     const inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
     if(!inside)resetToFinal();
    }
   };
   stage.addEventListener('pointerup',stop);
   stage.addEventListener('pointercancel',stop);
   handle.addEventListener('focus',()=>{
    cancelReset();
    el.classList.add('is-active');
    if(pos===0)setPos(50);
   });
   handle.addEventListener('blur',resetToFinal);
   handle.addEventListener('keydown',e=>{
    const step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'){e.preventDefault();cancelReset();setPos(pos-step);}
    else if(e.key==='ArrowRight'){e.preventDefault();cancelReset();setPos(pos+step);}
    else if(e.key==='Home'){e.preventDefault();cancelReset();setPos(0);}
    else if(e.key==='End'){e.preventDefault();cancelReset();setPos(100);}
    else if(e.key==='Escape'){e.preventDefault();resetToFinal();}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();cancelReset();setPos(pos===0?50:0);}
   });
   setPos(0);
  });
 }
 window.initComparers=initComparers;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
