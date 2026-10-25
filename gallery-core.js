(function (root) {
  'use strict';
  const V=typeof module!=='undefined'&&module.exports?require('./video-core.js'):root.VideoCore;
  const OWNER='vaiorett', REPO='vaiorett.github.io';
  const PREFIX='window.PORTFOLIO_GALLERIES = ';
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function safePath(path){return typeof path==='string' && /^(?:images\/uploads\/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(path) && !path.includes('..');}
  const videoInfo=V.info;
  function validate(data){
    if(!data || data.version!==1 || !data.projects || typeof data.projects!=='object') throw new Error('作品数据格式不正确。');
    for(const [id,project] of Object.entries(data.projects)){
      if(!/^[a-z0-9-]+$/.test(id) || !project || !Array.isArray(project.images) || typeof project.title!=='string') throw new Error('项目资料不完整。');
      if(!safePath(project.cover)) throw new Error('封面图片路径不正确。');
      if(project.videos!==undefined){
        if(!Array.isArray(project.videos)||project.videos.length>30)throw new Error('每个项目最多添加 30 个视频。');
        const videoIds=new Set();
        for(const video of project.videos){
          if(!video||typeof video.id!=='string'||videoIds.has(video.id)||typeof video.title!=='string'||typeof video.titleEn!=='string'||video.title.length>300||video.titleEn.length>300)throw new Error('视频资料不完整。');
          videoInfo(video.url);for(const key of ['poster','posterOverride'])if(video[key]&&!V.imageURL(video[key]))throw new Error('视频封面地址不正确。');videoIds.add(video.id);
        }
      }
      const ids=new Set();
      for(const item of project.images){
        if(!item || typeof item.id!=='string' || ids.has(item.id) || !safePath(item.src) || typeof item.caption!=='string' || typeof item.alt!=='string') throw new Error('图片资料不完整。');
        if(item.thumbnail!==undefined&&!safePath(item.thumbnail))throw new Error('封面小图路径不正确。');
        if((item.width!==undefined||item.height!==undefined)&&(!Number.isInteger(item.width)||!Number.isInteger(item.height)||item.width<1||item.height<1))throw new Error('图片尺寸资料不正确。');
        ids.add(item.id);
      }
    }
    return data;
  }
  function serialize(data){validate(data);return PREFIX+JSON.stringify(data,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';}
  function parse(source){if(!source.startsWith(PREFIX))throw new Error('仓库中的作品数据格式不正确。');return validate(JSON.parse(source.slice(PREFIX.length).trim().replace(/;$/,'')));}
  const posterKeys=['poster','posterFor','posterUpdatedAt','providerTitle'];
  function withoutPosters(project){if(!project)return project;const p=clone(project);for(const video of p.videos||[])for(const key of posterKeys)delete video[key];return p;}
  function mergePosterUpdate(local,remote){const result=clone(local);for(const video of result.videos||[]){const latest=(remote.videos||[]).find(v=>v.id===video.id&&videoInfo(v.url).url===videoInfo(video.url).url);if(latest&&(!video.posterRefresh||video.posterRefresh<=(latest.posterUpdatedAt||'')))for(const key of posterKeys){if(latest[key]!==undefined)video[key]=latest[key];else delete video[key];}}return result;}
  function merge(base,local,remote){
    validate(remote);const merged=clone(remote);const conflicts=[];
    for(const [id,value] of Object.entries(local.projects)){
      if(JSON.stringify(value)===JSON.stringify(base.projects[id]) || JSON.stringify(value)===JSON.stringify(remote.projects[id])) continue;
      if(JSON.stringify(remote.projects[id])!==JSON.stringify(base.projects[id])){if(remote.projects[id]&&JSON.stringify(withoutPosters(remote.projects[id]))===JSON.stringify(withoutPosters(base.projects[id])))merged.projects[id]=mergePosterUpdate(value,remote.projects[id]);else conflicts.push(value.title);}
      else merged.projects[id]=clone(value);
    }
    if(conflicts.length)throw new Error('这些项目已在线上被修改，请先导出草稿再核对：'+conflicts.join('、'));
    return merged;
  }
  function coverPath(project){const item=project.images.find(i=>i.src===project.cover);return item?.thumbnail||project.cover;}
  function usedFiles(data,files){
    const paths=new Set();Object.values(data.projects).forEach(p=>{paths.add(p.cover);p.images.forEach(i=>{paths.add(i.src);if(i.thumbnail)paths.add(i.thumbnail);});(p.videos||[]).forEach(v=>{if(safePath(v.posterOverride))paths.add(v.posterOverride);if(safePath(v.poster))paths.add(v.poster);});});
    return Array.from(files.entries()).filter(([path])=>paths.has(path));
  }
  function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
  async function publish(data,files,session,api,progress,textFiles={}){
    validate(data);
    const path='/repos/'+OWNER+'/'+REPO;
    const refPath=path+'/git/ref/heads/'+encodeURIComponent(session.branch);
    const current=await api(refPath);
    if(current.object.sha!==session.base)throw new Error('仓库已有新修改。请重新连接 GitHub 后再发布，草稿会保留。');
    const parent=await api(path+'/git/commits/'+session.base);
    const tree=[];const uploads=usedFiles(data,files);let done=0;
    for(const [filePath,blob] of uploads){
      if(!safePath(filePath))throw new Error('图片路径不正确。');
      progress('正在上传图片 '+(++done)+' / '+uploads.length+'（'+(blob.size/1024/1024).toFixed(1)+' MB）');
      const result=await api(path+'/git/blobs','POST',{content:base64(new Uint8Array(await blob.arrayBuffer())),encoding:'base64'});
      tree.push({path:filePath,mode:'100644',type:'blob',sha:result.sha});
    }
    progress('正在保存作品顺序与说明');
    const manifest=await api(path+'/git/blobs','POST',{content:serialize(data),encoding:'utf-8'});
    tree.push({path:'gallery-data.js',mode:'100644',type:'blob',sha:manifest.sha});
    for(const [filePath,content] of Object.entries(textFiles)){
      if(!(filePath==='content-data.js'||filePath==='sitemap.xml'||/^(?:en\/)?(?:index|work-[a-z0-9-]+)\.html$/.test(filePath)) || typeof content!=='string')throw new Error('文字发布文件不正确。');
      tree.push({path:filePath,mode:'100644',type:'blob',content});
    }
    progress('正在保存中英文网页、图片与文字');
    const newTree=await api(path+'/git/trees','POST',{base_tree:parent.tree.sha,tree});
    const commit=await api(path+'/git/commits','POST',{message:'更新作品集图片与中英文文字',tree:newTree.sha,parents:[session.base]});
    const latest=await api(refPath);
    if(latest.object.sha!==session.base)throw new Error('发布期间仓库出现了新修改。请重新连接后重试，草稿会保留。');
    progress('正在提交发布结果');
    const result=await api(path+'/git/refs/heads/'+encodeURIComponent(session.branch),'PATCH',{sha:commit.sha,force:false});
    if(result.object.sha!==commit.sha)throw new Error('未能确认提交结果，请到 GitHub 查看后重新连接。');
    return commit.sha;
  }
  function httpError(status,message='',headers={}){
    let text;
    if(status===401) text='授权令牌无效或已过期，请重新连接。';
    else if(status===429 || (status===403 && (headers.remaining==='0' || headers.retryAfter || /rate limit|abuse detection/i.test(message)))){
      const seconds=Number(headers.retryAfter);
      text='GitHub 暂时限制了请求频率（'+status+'）。'+(Number.isFinite(seconds)&&seconds>0?'请至少等待 '+Math.ceil(seconds)+' 秒后再试。':'请稍后再试，不要连续点击发布。')+'这不一定是令牌权限问题。';
    }else if(status===403 && /resource not accessible/i.test(message)){
      text='当前令牌没有完成此操作所需的权限（403）。请检查该令牌是否选中 vaiorett.github.io，且 Repository permissions → Contents 为 Read and write；账号能访问仓库不代表令牌有写入权限。';
    }else if(status===403) text='GitHub 拒绝了此操作（403）。请核对令牌的仓库范围、Contents 读写权限及 GitHub 的访问限制；仅凭 403 还不能确定具体原因。';
    else if(status===404) text='无法访问作品仓库或文件（404）。请确认令牌已选中 vaiorett.github.io。';
    else if(status===409) text='仓库状态有变化（409）。请重新连接后再发布，先导出当前修改作为备份。';
    else if(status===422) text='GitHub 未接受此次数据或分支更新（422）。请先查看仓库提交记录，再重新连接核对。';
    else if(status>=500) text='GitHub 服务暂时无法完成请求（'+status+'）。请稍后重试；若发生在最后提交阶段，请先查看仓库记录。';
    else text='GitHub 请求未完成（HTTP '+status+'），请先导出备份后再检查。';
    const error=new Error(text);error.status=status;return error;
  }
  function requestTimeout(path,method){return method==='POST' && path.endsWith('/git/blobs')?180000:30000;}
  function networkError(error,timeout){
    if(error.name==='AbortError')return new Error('此次请求超过 '+Math.round(timeout/1000)+' 秒未完成。大图上传或网络较慢时可能超时；本页仍保留修改，请先导出备份。若已到最后提交阶段，请先查看仓库记录。');
    if(error instanceof TypeError)return new Error('浏览器未能完成与 GitHub 的网络连接。请检查网络或浏览器限制；本页仍保留修改，请先导出备份。若已到最后提交阶段，请先查看仓库记录。');
    return error;
  }
  const core={OWNER,REPO,clone,safePath,videoInfo,videoMarkup:V.markup,validate,serialize,parse,merge,coverPath,usedFiles,base64,publish,httpError,requestTimeout,networkError};
  if(typeof module!=='undefined' && module.exports)module.exports=core;else root.GalleryCore=core;
})(typeof window!=='undefined'?window:globalThis);
