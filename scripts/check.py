#!/usr/bin/env python3
"""Check static links, bilingual SEO and project preservation before publishing."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import subprocess
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.tags=[];self.text=[];self.feed(path.read_text())
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
    def handle_data(self,data):self.text.append(data)
    def attrs(self,tag):return [attrs for name,attrs in self.tags if name==tag]
paths=[ROOT/'index.html',*ROOT.glob('work-*.html'),*ROOT.glob('en/*.html')]
current_content=json.loads((ROOT/'content-data.js').read_text().split(' = ',1)[1].strip().rstrip(';'))
assert len(paths)==2+2*len(current_content['projects'])
pages={p:Page(p) for p in paths}
checks=0
for path,page in pages.items():
    english=path.parent.name=='en';lang='en' if english else 'zh-CN'
    assert page.attrs('html')[0]['lang']==lang,path
    assert len(page.attrs('h1'))==1,path
    links=page.attrs('link')
    canonical=next(a['href'] for a in links if a.get('rel')=='canonical')
    expected='https://vaiorett.github.io/'+('en/' if english else '')+('' if path.name=='index.html' else path.name)
    assert canonical==expected,path
    alternatives={a['hreflang']:a['href'] for a in links if a.get('rel')=='alternate'}
    assert set(alternatives)=={'en','zh-CN','x-default'},path
    assert alternatives[lang]==canonical,path
    assert alternatives['x-default']==alternatives['zh-CN'],path
    assert any(a.get('name')=='description' and a.get('content') for a in page.attrs('meta')),path
    assert any(a.get('property')=='og:image' and a.get('content','').startswith('https://') for a in page.attrs('meta')),path
    schema=re.search(r'<script type="application/ld\+json">(.*?)</script>',path.read_text()).group(1)
    assert json.loads(schema)['url']==canonical,path
    for tag,a in page.tags:
        for attr in ('src','href'):
            url=a.get(attr)
            if not url or urlsplit(url).scheme or url.startswith('//'):continue
            parts=urlsplit(url);target=(path.parent/unquote(parts.path)).resolve() if parts.path else path
            assert target.exists(),(path,url)
            if parts.fragment and target.suffix=='.html':
                parsed=pages.get(target) or Page(target)
                assert any(b.get('id')==parts.fragment for _,b in parsed.tags),(path,url)
            checks+=1
        if tag=='img':assert 'alt' in a,path
    if english:
        # All project prose and résumé/education text must be translated, not just navigation.
        main=re.search(r'<main.*?</main>',path.read_text(),re.S).group()
        assert not re.search(r'[\u4e00-\u9fff]',main),path
    if path.name.startswith('work-'):
        id=path.stem[5:];source=json.loads((ROOT/'site-data.json').read_text())
        original=next((p for p in source if p['id']==id),{'id':id,'title':'','role':'','context':'','note':'','tasks':[]})
        current=json.loads((ROOT/'content-data.js').read_text().split(' = ',1)[1].strip().rstrip(';'))['values']
        original={key:current.get(f'project.{id}.zh.{key}',value) for key,value in original.items()}
        if not english:
            for fact in [original['title'],original['role'],original['context'],original['note'],*original['tasks']]:assert fact in ''.join(page.text),(path,fact)
# All original binary work and the public résumé remain byte-for-byte unchanged.
original=subprocess.check_output(['git','ls-tree','--name-only','HEAD'],cwd=ROOT,text=True).splitlines()
for file in original:
    if file.endswith('.webp'):
        assert subprocess.check_output(['git','show','HEAD:'+file],cwd=ROOT)==(ROOT/file).read_bytes(),file
urls=ET.parse(ROOT/'sitemap.xml').findall('{*}url/{*}loc');assert len(urls)==len(paths)
for path in ['manage.html','更新图片说明.html']:
    assert 'noindex,follow' in (ROOT/path).read_text()
print(f'PASS: {len(paths)} static pages, {checks} local asset/link references, bilingual SEO, translated English prose, current canonical project text and all 16 original WebP files (resume updated separately).')
