(function(){
 'use strict';
 const key='portfolio-theme-v1',root=document.documentElement,valid=value=>['system','light','dark'].includes(value);
 let preference='system';try{const saved=localStorage.getItem(key);if(valid(saved))preference=saved;}catch{}
 const media=window.matchMedia('(prefers-color-scheme: dark)');
 function apply(){const resolved=preference==='system'?(media.matches?'dark':'light'):preference;root.dataset.theme=resolved;root.dataset.themePreference=preference;root.style.colorScheme=resolved;if(root.classList)root.classList.toggle('dark',resolved==='dark');document.querySelectorAll('[data-theme-select]').forEach(select=>select.value=preference);}
 function choose(value){preference=valid(value)?value:'system';try{if(preference==='system')localStorage.removeItem(key);else localStorage.setItem(key,preference);}catch{}apply();}
 apply();
 if(media.addEventListener)media.addEventListener('change',()=>{if(preference==='system')apply();});else media.addListener(()=>{if(preference==='system')apply();});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=valid(event.newValue)?event.newValue:'system';apply();}});
 document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-theme-select]').forEach(select=>{select.value=preference;select.addEventListener('change',()=>choose(select.value));});});
})();
