"""Static counterpart of video-core.js; generated HTML is tested for parity."""
import re
from urllib.parse import urlsplit,parse_qs
from html import escape

def esc(value):return escape(str(value),quote=True).replace('&#x27;','&#39;')
def local(value):return isinstance(value,str) and bool(re.fullmatch(r'(?:images/uploads/)?[a-z0-9_.-]+\.(?:jpe?g|png|webp|avif)',value,re.I)) and '..' not in value

def info(raw):
    raw=raw.strip();bvid='';page=1
    if re.fullmatch(r'BV[0-9A-Za-z]{10}',raw):bvid=raw
    else:
        u=urlsplit(raw);q=parse_qs(u.query,keep_blank_values=True);host=u.hostname
        if u.scheme!='https' or u.username or u.password or u.port:raise ValueError('Invalid video URL')
        if host in ['www.bilibili.com','bilibili.com','m.bilibili.com','player.bilibili.com']:
            match=re.fullmatch(r'/video/(BV[0-9A-Za-z]{10})/?',u.path)
            bvid=q.get('bvid',[''])[0] if host=='player.bilibili.com' and u.path=='/player.html' else match[1] if match else ''
            if 'p' in q and not re.fullmatch(r'[1-9][0-9]{0,3}',q['p'][0]):raise ValueError('Invalid video part')
            page=int(q.get('p',['1'])[0])
            if not re.fullmatch(r'BV[0-9A-Za-z]{10}',bvid):raise ValueError('Invalid BV ID')
        elif host in ['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com']:
            match=re.fullmatch(r'/(?:embed|shorts|live)/([\w-]{11})/?',u.path)
            id=u.path[1:].removesuffix('/') if host=='youtu.be' else q.get('v',[''])[0] if u.path=='/watch' else match[1] if match else ''
            if not re.fullmatch(r'[A-Za-z0-9_-]{11}',id):raise ValueError('Invalid YouTube ID')
            return dict(provider='youtube',id=id,url='https://www.youtube.com/watch?v='+id,embed='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0',poster='https://i.ytimg.com/vi/'+id+'/maxresdefault.jpg',posterFallback='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg')
        elif re.search(r'\.(?:mp4|webm)$',u.path,re.I):return dict(provider='file',url=raw,embed=raw,poster='',posterFallback='')
        else:raise ValueError('Unsupported video provider')
    return dict(provider='bilibili',bvid=bvid,page=page,url=f'https://www.bilibili.com/video/{bvid}/?p={page}',embed=f'https://player.bilibili.com/player.html?bvid={bvid}&p={page}&autoplay=1&danmaku=0&high_quality=1&as_wide=1&poster=1',poster='',posterFallback='')

def image_url(value):
    if local(value):return True
    try:
        u=urlsplit(value);return u.scheme=='https' and bool(u.hostname) and not u.username and not u.password and not u.port
    except ValueError:return False

def poster(item,fallback):
    v=info(item['url']);value=item.get('posterOverride') or (item.get('poster') if item.get('posterFor')==v['url'] else '') or v['poster'] or fallback
    return value if image_url(value) else fallback

def asset(url,lang):return ('../' if lang=='en' else './')+url if local(url) else url

def markup(items,lang,fallback):
    if not items:return ''
    zh=lang=='zh';out='<section id="project-videos" class="project-videos" aria-label="'+('项目视频' if zh else 'Project videos')+'"><h2>'+('项目视频' if zh else 'Project videos')+'</h2>'
    for i,item in enumerate(items):
        v=info(item['url']);title=(item['title'] if zh else item['titleEn']) or ('项目视频 ' if zh else 'Project video ')+str(i+1)
        playback=info(item['playbackUrl']) if item.get('playbackUrl') else v
        cover=poster(item,fallback);help='播放选项' if zh else 'Playback options'
        note='若出现登录验证或无法播放，可打开视频来源。第三方播放器的推荐、画质及验证由平台控制。' if zh else 'If sign-in is required or playback is unavailable, open the video source. Recommendations, quality and verification are controlled by the platform.'
        out+='<article class="project-video"><div class="video-screen"><button type="button" class="video-play" data-video-url="'+esc(playback['url'])+'" data-video-title="'+esc(title)+'"'+(' data-provider-title="'+esc(item['providerTitle'].strip())+'"' if zh and isinstance(item.get('providerTitle'),str) and item['providerTitle'].strip() else '')+' aria-label="'+esc(('播放视频：' if zh else 'Play video: ')+title)+'"><img class="video-poster" src="'+esc(asset(cover,lang))+'" alt="" loading="lazy" referrerpolicy="no-referrer" data-poster-fallback="'+esc(v['posterFallback'] or asset(fallback,lang))+'" data-project-poster="'+esc(asset(fallback,lang))+'"><span class="video-shade" aria-hidden="true"></span><span class="video-play-icon" aria-hidden="true">▶</span></button></div><div class="video-toolbar" hidden><details class="video-options"><summary aria-label="'+help+'" title="'+help+'">⋯</summary><div class="video-options-panel"><p>'+note+'</p><a href="'+esc(v['url'])+'" target="_blank" rel="noopener">'+('打开视频来源' if zh else 'Open video source')+' ↗</a></div></details></div><p class="video-play-status" role="status" aria-live="polite"></p></article>'
    return out+'</section>'
