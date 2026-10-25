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
   const caption=(lang==='en'?item.captionEn:item.caption)||labels.overview,alt=(lang==='en'?item.altEn:item.alt)||labels.title;
   const body=(lang==='en'?item.bodyEn:item.body)||'';
   const dimensions=item.width&&item.height?' width="'+item.width+'" height="'+item.height+'"':'';
   const copy='<div class="gallery-copy"><figcaption>'+String(i+1).padStart(2,'0')+' / '+esc(caption)+'</figcaption>'+(body.trim()?'<div class="gallery-text">'+body.trim().split(/\n\s*\n/).map(p=>'<p>'+esc(p)+'</p>').join('')+'</div>':'')+'</div>';
   return '<figure class="gallery-item layout-'+size(item,mode)+(item.kind==='collage'?' legacy':'')+(body.trim()?' has-copy':'')+'"><a class="gallery-button" href="'+prefix+esc(item.src)+'" aria-label="'+esc(labels.open)+': '+esc(caption)+'"><img src="'+prefix+esc(item.thumbnail||item.src)+'" alt="'+esc(alt)+'" loading="lazy"'+dimensions+'></a>'+copy+'</figure>';
  }).join('')+'</div>';
 }
 const api={modes,sizes,size,markup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LayoutCore=api;
})(typeof window!=='undefined'?window:globalThis);
