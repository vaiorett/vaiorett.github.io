#!/usr/bin/env python3
"""Generate useful additional pixel-lossless WebP preview sizes.

Only preview copies are resized. Originals and existing previews are untouched.
Requires Pillow with WebP support; never enlarges an image or keeps a preview
that costs more bytes than its full-size fallback.
"""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib,json

ROOT=Path(__file__).resolve().parents[1]
WIDTHS=(480,800,1200,1600)
def generate():
    manifest=ROOT/'gallery-data.js'
    data=json.loads(manifest.read_text().split(' = ',1)[1].strip().rstrip(';'))
    out=ROOT/'images/responsive';out.mkdir(exist_ok=True)
    cache={};generated=[];kept=set()
    def variants(source,existing,thumbnail):
        if source in cache:return cache[source]
        path=ROOT/source;blob=path.read_bytes()
        with Image.open(path) as raw:
            w,h=ImageOps.exif_transpose(raw).size
            result=list(existing or [])
            if thumbnail:
                with Image.open(ROOT/thumbnail) as thumb:tw=thumb.width
                if not any(v['width']==tw for v in result):result.append({'src':thumbnail,'width':tw})
            if not result:result=[{'src':source,'width':w}]
            result.sort(key=lambda v:v['width'])
            references=list(result)
            for width in WIDTHS:
                if width>=references[-1]['width'] or any(v['width']==width for v in result):continue
                fallback=next(v for v in references if v['width']>width)
                # Preserve existing displayed previews; an added size must beat
                # the browser's previous next-larger choice, not just the original.
                parent=ROOT/fallback['src'];parent_bytes=parent.read_bytes()
                with Image.open(parent) as image:
                    icc=image.info.get('icc_profile')
                    image=ImageOps.exif_transpose(image).convert('RGBA')
                    preview=image.resize((width,max(1,round(image.height*width/image.width))),Image.Resampling.LANCZOS)
                name=hashlib.sha256(parent_bytes+b'lossless-v2').hexdigest()[:20]+f'-{width}.webp'
                target=out/name
                options={'lossless':True,'quality':75,'method':4,'exact':True}
                if icc:options['icc_profile']=icc
                preview.save(target,'WEBP',**options)
                # Lossless means every pixel of the resized preview survives.
                with Image.open(target) as check:
                    assert check.convert('RGBA').tobytes()==preview.tobytes(),target
                if target.stat().st_size>=len(parent_bytes):target.unlink();continue
                rel=target.relative_to(ROOT).as_posix();kept.add(rel)
                generated.append({'src':rel,'width':width,'bytes':target.stat().st_size})
                result.append({'src':rel,'width':width})
            result.sort(key=lambda v:v['width'])
            if len(result)>4:result=result[:3]+[result[-1]]
            for entry in result:kept.add(entry['src'])
        cache[source]=result
        return result
    for project in data['projects'].values():
        for item in project['images']:
            item['responsive']=variants(item['src'],item.get('responsive'),item.get('thumbnail'))
            if item.get('compare'):item['compareResponsive']=variants(item['compare'],item.get('compareResponsive'),item.get('compareThumbnail'))
    for path in out.glob('*.webp'):
        if path.relative_to(ROOT).as_posix() not in kept:path.unlink()
    manifest.write_text('window.PORTFOLIO_GALLERIES = '+json.dumps(data,ensure_ascii=False,indent=2).replace('<','\\u003c')+';\n')
    report={'sources':len(cache),'generated':len(generated),'preview_bytes':sum(i['bytes'] for i in generated),'variants':generated}
    print(json.dumps({k:v for k,v in report.items() if k!='variants'}))
    return report
if __name__=='__main__':generate()
