(function(){
 'use strict';
 const key='portfolio-theme-v1',langKey='portfolio-lang-v1',root=document.documentElement,valid=value=>['system','light','dark'].includes(value);
 if(typeof navigator!=='undefined'&&typeof location!=='undefined'&&(root.lang==='zh-CN'||root.lang==='en')){
  const path=location.pathname||'';
  if(!/\/(manage|\u66f4\u65b0\u56fe\u7247\u8bf4\u660e|%E6%9B%B4%E6%96%B0%E5%9B%BE%E7%89%87%E8%AF%B4%E6%98%8E)\.html$/i.test(path)){
   const raw=((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase();
   const browserLang=raw.startsWith('zh')?'zh':(raw?'en':'');
   const pageLang=root.lang==='en'?'en':'zh';
   let target=browserLang;
   try{
    const param=new URLSearchParams(location.search||'').get('lang');
    if(param==='zh'||param==='en'){
     target=param;
     localStorage.setItem(langKey,JSON.stringify({lang:param,browser:browserLang}));
    }else{
     const saved=JSON.parse(localStorage.getItem(langKey)||'null');
     if(saved&&(saved.lang==='zh'||saved.lang==='en')&&saved.browser===browserLang)target=saved.lang;
    }
   }catch{}
   if((target==='zh'||target==='en')&&target!==pageLang){
    const next=target==='en'?(/\/[^/]+\.html$/.test(path)?path.replace(/\/([^/]+\.html)$/,'/en/$1'):(path.endsWith('/')?path+'en/':path+'/en/')):path.replace(/\/en\/([^/]+\.html)$/,'/$1').replace(/\/en\/?$/,'/');
    if(next&&next!==path&&typeof location.replace==='function')location.replace(next+(location.search||'')+(location.hash||''));
   }
   document.addEventListener('click',event=>{
    const link=event.target&&event.target.closest?event.target.closest('[data-language]'):null;
    const chosen=link&&link.getAttribute('data-language');
    if(chosen==='zh'||chosen==='en'){try{localStorage.setItem(langKey,JSON.stringify({lang:chosen,browser:browserLang}));}catch{}}
   },true);
  }
 }
 let preference='system';try{const saved=localStorage.getItem(key);if(valid(saved))preference=saved;}catch{}
 const media=window.matchMedia('(prefers-color-scheme: dark)');
 function apply(){const resolved=preference==='system'?(media.matches?'dark':'light'):preference;root.dataset.theme=resolved;root.dataset.themePreference=preference;root.style.colorScheme=resolved;if(root.classList)root.classList.toggle('dark',resolved==='dark');document.querySelectorAll('[data-theme-select]').forEach(select=>select.value=preference);}
 function choose(value){preference=valid(value)?value:'system';try{if(preference==='system')localStorage.removeItem(key);else localStorage.setItem(key,preference);}catch{}apply();}
 apply();
 if(media.addEventListener)media.addEventListener('change',()=>{if(preference==='system')apply();});else media.addListener(()=>{if(preference==='system')apply();});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=valid(event.newValue)?event.newValue:'system';apply();}});
 document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-theme-select]').forEach(select=>{select.value=preference;select.addEventListener('change',()=>choose(select.value));});});
})();
