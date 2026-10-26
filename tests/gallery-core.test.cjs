const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../gallery-core.js');
const sample = () => ({version:1,projects:{test:{title:'Test',cover:'test.webp',images:[{id:'one',src:'test.webp',caption:'One',alt:'Image'}]}}});
test('distinguishes missing token permissions from an ambiguous 403',()=>{
  assert.match(C.httpError(403,'Resource not accessible by personal access token').message,/Contents.*Read and write/);
  assert.match(C.httpError(403,'Forbidden').message,/不能确定/);
});
test('primary and secondary rate limits do not masquerade as permission failures',()=>{
  for(const args of [[403,'',{remaining:'0'}],[403,'You have exceeded a secondary rate limit'],[429,'Too many requests']])assert.match(C.httpError(...args).message,/请求频率/);
  assert.match(C.httpError(403,'',{retryAfter:'90'}).message,/90 秒/);
});
test('expired tokens and server errors have distinct guidance',()=>{
  assert.match(C.httpError(401).message,/过期/);
  assert.match(C.httpError(503).message,/服务暂时/);
});
test('uploads get a longer timeout without extending ordinary reads',()=>{
  assert.equal(C.requestTimeout('/repos/o/r/git/blobs','POST'),180000);
  assert.equal(C.requestTimeout('/repos/o/r/git/blobs','GET'),30000);
  assert.equal(C.requestTimeout('/repos/o/r/git/commits','POST'),30000);
});
test('timeout and blocked/network requests remain distinguishable',()=>{
  const abort=new Error();abort.name='AbortError';
  assert.match(C.networkError(abort,180000).message,/180 秒/);
  assert.match(C.networkError(new TypeError('Failed to fetch'),30000).message,/网络连接/);
  const permission=C.httpError(403,'Forbidden');assert.equal(C.networkError(permission,30000),permission);
});
test('a recovered draft already published elsewhere merges without conflict',()=>{
  const base=sample(),local=C.clone(base);local.projects.test.images[0].caption='Edited';
  assert.deepEqual(C.merge(base,local,C.clone(local)),local);
});
test('genuinely conflicting remote edits still stop the merge',()=>{
  const base=sample(),local=C.clone(base),remote=C.clone(base);
  local.projects.test.images[0].caption='Local';remote.projects.test.images[0].caption='Remote';
  assert.throws(()=>C.merge(base,local,remote),/线上被修改/);
});
test('gallery projects can be custom reordered and merged preserving local order',()=>{
  const base={version:1,projects:{
    a:{title:'A',cover:'a.webp',images:[{id:'1',src:'a.webp',caption:'A',alt:'A'}]},
    b:{title:'B',cover:'b.webp',images:[{id:'2',src:'b.webp',caption:'B',alt:'B'}]}
  }};
  const local=C.clone(base);
  C.reorderProjects(local,['b','a']);
  assert.deepEqual(Object.keys(local.projects),['b','a']);
  const remote=C.clone(base);
  const merged=C.merge(base,local,remote);
  assert.deepEqual(Object.keys(merged.projects),['b','a']);
});
test('publish uploads only referenced files and preserves the base tree',async()=>{
  const data=sample();data.projects.test.cover='images/uploads/new.png';data.projects.test.images.push({id:'two',src:'images/uploads/new.png',caption:'New',alt:'New'});
  const calls=[],progress=[];
  const api=async(path,method='GET',body)=>{
    calls.push({path,method,body});
    if(method==='GET'&&path.includes('/git/ref/'))return {object:{sha:'base'}};
    if(path.endsWith('/git/commits/base'))return {tree:{sha:'tree-base'}};
    if(path.endsWith('/git/blobs'))return {sha:'blob-'+calls.length};
    if(path.endsWith('/git/trees'))return {sha:'tree-new'};
    if(path.endsWith('/git/commits'))return {sha:'commit-new'};
    if(method==='PATCH')return {object:{sha:'commit-new'}};
    throw Error('Unexpected request');
  };
  const result=await C.publish(data,new Map([['images/uploads/new.png',new Blob(['image'])],['images/uploads/unused.png',new Blob(['unused'])]]),{branch:'main',base:'base'},api,p=>progress.push(p));
  assert.equal(result,'commit-new');assert.equal(calls.filter(c=>c.path.endsWith('/git/blobs')).length,2);
  const tree=calls.find(c=>c.path.endsWith('/git/trees')).body;assert.equal(tree.base_tree,'tree-base');assert.deepEqual(tree.tree.map(x=>x.path),['images/uploads/new.png','gallery-data.js']);
  assert.equal(calls.at(-1).body.force,false);assert.match(progress[0],/1 \/ 1.*MB/);
});
test('a changed remote branch stops publishing before any write',async()=>{
  let calls=0;
  await assert.rejects(C.publish(sample(),new Map(),{branch:'main',base:'old'},async()=>{calls++;return {object:{sha:'new'}};},()=>{}),/仓库已有新修改/);
  assert.equal(calls,1);
});
