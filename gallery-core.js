(function (root) {
  'use strict';
  const OWNER='vaiorett', REPO='vaiorett.github.io';
  const PREFIX='window.PORTFOLIO_GALLERIES = ';
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function safePath(path){return typeof path==='string' && /^(?:images\/uploads\/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(path) && !path.includes('..');}
  function validate(data){
    if(!data || data.version!==1 || !data.projects || typeof data.projects!=='object') throw new Error('作品数据格式不正确。');
    for(const [id,project] of Object.entries(data.projects)){
      if(!/^[a-z0-9-]+$/.test(id) || !project || !Array.isArray(project.images) || project.images.length===0 || typeof project.title!=='string') throw new Error('项目资料不完整。');
      if(!safePath(project.cover)) throw new Error('封面图片路径不正确。');
      const ids=new Set();
      for(const item of project.images){
        if(!item || typeof item.id!=='string' || ids.has(item.id) || !safePath(item.src) || typeof item.caption!=='string' || typeof item.alt!=='string') throw new Error('图片资料不完整。');
        ids.add(item.id);
      }
    }
    return data;
  }
  function serialize(data){validate(data);return PREFIX+JSON.stringify(data,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';}
  function parse(source){if(!source.startsWith(PREFIX))throw new Error('仓库中的作品数据格式不正确。');return validate(JSON.parse(source.slice(PREFIX.length).trim().replace(/;$/,'')));}
  function merge(base,local,remote){
    validate(remote);const merged=clone(remote);const conflicts=[];
    for(const [id,value] of Object.entries(local.projects)){
      if(JSON.stringify(value)===JSON.stringify(base.projects[id])) continue;
      if(!remote.projects[id] || JSON.stringify(remote.projects[id])!==JSON.stringify(base.projects[id])) conflicts.push(value.title);
      else merged.projects[id]=clone(value);
    }
    if(conflicts.length)throw new Error('这些项目已在线上被修改，请先导出草稿再核对：'+conflicts.join('、'));
    return merged;
  }
  function usedFiles(data,files){
    const paths=new Set();Object.values(data.projects).forEach(p=>{paths.add(p.cover);p.images.forEach(i=>paths.add(i.src));});
    return Array.from(files.entries()).filter(([path])=>paths.has(path));
  }
  function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
  async function publish(data,files,session,api,progress){
    validate(data);
    const path='/repos/'+OWNER+'/'+REPO;
    const refPath=path+'/git/ref/heads/'+encodeURIComponent(session.branch);
    const current=await api(refPath);
    if(current.object.sha!==session.base)throw new Error('仓库已有新修改。请重新连接 GitHub 后再发布，草稿会保留。');
    const parent=await api(path+'/git/commits/'+session.base);
    const tree=[];const uploads=usedFiles(data,files);let done=0;
    for(const [filePath,blob] of uploads){
      if(!safePath(filePath))throw new Error('图片路径不正确。');
      progress('正在上传图片 '+(++done)+' / '+uploads.length);
      const result=await api(path+'/git/blobs','POST',{content:base64(new Uint8Array(await blob.arrayBuffer())),encoding:'base64'});
      tree.push({path:filePath,mode:'100644',type:'blob',sha:result.sha});
    }
    progress('正在保存作品顺序与说明');
    const manifest=await api(path+'/git/blobs','POST',{content:serialize(data),encoding:'utf-8'});
    tree.push({path:'gallery-data.js',mode:'100644',type:'blob',sha:manifest.sha});
    const newTree=await api(path+'/git/trees','POST',{base_tree:parent.tree.sha,tree});
    const commit=await api(path+'/git/commits','POST',{message:'更新作品图片与画廊说明',tree:newTree.sha,parents:[session.base]});
    const latest=await api(refPath);
    if(latest.object.sha!==session.base)throw new Error('发布期间仓库出现了新修改。请重新连接后重试，草稿会保留。');
    const result=await api(path+'/git/refs/heads/'+encodeURIComponent(session.branch),'PATCH',{sha:commit.sha,force:false});
    if(result.object.sha!==commit.sha)throw new Error('未能确认提交结果，请到 GitHub 查看后重新连接。');
    return commit.sha;
  }
  const core={OWNER,REPO,clone,safePath,validate,serialize,parse,merge,usedFiles,base64,publish};
  if(typeof module!=='undefined' && module.exports)module.exports=core;else root.GalleryCore=core;
})(typeof window!=='undefined'?window:globalThis);
