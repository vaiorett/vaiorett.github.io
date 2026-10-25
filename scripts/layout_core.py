"""Image-first layout shared with the no-build browser editor."""
import re
from html import escape

def esc(s):return escape(str(s),quote=True).replace('&#x27;','&#39;')
def size(item,mode='auto'):
    if mode in ['stack','story']:return 'full'
    if item.get('layout')=='full' or item.get('kind')=='collage':return 'full'
    if item.get('layout')=='half' or mode=='grid':return 'half'
    if not item.get('width') or not item.get('height'):return 'full'
    ratio=item['width']/item['height']
    return 'full' if ratio>=1.65 or ratio<.7 else 'half'
def markup(project,lang,labels):
    prefix='../' if lang=='en' else './';mode=project.get('layout','auto')
    if mode not in ['auto','stack','grid','story']:mode='auto'
    result='<div class="auto-gallery layout-'+mode+'">'
    for i,item in enumerate(project['images']):
        caption=(item.get('captionEn') if lang=='en' else item.get('caption')) or labels['overview']
        alt=(item.get('altEn') if lang=='en' else item.get('alt')) or labels['title']
        body=(item.get('bodyEn') if lang=='en' else item.get('body')) or ''
        dimensions=f' width="{item["width"]}" height="{item["height"]}"' if item.get('width') and item.get('height') else ''
        copy='<div class="gallery-copy"><figcaption>'+str(i+1).zfill(2)+' / '+esc(caption)+'</figcaption>'
        if body.strip():copy+='<div class="gallery-text">'+''.join('<p>'+esc(p)+'</p>' for p in re.split(r'\n\s*\n',body.strip()))+'</div>'
        copy+='</div>'
        result+='<figure class="gallery-item layout-'+size(item,mode)+(' legacy' if item.get('kind')=='collage' else '')+(' has-copy' if body.strip() else '')+'"><a class="gallery-button" href="'+prefix+esc(item['src'])+'" aria-label="'+esc(labels['open'])+': '+esc(caption)+'"><img src="'+prefix+esc(item.get('thumbnail') or item['src'])+'" alt="'+esc(alt)+'" loading="lazy"'+dimensions+'></a>'+copy+'</figure>'
    return result+'</div>'
