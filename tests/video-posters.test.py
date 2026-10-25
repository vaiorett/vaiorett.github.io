import sys,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from refresh_video_posters import refresh,valid_poster
base={'version':1,'projects':{'p':{'videos':[{'id':'v','url':'BV16inH6SEvM','title':'User title','titleEn':'User English'}]}}}
def good(v):return 'https://i1.hdslb.com/bfs/archive/cover.jpg','Provider title'
data=copy.deepcopy(base);assert refresh(data,good);v=data['projects']['p']['videos'][0];assert v['title']=='User title' and v['titleEn']=='User English';assert not refresh(data,lambda v:(_ for _ in ()).throw(AssertionError('must not refetch')))
v['posterRefresh']='9999';assert refresh(data,good)
bad=copy.deepcopy(base);assert refresh(bad,lambda v:('https://evil.test/cover.jpg','Bad'));assert 'poster' not in bad['projects']['p']['videos'][0];assert bad['projects']['p']['videos'][0]['posterStatus']=='unavailable';assert not refresh(bad,lambda v:(_ for _ in ()).throw(AssertionError('No automatic retry loop')))
custom=copy.deepcopy(base);custom['projects']['p']['videos'][0]['posterOverride']='images/uploads/user.webp';assert not refresh(custom,lambda v:(_ for _ in ()).throw(AssertionError()))
assert not valid_poster('https://hdslb.com.evil.test/c.jpg');assert not valid_poster('http://i1.hdslb.com/c.jpg')
print('PASS: official cover caching, forced refresh, user title preservation, override and host validation.')
