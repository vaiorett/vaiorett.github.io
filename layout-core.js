(function(root){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const modes=['auto','stack','grid','story'],sizes=['auto','full','half'];
 function size(item,mode='auto'){
  if(mode==='stack'||mode==='story')return 'full';
  if(item.layout==='full'||item.kind==='collage')return 'full';
  if(item.layout==='half')return 'half';
  if(mode==='grid')return 'half';
  if(!item.width||!item.height)return 'full';
  const ratio=item.width/item.height;return ratio>=1.65||ratio<.7?'full':'half';
 }
 function markup(project,lang,labels){
  const prefix=lang==='en'?'../':'./',mode=modes.includes(project.layout)?project.layout:'auto';
  return '<div class="auto-gallery layout-'+mode+'">'+project.images.map((item,i)=>{
   const rawCaption=lang==='en'?item.captionEn:item.caption;
   const caption=rawCaption||(item.kind==='collage'?labels.overview:'');
   const alt=(lang==='en'?item.altEn:item.alt)||labels.title;
   const body=(lang==='en'?item.bodyEn:item.body)||'';
   const dimensions=item.width&&item.height?' width="'+item.width+'" height="'+item.height+'"':'';
   const responsive=(variants,deferred=false)=>variants?.length?' '+(deferred?'data-srcset':'srcset')+'="'+esc(variants.map(v=>prefix+v.src+' '+v.width+'w').join(', '))+'" sizes="(max-width: 700px) calc(100vw - 32px), '+(size(item,mode)==='half'?'45vw':'90vw')+'"':'';
   const num=String(i+1).padStart(2,'0');
   const figText=caption?num+' / '+esc(caption):num;
   const copy='<div class="gallery-copy"><figcaption>'+figText+'</figcaption>'+(body.trim()?'<div class="gallery-text">'+body.trim().split(/\n\s*\n/).map(p=>'<p>'+esc(p)+'</p>').join('')+'</div>':'')+'</div>';
   if(item.compare){
    const beforeLabel=(lang==='en'?item.beforeLabelEn:item.beforeLabel)||(lang==='en'?'Before':'原图');
    const afterLabel=(lang==='en'?item.afterLabelEn:item.afterLabel)||(lang==='en'?'After':'效果');
    const hint=lang==='en'?'Move to compare':'滑动画面对比效果';
    const media='<div class="image-comparer" data-comparer style="--pos:0%"><div class="compare-stage"><img class="compare-img compare-after" src="'+prefix+esc(item.compareThumbnail||item.compare)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async"'+responsive(item.compareResponsive)+dimensions+'><div class="compare-overlay"><img class="compare-img compare-before" fetchpriority="low" data-src="'+prefix+esc(item.thumbnail||item.src)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async"'+responsive(item.responsive,true)+dimensions+'></div><span class="compare-badge compare-badge-before">'+esc(beforeLabel)+'</span><span class="compare-badge compare-badge-after">'+esc(afterLabel)+'</span><div class="compare-handle-line" role="slider" aria-label="'+esc(hint)+'" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" tabindex="0"></div></div></div>';
    return '<figure class="gallery-item layout-'+size(item,mode)+' is-comparer'+(body.trim()?' has-copy':'')+'">'+media+'<a class="compare-full" href="'+prefix+esc(item.compare)+'" target="_blank" rel="noopener">'+esc(lang==='en'?'View full-size effect ↗':'查看高清效果图 ↗')+'</a>'+copy+'</figure>';
   }
   return '<figure class="gallery-item layout-'+size(item,mode)+(item.kind==='collage'?' legacy':'')+(body.trim()?' has-copy':'')+'"><a class="gallery-button" href="'+prefix+esc(item.src)+'" aria-label="'+esc(labels.open)+': '+esc(caption||labels.title)+'"><img src="'+prefix+esc(item.thumbnail||item.src)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async"'+responsive(item.responsive)+dimensions+'></a>'+copy+'</figure>';
  }).join('')+'</div>';
 }
 const api={modes,sizes,size,markup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LayoutCore=api;
})(typeof window!=='undefined'?window:globalThis);
