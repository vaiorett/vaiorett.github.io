// Loaded only while adding images in the manager, never by public pages.
import createEncoder from './assets/vendor/webp/webp_enc.js';
import {defaultOptions} from './assets/vendor/webp/meta.js';
let encoder;
self.onmessage=async ({data})=>{
 try{
  encoder ||= createEncoder();
  const module=await encoder;
  const output=module.encode(new Uint8ClampedArray(data.pixels),data.width,data.height,{...defaultOptions,lossless:1,exact:1,near_lossless:100,quality:60,method:3});
  if(!output)throw new Error('无法生成无损预览。');
  const bytes=output.slice().buffer;
  self.postMessage({bytes},[bytes]);
 }catch(error){self.postMessage({error:error.message||'无法生成无损预览。'});}
};
