#!/usr/bin/env python3
"""Fetch only official Bilibili cover metadata; no media stream downloading."""
import datetime,gzip,json,zlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
from video_core import info
ROOT=Path(__file__).resolve().parents[1]
AUTO_KEYS=['poster','posterFor','posterUpdatedAt','providerTitle']
class OpenGraph(HTMLParser):
    def __init__(self):super().__init__();self.meta={}
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='meta' and attrs.get('property') in ['og:image','og:title']:self.meta[attrs['property']]=attrs.get('content','')
def request(url):
    with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36','Accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8','Accept-Language':'zh-CN,zh;q=0.9,en;q=0.8','Accept-Encoding':'gzip, deflate','Referer':'https://www.bilibili.com/'}),timeout=18) as response:
        data=response.read(4*1024*1024)
        if data[:2]==b'\x1f\x8b':data=gzip.decompress(data)
        elif response.headers.get('Content-Encoding')=='deflate':data=zlib.decompress(data)
        return data.decode('utf-8')
def valid_poster(url):
    try:
        u=urlsplit(url);return u.scheme=='https' and (u.hostname=='hdslb.com' or u.hostname.endswith('.hdslb.com')) and not u.username and not u.password and not u.port
    except (ValueError,AttributeError):return False

def fetch_bilibili(video):
    v=info(video['url']);assert v['provider']=='bilibili'
    try:
        result=json.loads(request('https://api.bilibili.com/x/web-interface/view?bvid='+v['bvid']))
        if result.get('code')==0:
            data=result['data'];poster=data.get('pic','').replace('http://','https://',1)
            if valid_poster(poster):return poster,data.get('title','')
    except Exception:pass
    last=None
    for url in ['https://m.bilibili.com/video/'+v['bvid']+'/?p='+str(v['page']),v['url']]:
        try:
            parser=OpenGraph();parser.feed(request(url))
            poster=parser.meta.get('og:image','').replace('http://','https://',1)
            if valid_poster(poster):return poster,parser.meta.get('og:title','').removesuffix('_哔哩哔哩_bilibili')
        except Exception as error:last=error
    if last:raise last
    raise ValueError('Official cover unavailable')

def refresh(data,fetch=fetch_bilibili,failures=None):
    changed=False
    for project in data['projects'].values():
        for video in project.get('videos',[]):
            v=info(video['url'])
            if v['provider']!='bilibili' or video.get('posterOverride'):continue
            attempted=video.get('posterAttemptedAt') or video.get('posterUpdatedAt','')
            if video.get('posterFor')==v['url'] and attempted and video.get('posterRefresh','')<=attempted:continue
            try:
                poster,title=fetch(video)
                if not valid_poster(poster):raise ValueError('Invalid cover host')
                video.update(poster=poster,posterFor=v['url'],providerTitle=title,posterUpdatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z'))
                video.update(posterStatus='ready',posterError='',posterAttemptedAt=video['posterUpdatedAt']);changed=True;print('Updated official video cover:',v['bvid'])
            except Exception as error:
                message=f"{v['bvid']} {type(error).__name__} {getattr(error,'code','')}";print('::warning::Official cover unavailable; existing cover remains: '+message)
                if video.get('posterFor')!=v['url']:video.pop('poster',None)
                video.update(posterFor=v['url'],posterStatus='unavailable',posterError='HTTP '+str(getattr(error,'code','unavailable')),posterAttemptedAt=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z'));changed=True
                if failures is not None:failures.append(message)
    if changed:data['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
    return changed
if __name__=='__main__':
    path=ROOT/'gallery-data.js';data=json.loads(path.read_text().split(' = ',1)[1].strip().rstrip(';'))
    failures=[]
    if refresh(data,failures=failures):path.write_text('window.PORTFOLIO_GALLERIES = '+json.dumps(data,ensure_ascii=False,indent=2).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')+';\n')

    if failures:print('Cover request failures recorded; existing/project covers retained. Retry explicitly when needed.')
