(function(root){
 'use strict';
 const presets={balanced:{edge:3840,quality:.88},detail:{edge:Infinity,quality:.92},small:{edge:2560,quality:.82}};
 function dimensions(width,height,preset='balanced'){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>48000000||Math.max(width,height)>32767)throw new Error('图片尺寸过大，请先缩小到 4800 万像素以内，且单边不超过 32767 像素。');
  const option=presets[preset];if(!option)throw new Error('请选择有效的图片清晰度。');
  // Preserve long presentation boards rather than shrinking their text to fit a normal photo limit.
  const long=Math.max(width,height)/Math.min(width,height)>=3;
  const scale=long?1:Math.min(1,option.edge/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale)),quality:option.quality};
 }
 function validateFile(file){if(file.size>32*1024*1024)throw new Error('“'+file.name+'”超过 32 MB，请先缩小文件。');if(!/\.(jpe?g|png|webp|avif)$/i.test(file.name)||!/^image\/(jpeg|png|webp|avif)$/.test(file.type))throw new Error('请选择 JPG、PNG、WebP 或 AVIF 静态图片。');}
 function isWebP(bytes){return bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP';}
 function animated(bytes){
  const tag=(at,n=4)=>String.fromCharCode(...bytes.subarray(at,at+n));
  if(isWebP(bytes)){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let at=12;at+8<=bytes.length;){const size=view.getUint32(at+4,true);if(tag(at)==='ANIM')return true;at+=8+size+(size%2);}}
  if(bytes.length>=8&&tag(1,3)==='PNG'){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let at=8;at+8<=bytes.length;){const size=view.getUint32(at);if(tag(at+4)==='acTL')return true;at+=12+size;}}
  return tag(4)==='ftyp'&&tag(8)==='avis';
 }
 async function encode(image,width,height,quality){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  try{const context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法处理图片，请换用较新的浏览器。');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,width,height);
   const blob=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('图片转换超时，请缩小图片后再试。')),45000);canvas.toBlob(value=>{clearTimeout(timer);resolve(value);},'image/webp',quality);});
   if(!blob||blob.type!=='image/webp'||!isWebP(new Uint8Array(await blob.slice(0,12).arrayBuffer())))throw new Error('当前浏览器不支持 WebP 转换，请使用较新的 Chrome、Edge、Firefox 或 Safari。');return blob;
  }finally{canvas.width=1;canvas.height=1;}
 }
 async function convert(file,preset='balanced'){
  validateFile(file);const bytes=new Uint8Array(await file.arrayBuffer());if(animated(bytes))throw new Error('检测到动态图片，请使用静态封面或通过“项目视频”展示动画，避免只保留第一帧。');
  const url=URL.createObjectURL(file),image=new Image();try{
   image.src=url;try{await image.decode();}catch{throw new Error('无法读取“'+file.name+'”，请重新导出这张图片后再试。');}const size=dimensions(image.naturalWidth,image.naturalHeight,preset);
   let blob=isWebP(bytes)&&size.width===image.naturalWidth&&size.height===image.naturalHeight&&file.size<=8*1024*1024?file:await encode(image,size.width,size.height,size.quality);
   if(blob.size>8*1024*1024)blob=await encode(image,size.width,size.height,.76);
   if(blob.size>8*1024*1024)throw new Error('转换后仍超过 8 MB，请选择“更小文件”或先缩小长图。');
   const scale=Math.min(1,1600/Math.max(size.width,size.height));let thumbnail=null;
   if(scale<1&&Math.max(size.width,size.height)/Math.min(size.width,size.height)<3){const candidate=await encode(image,Math.round(size.width*scale),Math.round(size.height*scale),.82);if(candidate.size<blob.size)thumbnail=candidate;}
   const previewWidth=thumbnail?Math.round(size.width*scale):size.width;let mobile=null;const mobileWidth=800;
   if(previewWidth>mobileWidth&&Math.max(size.width,size.height)/Math.min(size.width,size.height)<3){const candidate=await encode(image,mobileWidth,Math.max(1,Math.round(size.height*mobileWidth/size.width)),.86);if(candidate.size<(thumbnail||blob).size)mobile=candidate;}
   return {blob,thumbnail,mobile,mobileWidth,previewWidth,width:size.width,height:size.height,originalBytes:file.size,bytes:blob.size,preset};
  }catch(error){if(error instanceof Error&&error.message)throw error;throw new Error('无法读取这张图片，请重新导出后再试。');}finally{URL.revokeObjectURL(url);image.src='';}
 }
 const api={presets,dimensions,validateFile,isWebP,animated,convert};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ImageProcess=api;
})(typeof window!=='undefined'?window:globalThis);
