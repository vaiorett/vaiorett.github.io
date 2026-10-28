(function(root){
 'use strict';
 function dimensions(width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>48000000||Math.max(width,height)>32767)throw new Error('图片尺寸过大，请先缩小到 4800 万像素以内，且单边不超过 32767 像素。');
  return {width,height};
 }
 function validateFile(file){if(file.size>32*1024*1024)throw new Error('“'+file.name+'”超过 32 MB，请先缩小文件。');if(!/\.(jpe?g|png|webp|avif)$/i.test(file.name)||!/^image\/(jpeg|png|webp|avif)$/.test(file.type))throw new Error('请选择 JPG、PNG、WebP 或 AVIF 静态图片。');}
 function isWebP(bytes){return bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP';}
 function animated(bytes){
  const tag=(at,n=4)=>String.fromCharCode(...bytes.subarray(at,at+n));
  if(isWebP(bytes)){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let at=12;at+8<=bytes.length;){const size=view.getUint32(at+4,true);if(tag(at)==='ANIM')return true;at+=8+size+(size%2);}}
  if(bytes.length>=8&&tag(1,3)==='PNG'){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let at=8;at+8<=bytes.length;){const size=view.getUint32(at);if(tag(at+4)==='acTL')return true;at+=12+size;}}
  return tag(4)==='ftyp'&&tag(8)==='avis';
 }
 // Browser canvas WebP defaults to lossy. Use a local lossless encoder for previews.
 const workerURL=typeof document!=='undefined'?new URL('./lossless-worker.js',document.currentScript?.src||location.href):null;
 async function encode(worker,image,width,height){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  try{
   const context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法生成图片预览。');
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,width,height);
   const pixels=context.getImageData(0,0,width,height).data.buffer;
   return await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{worker.terminate();reject(new Error('预览生成超时，请减少本次上传数量后再试。'));},45000);
    worker.onmessage=({data})=>{clearTimeout(timer);if(data.error)reject(new Error(data.error));else resolve(new Blob([data.bytes],{type:'image/webp'}));};
    worker.onerror=()=>{clearTimeout(timer);reject(new Error('无损预览组件加载失败，请刷新后重试。'));};
    worker.postMessage({pixels,width,height},[pixels]);
   });
  }finally{canvas.width=1;canvas.height=1;}
 }
 async function convert(file,preset='balanced'){
  validateFile(file);const bytes=new Uint8Array(await file.arrayBuffer());if(animated(bytes))throw new Error('请选择静态图片，动画可通过项目视频展示。');
  const url=URL.createObjectURL(file),image=new Image();let worker;
  try{
   image.src=url;try{await image.decode();}catch{throw new Error('无法读取“'+file.name+'”，请重新导出后再试。');}
   const width=image.naturalWidth,height=image.naturalHeight;dimensions(width,height);
   const extension={ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[file.type];
   const variants=[];
   worker=new Worker(workerURL,{type:'module'});
   const targets=[480,800,1200,1600].filter(w=>w<width);
   if(file.type==='image/avif'&&width<=480)targets.push(width);
   for(const w of targets){
    const blob=await encode(worker,image,w,Math.max(1,Math.round(height*w/width)));
    if(blob.size<file.size||file.type==='image/avif')variants.push({blob,width:w});
   }
   return {blob:file,extension,variants,width,height,originalBytes:file.size,bytes:file.size,preset};
  }finally{worker?.terminate();URL.revokeObjectURL(url);image.src='';}
 }
 const api={dimensions,validateFile,isWebP,animated,convert};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ImageProcess=api;
})(typeof window!=='undefined'?window:globalThis);
