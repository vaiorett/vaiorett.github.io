"""Static counterpart of content-core.js; parity checked by tests/content-core.test.cjs."""
import json, re
from html import escape

def serialize(name,value):
    return 'window.'+name+' = '+json.dumps(value,ensure_ascii=False,indent=2).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')+';\n'

def esc(value): return escape(str(value),quote=True).replace('&#x27;','&#39;')
def render(content,templates,galleries):
    values=content['values'];fields=templates['fields']
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
            result+=f'<figure class="gallery-item {"legacy" if item.get("kind")=="collage" else ""}"><a class="gallery-button" href="{root}{esc(item["src"])}" aria-label="{esc(values["ui."+lang+".open"])}: {esc(caption)}"><img src="{root}{esc(item["src"])}" alt="{esc(alt)}" loading="lazy"></a><figcaption>{i+1:02d} / {esc(caption)}</figcaption></figure>'
        return result
    def replace(m):
        key=m[1]
        if key in fields:return text(key)
        if key=='galleryVersion':return re.sub('[^a-zA-Z0-9]','',str(galleries.get('updatedAt') or '1'))
        if key.startswith('cover.'):return esc(galleries['projects'][key[6:]]['cover'])
        if key.startswith('count.'):return str(len(galleries['projects'][key[6:]]['images']))
        if key.startswith('gallery.'):
            _,id,lang=key.split('.');return gallery(id,lang)
        raise ValueError('Unknown field '+key)
    def schema(m):
        def sub(t):
            key=t[1]
            value=values[key] if key in fields else galleries['projects'][key[6:]]['cover']
            return json.dumps(value,ensure_ascii=False)[1:-1].replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
        return re.sub(r'@@([\w.-]+)@@',sub,m[0])
    result={}
    for path,html in templates['pages'].items():
        # Replace each original token exactly once, including tokens inside JSON-LD.
        chunks=re.split(r'(<script type="application/ld\+json">.*?</script>)',html,flags=re.S)
        result[path]=''.join(schema(re.match(r'.*',part,re.S)) if part.startswith('<script type="application/ld+json">') else re.sub(r'@@([\w.-]+)@@',replace,part) for part in chunks)
    return result
