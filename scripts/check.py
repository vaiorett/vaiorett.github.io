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
        main=re.sub(r'<div class="skill-tags">.*?</div>','',re.search(r'<main.*?</main>',path.read_text(),re.S).group(),flags=re.S)
        assert not re.search(r'[\u4e00-\u9fff]',main),path
    if path.name.startswith('work-'):
        id=path.stem[5:];locale='en' if english else 'zh'
        current=current_content['values']
        for key in ['title','role','context','note']:
            value=current.get(f'project.{id}.{locale}.{key}','')
            assert value in ''.join(page.text),(path,key)
    assert any(a.get('name')=='robots' and a.get('content')=='noindex' for a in page.attrs('meta')),path
# Original top-level WebP artwork remains byte-for-byte unchanged.
original=subprocess.check_output(['git','ls-tree','--name-only','HEAD'],cwd=ROOT,text=True).splitlines()
for file in original:
    if file.endswith('.webp'):
        assert subprocess.check_output(['git','show','HEAD:'+file],cwd=ROOT)==(ROOT/file).read_bytes(),file
urls=ET.parse(ROOT/'sitemap.xml').findall('{*}url/{*}loc');assert len(urls)==0
for path in ['manage.html','更新图片说明.html']:
    assert '<meta name="robots" content="noindex">' in (ROOT/path).read_text()
assert not list(ROOT.glob('*.pdf')), 'Private attachments must not be published'
assert 'Disallow: /' not in (ROOT/'robots.txt').read_text()
assert current_content['values']['ui.zh.name']=='Vaiorett'
assert current_content['values']['ui.en.name']=='Vaiorett'
assert 'site.phone' not in current_content['values']
ui_source=(ROOT/'ui.js').read_text()
for icon in re.findall(r":'([a-z0-9]+)'",re.search(r'const logos=\{([^}]+)\}',ui_source).group(1)):
    assert (ROOT/'assets/icons'/f'{icon}.svg').is_file(),icon
for font in re.findall(r'assets/fonts/[a-z0-9-]+\.woff2',(ROOT/'portfolio.css').read_text()):
    assert (ROOT/font).is_file(),font
print(f'PASS: {len(paths)} static pages, {checks} local asset/link references, bilingual metadata, noindex, no public PDF/phone, current project content and original WebP files.')
