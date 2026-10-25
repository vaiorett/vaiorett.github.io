"""Static counterpart of content-core.js; parity checked by tests/content-core.test.cjs."""
import json, re
from urllib.parse import urlsplit, parse_qs
from html import escape
from video_core import markup as video_markup

def serialize(name,value):
    return 'window.'+name+' = '+json.dumps(value,ensure_ascii=False,indent=2).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')+';\n'

def esc(value): return escape(str(value),quote=True).replace('&#x27;','&#39;')
def render(content,templates,galleries):
    values=content['values'];fields=dict(templates['fields']);meta=content.get('projects',templates['projects']);order=list(meta)
    for id in order:
        for lang in ['zh','en']:
            for key in ['title','desc','role','context','note','tools','tasks']:fields[f'project.{id}.{lang}.{key}']={'type':key if key in ['tools','tasks'] else 'text'}
    def cover(id):
        p=galleries['projects'][id];item=next((i for i in p['images'] if i['src']==p['cover']),{});return item.get('thumbnail') or p['cover']
    def text(key):
        value=values[key];kind=fields[key]['type']
        if kind in ['tags','tasks','paragraphs']:
            tag={'tags':'span','tasks':'li','paragraphs':'p'}[kind]
            return ''.join(f'<{tag}>{esc(item)}</{tag}>' for item in value)
        if kind=='tools':return esc(' / '.join(value))
        if kind=='multiline':return esc(value).replace('\n','<br>')
        return esc(value)
    def gallery(id,lang):
        root='../' if lang=='en' else './';p=galleries['projects'][id];result=''
        for i,item in enumerate(p['images']):
            caption=(item.get('captionEn') if lang=='en' else item['caption']) or values['ui.'+lang+'.overview']
            alt=(item.get('altEn') if lang=='en' else item['alt']) or values[f'project.{id}.{lang}.title']
            dimensions=f' width="{item["width"]}" height="{item["height"]}"' if item.get('width') and item.get('height') else ''
            result+=f'<figure class="gallery-item {"legacy" if item.get("kind")=="collage" else ""}"><a class="gallery-button" href="{root}{esc(item["src"])}" aria-label="{esc(values["ui."+lang+".open"])}: {esc(caption)}"><img src="{root}{esc(item.get("thumbnail") or item["src"])}" alt="{esc(alt)}" loading="lazy"{dimensions}></a><figcaption>{i+1:02d} / {esc(caption)}</figcaption></figure>'
        return result
    def videos(id,lang):return video_markup(galleries['projects'][id].get('videos',[]),lang,cover(id))
    def resolve(html):return re.sub(r'@@([\w.-]+)@@',replace,html)
    def replace(m):
        key=m[1]
        if key in fields:return text(key)
        if key=='galleryVersion':return re.sub('[^a-zA-Z0-9]','',str(galleries.get('updatedAt') or '1'))
        if key.startswith('cards.'):
            lang=key.split('.')[1];return ''.join(resolve(templates['cards'][lang].replace('__project__',id)) for id in order)
        if key.startswith('total.'):
            group=key.split('.')[1];return str(sum(group=='all' or meta[id]['category']==group for id in order)).zfill(2)
        if key.startswith('group.'):return esc(meta[key[6:]]['category'])
        if key.startswith('number.'):return str(order.index(key[7:])+1).zfill(2)
        if key.startswith('category.'):
            _,id,lang=key.split('.');return esc(values['ui.'+lang+'.'+meta[id]['category']])
        if key.startswith('videos.'):
            _,id,lang=key.split('.');return videos(id,lang)
        if key.startswith('source.'):
            _,id,lang=key.split('.');return '<a href="'+esc(meta[id]['source'])+'" target="_blank" rel="noopener">'+esc(values['ui.'+lang+'.source'])+' ↗</a>' if meta[id].get('source') else ''
        if key.startswith('next.'):
            _,id,lang=key.split('.');n=order[(order.index(id)+1)%len(order)];return '<a class="next-project" href="./work-'+n+'.html"><span>'+esc(values['ui.'+lang+'.next'])+'</span><strong>'+esc(values['project.'+n+'.'+lang+'.title'])+' ↗</strong></a>'
        if key.startswith('cover.'):return esc(cover(key[6:]))
        if key.startswith('count.'):return str(len(galleries['projects'][key[6:]]['images']))
        if key.startswith('gallery.'):
            _,id,lang=key.split('.');return gallery(id,lang)
        raise ValueError('Unknown field '+key)
    def schema(m):
        def sub(t):
            key=t[1]
            value=values[key] if key in fields else cover(key[6:])
            return json.dumps(value,ensure_ascii=False)[1:-1].replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
        return re.sub(r'@@([\w.-]+)@@',sub,m[0])
    result={};pages=dict(templates['pages'])
    for id in order:
        for lang in ['zh','en']:pages[('en/' if lang=='en' else '')+'work-'+id+'.html']=templates['details'][lang].replace('__project__',id)
    for path,html in pages.items():
        # Replace each original token exactly once, including tokens inside JSON-LD.
        chunks=re.split(r'(<script type="application/ld\+json">.*?</script>)',html,flags=re.S)
        result[path]=''.join(schema(re.match(r'.*',part,re.S)) if part.startswith('<script type="application/ld+json">') else re.sub(r'@@([\w.-]+)@@',replace,part) for part in chunks)
    result['sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>https://vaiorett.github.io/'+re.sub(r'index\.html$','',path)+'</loc></url>\n' for path in pages)+'</urlset>\n'
    return result
