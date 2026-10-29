(function(root){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const local=s=>typeof s==='string'&&/^(?:images\/uploads\/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(s)&&!s.includes('..');
 function imageURL(s){if(local(s))return true;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port;}catch{return false;}}
 function info(input){
  const raw=String(input||'').trim();let u,bvid='',page=1;
  if(/^BV[0-9A-Za-z]{10}$/.test(raw))bvid=raw;
  else{
   try{u=new URL(raw);}catch{throw new Error('请输入 B 站、YouTube 视频链接或 HTTPS MP4 / WebM 视频地址。');}
   if(u.protocol!=='https:'||u.username||u.password||u.port)throw new Error('请使用不含登录信息的 HTTPS 视频链接。');
   if(u.hostname==='b23.tv')throw new Error('请先打开 b23.tv 短链接，再复制包含 BV 号的完整地址。');
   if(['www.bilibili.com','bilibili.com','m.bilibili.com','player.bilibili.com'].includes(u.hostname)){
    bvid=u.hostname==='player.bilibili.com'&&u.pathname==='/player.html'?u.searchParams.get('bvid')||'':u.pathname.match(/^\/video\/(BV[0-9A-Za-z]{10})\/?$/)?.[1]||'';
    const p=u.searchParams.get('p');if(p!==null){if(!/^[1-9][0-9]{0,3}$/.test(p))throw new Error('视频分 P 序号不正确。');page=Number(p);}
    if(!/^BV[0-9A-Za-z]{10}$/.test(bvid))throw new Error('链接中没有有效的 BV 号。');
   }else if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com'].includes(u.hostname)){
    const id=u.hostname==='youtu.be'?u.pathname.slice(1).replace(/\/$/,''):u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})\/?$/)?.[1];
    if(!/^[\w-]{11}$/.test(id||''))throw new Error('请输入单个 YouTube 视频的完整链接。');
    return {provider:'youtube',id,url:'https://www.youtube.com/watch?v='+id,embed:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0',poster:'https://i.ytimg.com/vi/'+id+'/maxresdefault.jpg',posterFallback:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'};
   }else if(/\.(?:mp4|webm)$/i.test(u.pathname))return {provider:'file',url:u.href,embed:u.href,poster:'',posterFallback:''};
   else throw new Error('支持 B 站、YouTube 和 HTTPS MP4 / WebM 直链；普通网页不能直接作为视频播放。');
  }
  return {provider:'bilibili',bvid,page,url:'https://www.bilibili.com/video/'+bvid+'/?p='+page,embed:'https://player.bilibili.com/player.html?bvid='+bvid+'&p='+page+'&autoplay=1&danmaku=0&high_quality=1&as_wide=1&poster=1',poster:'',posterFallback:''};
 }
 async function fetchCover(input){
  const v=info(input);if(v.provider==='youtube')return {poster:v.poster,posterFor:v.url};if(v.provider!=='bilibili')return null;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{const response=await fetch('https://api.bilibili.com/x/web-interface/view?bvid='+v.bvid,{credentials:'omit',signal:controller.signal,referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Cover response '+response.status);const result=await response.json(),url=String(result.data?.pic||'').replace(/^http:/,'https:');let host;try{host=new URL(url).hostname;}catch{}if(result.code!==0||!imageURL(url)||!(host==='hdslb.com'||host?.endsWith('.hdslb.com')))throw new Error('Official cover unavailable');return {poster:url,posterFor:v.url,providerTitle:String(result.data.title||'')};}finally{clearTimeout(timer);}
 }
 function poster(item,fallback){const v=info(item.url);const value=item.posterOverride||(item.posterFor===v.url?item.poster:'')||v.poster||fallback;return imageURL(value)?value:fallback;}
 function asset(url,lang){return local(url)?(lang==='en'?'../':'./')+url:url;}
 function markup(items,lang,fallback){
  if(!items.length)return '';const zh=lang==='zh';return '<section id="project-videos" class="project-videos" aria-label="'+(zh?'项目视频':'Project videos')+'"><h2>'+(zh?'项目视频':'Project videos')+'</h2>'+items.map((item,i)=>{
   const v=info(item.url),playback=item.playbackUrl?info(item.playbackUrl):v,title=(zh?item.title:item.titleEn)||(zh?'项目视频 ':'Project video ')+(i+1);
   const cover=poster(item,fallback),help=zh?'播放选项':'Playback options';
   const note=zh?'若出现登录验证或无法播放，可打开视频来源。第三方播放器的推荐、画质及验证由平台控制。':'If sign-in is required or playback is unavailable, open the video source. Recommendations, quality and verification are controlled by the platform.';
   return '<article class="project-video"><div class="video-screen"><button type="button" class="video-play" data-video-url="'+esc(playback.url)+'" data-video-title="'+esc(title)+'"'+(zh&&typeof item.providerTitle==='string'&&item.providerTitle.trim()?' data-provider-title="'+esc(item.providerTitle.trim())+'"':'')+' aria-label="'+esc((zh?'播放视频：':'Play video: ')+title)+'"><img class="video-poster" src="'+esc(asset(cover,lang))+'" alt="" loading="lazy" referrerpolicy="no-referrer" data-poster-fallback="'+esc(v.posterFallback||asset(fallback,lang))+'" data-project-poster="'+esc(asset(fallback,lang))+'"><span class="video-shade" aria-hidden="true"></span><span class="video-play-icon" aria-hidden="true">▶</span></button></div><div class="video-toolbar" hidden><details class="video-options"><summary aria-label="'+help+'" title="'+help+'">⋯</summary><div class="video-options-panel"><p>'+note+'</p><a href="'+esc(v.url)+'" target="_blank" rel="noopener">'+(zh?'打开视频来源':'Open video source')+' ↗</a></div></details></div><p class="video-play-status" role="status" aria-live="polite"></p></article>';
  }).join('')+'</section>';
 }
 const api={info,imageURL,fetchCover,poster,markup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VideoCore=api;
})(typeof window!=='undefined'?window:globalThis);
