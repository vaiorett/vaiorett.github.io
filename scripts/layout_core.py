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
        raw_caption=item.get('captionEn') if lang=='en' else item.get('caption')
        caption=raw_caption or (labels['overview'] if item.get('kind')=='collage' else '')
        alt=(item.get('altEn') if lang=='en' else item.get('alt')) or labels['title']
        body=(item.get('bodyEn') if lang=='en' else item.get('body')) or ''
        dimensions=f' width="{item["width"]}" height="{item["height"]}"' if item.get('width') and item.get('height') else ''
        num=str(i+1).zfill(2)
        fig_text=f'{num} / {esc(caption)}' if caption else num
        copy='<div class="gallery-copy"><figcaption>'+fig_text+'</figcaption>'
        if body.strip():copy+='<div class="gallery-text">'+''.join('<p>'+esc(p)+'</p>' for p in re.split(r'\n\s*\n',body.strip()))+'</div>'
        copy+='</div>'
        if item.get('compare'):
            beforeLabel=(item.get('beforeLabelEn') if lang=='en' else item.get('beforeLabel')) or ('Before' if lang=='en' else '原图')
            afterLabel=(item.get('afterLabelEn') if lang=='en' else item.get('afterLabel')) or ('After' if lang=='en' else '效果')
            hint='Move to compare' if lang=='en' else '滑动画面对比效果'
            media='<div class="image-comparer" data-comparer style="--pos:0%"><div class="compare-stage"><img class="compare-img compare-after" src="'+prefix+esc(item['compare'])+'" alt="'+esc(alt)+'" loading="lazy"'+dimensions+'><div class="compare-overlay"><img class="compare-img compare-before" src="'+prefix+esc(item['src'])+'" alt="'+esc(alt)+'" loading="lazy"'+dimensions+'></div><span class="compare-badge compare-badge-before">'+esc(beforeLabel)+'</span><span class="compare-badge compare-badge-after">'+esc(afterLabel)+'</span><div class="compare-handle-line" role="slider" aria-label="'+esc(hint)+'" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" tabindex="0"></div></div></div>'
            result+='<figure class="gallery-item layout-'+size(item,mode)+' is-comparer'+(' has-copy' if body.strip() else '')+'">'+media+copy+'</figure>'
        else:
            result+='<figure class="gallery-item layout-'+size(item,mode)+(' legacy' if item.get('kind')=='collage' else '')+(' has-copy' if body.strip() else '')+'"><a class="gallery-button" href="'+prefix+esc(item['src'])+'" aria-label="'+esc(labels['open'])+': '+esc(caption or labels['title'])+'"><img src="'+prefix+esc(item.get('thumbnail') or item['src'])+'" alt="'+esc(alt)+'" loading="lazy"'+dimensions+'></a>'+copy+'</figure>'
    return result+'</div>'
