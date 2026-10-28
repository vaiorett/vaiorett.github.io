import fs from 'node:fs';
const schema=JSON.parse(fs.readFileSync('src/data/schema.json','utf8'));
const read=name=>{const html=fs.readFileSync('.astro-templates/'+name+'.html','utf8').trim();return name.startsWith('card-')?html.replace(/^<!doctype html>\s*/i,''):html;};
const data={version:2,...schema,toolGroups:JSON.parse(fs.readFileSync('src/data/tool-groups.json','utf8')),pages:{'index.html':read('home-zh'),'en/index.html':read('home-en')},details:{zh:read('project-zh'),en:read('project-en')},cards:{zh:read('card-zh'),en:read('card-en')}};
fs.writeFileSync('content-templates.js','window.PORTFOLIO_TEMPLATES = '+JSON.stringify(data,null,2).replace(/</g,'\\u003c')+';\n');
