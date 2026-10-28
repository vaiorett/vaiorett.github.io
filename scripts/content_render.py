"""Static counterpart of content-core.js; parity checked by tests/content-core.test.cjs."""
import json, re
from urllib.parse import urlsplit, parse_qs
from html import escape
from video_core import markup as video_markup, poster as video_poster, local as local_image
from layout_core import markup as gallery_markup

def serialize(name,value):
    return 'window.'+name+' = '+json.dumps(value,ensure_ascii=False,indent=2).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')+';\n'

def esc(value): return escape(str(value),quote=True).replace('&#x27;','&#39;')
def render(content,templates,galleries):
    values=content['values'];fields=dict(templates['fields']);meta=content.get('projects',templates['projects']);order=list(meta)
    for id in order:
        for lang in ['zh','en']:
            for key in ['title','desc','role','context','note','tools','tasks']:fields[f'project.{id}.{lang}.{key}']={'type':key if key in ['tools','tasks'] else 'text'}
    def cover(id):
        p=galleries['projects'][id];item=next((i for i in p['images'] if i.get('src')==p['cover'] or i.get('compare')==p['cover']),{})
        if item.get('src')==p['cover']:return item.get('thumbnail') or p['cover']
        if item.get('compare')==p['cover']:return item.get('compareThumbnail') or p['cover']
        return p['cover']
    def text(key):
        value=values[key];kind=fields[key]['type']
        if kind in ['tags','tasks','paragraphs']:
            tag={'tags':'span','tasks':'li','paragraphs':'p'}[kind]
            return ''.join(f'<{tag}>{esc(item)}</{tag}>' for item in value)
        if kind=='tools':return esc(' / '.join(value))
        if kind=='multiline':return esc(value).replace('\n','<br>')
        return esc(value)
    def gallery(id,lang):
        return gallery_markup(galleries['projects'][id],lang,dict(overview=values['ui.'+lang+'.overview'],title=values[f'project.{id}.{lang}.title'],open=values['ui.'+lang+'.open']))
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
        if key.startswith('facts.'):
            _,id,lang=key.split('.');prefix=f'project.{id}.{lang}.'
            out='<div class="project-facts"><div><span>'+text('ui.'+lang+'.category')+'</span><strong>'+esc(values['ui.'+lang+'.'+meta[id]['category']])+'</strong></div>'
            for field in ['role','tools']:
                value=values[prefix+field]
                if value and (not isinstance(value,str) or value.strip()):out+='<div><span>'+text('ui.'+lang+'.'+field)+'</span><strong>'+text(prefix+field)+'</strong></div>'
            return out+'</div>'
        if key.startswith('overview.'):
            _,id,lang=key.split('.');prefix=f'project.{id}.{lang}.';out=''
            for field in ['context','tasks']:
                value=values[prefix+field]
                if value and (not isinstance(value,str) or value.strip()):out+='<section><h2>'+text('ui.'+lang+'.'+field)+'</h2>'+('<ul>'+text(prefix+field)+'</ul>' if field=='tasks' else '<p>'+text(prefix+field)+'</p>')+'</section>'
            return '<div class="detail-overview">'+out+'</div>' if out else ''
        if key.startswith('worknote.'):
            _,id,lang=key.split('.');note=values[f'project.{id}.{lang}.note']
            source='<a href="'+esc(meta[id]['source'])+'" target="_blank" rel="noopener">'+esc(values['ui.'+lang+'.source'])+' ↗</a>' if meta[id].get('source') else ''
            return '<section class="work-note">'+('<div><h2>'+text('ui.'+lang+'.note')+'</h2><p>'+esc(note)+'</p></div>' if note.strip() else '')+source+'</section>' if note.strip() or source else ''
        if key.startswith('videos.'):
            _,id,lang=key.split('.');return videos(id,lang)
        if key.startswith('source.'):
            _,id,lang=key.split('.');return '<a href="'+esc(meta[id]['source'])+'" target="_blank" rel="noopener">'+esc(values['ui.'+lang+'.source'])+' ↗</a>' if meta[id].get('source') else ''
        if key.startswith('next.'):
            _,id,lang=key.split('.');n=order[(order.index(id)+1)%len(order)];return '<a class="next-project" href="./work-'+n+'.html"><span>'+esc(values['ui.'+lang+'.next'])+'</span><strong>'+esc(values['project.'+n+'.'+lang+'.title'])+' ↗</strong></a>'
        if key.startswith('cardcover.'):
            _,id,lang=key.split('.');project=galleries['projects'][id];fallback=cover(id);video_items=project.get('videos',[])
            video=next((v for v in video_items if v['id']==project.get('coverVideo')),None) if project.get('coverVideo') else (video_items[0] if project['cover']=='project-placeholder.webp' and not project['images'] and video_items else None)
            path=video_poster(video,fallback) if video else fallback
            return esc(('../' if lang=='en' else './')+path if local_image(path) else path)
        if key.startswith('coverSrcset.') or key.startswith('cardSrcset.'):
            kind,id,lang=key.split('.');project=galleries['projects'][id]
            if kind=='cardSrcset' and (project.get('coverVideo') or (not project['images'] and project.get('videos'))):return ''
            item=next((i for i in project['images'] if i.get('src')==project['cover'] or i.get('compare')==project['cover']),{})
            variants=item.get('responsive' if item.get('src')==project['cover'] else 'compareResponsive',[])
            return esc(', '.join(('../' if lang=='en' else './')+v['src']+' '+str(v['width'])+'w' for v in variants))
        if key.startswith('cardfallback.'):
            _,id,lang=key.split('.');return esc(('../' if lang=='en' else './')+cover(id))
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
    result['sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n'
    return result
