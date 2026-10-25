import fs from 'node:fs';
const schema=JSON.parse(fs.readFileSync('src/data/schema.json','utf8'));
const read=name=>fs.readFileSync('.astro-templates/'+name+'.html','utf8').trim();
const data={version:2,...schema,pages:{'index.html':read('home-zh'),'en/index.html':read('home-en')},details:{zh:read('project-zh'),en:read('project-en')},cards:{zh:read('card-zh'),en:read('card-en')}};
fs.writeFileSync('content-templates.js','window.PORTFOLIO_TEMPLATES = '+JSON.stringify(data,null,2).replace(/</g,'\\u003c')+';\n');
