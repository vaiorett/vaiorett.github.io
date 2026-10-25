#!/usr/bin/env python3
"""Generate both static locales. Python standard library only; no hosting build required."""
import json
import hashlib
import re
from html import escape as e
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://vaiorett.github.io/'
GALLERY_VERSION = hashlib.sha256((ROOT/'gallery-data.js').read_bytes()).hexdigest()[:12]
PROJECTS = {p['id']: p for p in json.loads((ROOT/'site-data.json').read_text())}
EN = json.loads((ROOT/'content/projects.en.json').read_text())
PROFILE = json.loads((ROOT/'content/profile.json').read_text())
GALLERY = json.loads((ROOT/'gallery-data.js').read_text().split(' = ', 1)[1].strip().rstrip(';'))['projects']
ORDER = ['yunba-depot','digital-assets','grandstand','pedestrian-bridge','residential','product-rendering','interior','cgi']
GROUP = {'digital-assets':'assets','product-rendering':'product','interior':'studies','cgi':'studies'}
UI = {
'zh': dict(name='刘志', title='刘志 · 建筑可视化、三维建模与数字资产作品集',description='刘志的求职作品集：建筑可视化、三维建模、产品数字化与材质渲染。查看 8 组真实项目、个人职责、工作经历与简历。',work='作品',capabilities='专业能力',about='关于',contact='联系',resume='简历 PDF',resume_full='查看简历（中文 PDF）',skip='跳到主要内容',nav='主导航',home='作品集首页',back='返回作品选集',role='个人职责',tools='使用工具',category='项目类型',context='项目背景',tasks='我的工作',gallery='作品与过程',overview='项目作品总览',open='打开原图',note='职责与署名',source='原作品页面',next='下一个项目',close='关闭',previous='上一张图片',nextimage='下一张图片',zoom='作品大图',top='回到顶部',copy='复制邮箱',manager='作品管理（中文）',filter='按作品方向筛选',all='全部作品',architecture='建筑可视化',assets='三维资产',product='产品渲染',studies='空间与 CGI',experience='工作经历',education='教育经历',certificates='证书',alltools='工具与技能',footer='建筑 · 模型 · 视觉',view='查看项目'),
'en': dict(name='Liu Zhi', title='Liu Zhi · Architectural Visualization & 3D Portfolio',description='Portfolio of Liu Zhi: architectural visualization, 3D modeling, product digitization and rendering. Explore eight projects, individual contributions, experience and résumé.',work='Work',capabilities='Capabilities',about='About',contact='Contact',resume='Résumé PDF',resume_full='View résumé (Chinese PDF)',skip='Skip to main content',nav='Main navigation',home='Portfolio home',back='Back to selected work',role='My contribution',tools='Tools',category='Project type',context='Project context',tasks='What I did',gallery='Work & process',overview='Project overview',open='Open original image',note='Contribution & credits',source='Original portfolio',next='Next project',close='Close',previous='Previous image',nextimage='Next image',zoom='Image viewer',top='Back to top',copy='Copy email',manager='Manage images (Chinese)',filter='Filter projects by discipline',all='All work',architecture='Architecture',assets='3D assets',product='Product rendering',studies='Interior & CGI',experience='Experience',education='Education',certificates='Certificates',alltools='Tools & skills',footer='Architecture · Models · Visuals',view='View project')}

DEFAULT_PROJECTS={id:{'category':GROUP.get(id,'architecture'),'source':PROJECTS[id]['source']} for id in ORDER}
# The same inert templates and typed fields are used by the browser editor.
FIELDS={}; VALUES={}
LABELS={'name':'姓名','title':'标题','description':'搜索摘要','desc':'项目简介','role':'个人职责','tools':'使用工具','context':'项目背景','tasks':'我的工作（每行一项）','note':'职责与署名'}
def field(key,value,kind='text',label=None):
    FIELDS[key]={'type':kind,'label':label or LABELS.get(key.split('.')[-1],key.split('.')[-1])}
    VALUES[key]=value
    return '@@'+key+'@@'
HOME={
'zh':dict(kicker='求职作品集',hero='建筑可视化',heroAccent='三维建模与\n数字资产制作。',intro='从建筑与场地，到产品与材质。\n以模型、光影和图像，清楚呈现设计。',workTitle='精选项目',workIntro='查看作品、制作内容与个人职责。\n团队项目保留原团队设计署名。',capTitle='用作品说明能力',aboutTitle='从空间到产品，\n持续积累制作经验。',aboutIntro=['我是刘志，也使用 Violet_Kokoro 这个名字。','我做过产品数字化、家具渲染、建筑绘图与室内设计协作，参与模型制作、图纸表达、材质灯光和视觉内容交付。','目前正在学习 AI 视频创作，探索三维制作与 AIGC 的结合。'],contactTitle='寻找下一份\n与三维制作有关的机会。',contactIntro='欢迎联系建筑可视化、三维建模、数字资产制作及相关技术岗位机会。'),
'en':dict(kicker='PORTFOLIO',hero='Architectural\nvisualization.',heroAccent='3D modeling.',intro='Architecture, products and digital assets. Bringing designs into focus through modeling, materials and light.',workTitle='Selected work.',workIntro='Explore the images, process and my contribution.\nTeam projects credit the original design team.',capTitle='Skills, grounded in work.',aboutTitle='Across spaces\nand objects.',aboutIntro=['I’m Liu Zhi, also known as Violet_Kokoro.','My experience spans product digitization, furniture rendering, architectural drafting and interior design collaboration, including modeling, drawing presentation, materials, lighting and visual delivery.','I’m currently learning AI video creation and exploring how it can connect with 3D production.'],contactTitle='Let’s talk\nabout the next opportunity.',contactIntro='For opportunities in architectural visualization, 3D modeling, digital asset production and related technical roles.')}
HOME_LABELS={'kicker':'首页上方小标题','hero':'首页大标题','heroAccent':'首页大标题（强调部分）','intro':'首页简介','workTitle':'作品栏目标题','workIntro':'作品栏目说明','capTitle':'专业能力栏目标题','aboutTitle':'关于栏目标题','aboutIntro':'自我介绍（每行一段）','contactTitle':'联系栏目标题','contactIntro':'求职意向 / 联系说明'}
CAPS={
'zh':[['建筑可视化','从方案与图纸到建筑、场地模型及多视角表现。','SketchUp / AutoCAD / 3ds Max'],['三维建模与数字化','数字化采集、高精度资产、拓扑优化与材质制作。','RealityCapture / Blender / UE5'],['材质、灯光与渲染','通过材质、构图与光影，呈现产品细节和空间氛围。','3ds Max / V-Ray / Chaos Vantage']],
'en':[['Architecture','From design proposals and drawings to building models, site models and rendered views.','SketchUp / AutoCAD / 3ds Max'],['3D modeling & digitization','Digital capture, high-detail assets, topology optimization and material creation.','RealityCapture / Blender / UE5'],['Materials, lighting & rendering','Materials, composition and light to communicate product detail and spatial atmosphere.','3ds Max / V-Ray / Chaos Vantage']]}
BRAND=field('site.brand','VIOLET_KOKORO',label='网站署名（原 VIOLET_KOKORO）')
EMAIL=field('site.email','violet_kokoro@163.com','email','联系邮箱')
PHONE=field('site.phone','17551573719',label='手机 / 微信')
for lang in UI:
    for key,value in list(UI[lang].items()): UI[lang][key]=field(f'ui.{lang}.{key}',value,label=LABELS.get(key,'栏目 / 按钮：'+value))
    for key,value in list(HOME[lang].items()): HOME[lang][key]=field(f'home.{lang}.{key}',value,'paragraphs' if key=='aboutIntro' else 'multiline',HOME_LABELS[key])
    for i,row in enumerate(CAPS[lang]):
        CAPS[lang][i]=[field(f'cap.{lang}.{i}.{j}',value,label=f'能力 {i+1} · '+['标题','说明','使用工具'][j]) for j,value in enumerate(row)]
for id,p in PROJECTS.items():
    original=json.loads(json.dumps(p))
    for lang,target in [('zh',p),('en',EN[id])]:
        for key in ['title','desc','role','context','note','tools','tasks']:
            target[key]=field(f'project.{id}.{lang}.{key}',target.get(key,original[key]),'tools' if key=='tools' else 'tasks' if key=='tasks' else 'text')
            if key in ['tools','tasks']:target[key]=[target[key]]
for section in ['experience','education']:
    for i,row in enumerate(PROFILE[section]):
        if 'date' in row:row['date']=field(f'profile.{section}.{i}.date',row['date'],label=f'经历 {i+1} · 日期')
        for lang in ['zh','en']:
            row[lang]=[field(f'profile.{section}.{i}.{lang}.{j}',value,label=f'{"工作经历" if section=="experience" else "教育经历"} {i+1} · '+(['职位','机构','说明'] if section=='experience' else ['学校','专业','日期'])[j]) for j,value in enumerate(row[lang])]
PROFILE['tools']=[field('profile.tools',PROFILE['tools'],'tags','工具与技能（每行一项）')]
for lang in ['zh','en']:PROFILE['certificates'][lang]=[field('profile.certificates.'+lang,PROFILE['certificates'][lang],'paragraphs','证书（每行一项）')]
for id,g in GALLERY.items():g['cover']='@@cover.'+id+'@@'
GALLERY_VERSION='@@galleryVersion@@'

def project(id,lang):
    return {**PROJECTS[id], **(EN[id] if lang=='en' else {})}

def canonical(lang,file):
    return BASE+('en/' if lang=='en' else '')+('' if file=='index.html' else file)

def head(lang,file,title,desc,image):
    root='../' if lang=='en' else './'
    url=canonical(lang,file)
    schema={'@context':'https://schema.org','@type':'WebPage','name':title,'description':desc,'url':url,'inLanguage':'en' if lang=='en' else 'zh-CN','about':{'@type':'Person','name':UI[lang]['name'],'alternateName':BRAND,'url':BASE},'primaryImageOfPage':{'@type':'ImageObject','contentUrl':BASE+image}}
    return f'''<!doctype html>
<html lang="{'en' if lang=='en' else 'zh-CN'}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><script src="{root}theme.js?v=20261025-video2"></script><title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="zh-CN" href="{canonical('zh',file)}">
<link rel="alternate" hreflang="en" href="{canonical('en',file)}">
<link rel="alternate" hreflang="x-default" href="{canonical('zh',file)}">
<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE+image}"><meta property="og:image:alt" content="{e(title)}">
<meta property="og:locale" content="{'en_US' if lang=='en' else 'zh_CN'}">
<meta property="og:locale:alternate" content="{'zh_CN' if lang=='en' else 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{root}style.css?v=20261025-video2"><link rel="stylesheet" href="{root}portfolio.css?v=20261025-video2">
<link rel="stylesheet" href="{root}theme.css?v=20261025-video2">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')}</script>
<script src="{root}video-core.js?v=20261025-video2" defer></script><script src="{root}gallery-data.js?v={GALLERY_VERSION}" defer></script><script src="{root}app.js?v=20261025-video2" defer></script>
</head><body data-root="{root}">
'''

def theme_control(lang):
    label='显示主题' if lang=='zh' else 'Appearance'
    options=[('system','跟随系统' if lang=='zh' else 'System'),('light','浅色' if lang=='zh' else 'Light'),('dark','深色' if lang=='zh' else 'Dark')]
    return f'<label class="theme-control"><span class="sr-only">{label}</span><select data-theme-select aria-label="{label}">'+''.join(f'<option value="{value}">{text}</option>' for value,text in options)+'</select></label>'

def header(lang,file):
    t=UI[lang];root='../' if lang=='en' else './'
    languages=''.join(f'<a href="{("../" if lang=="en" else "./") if code=="zh" else ("./" if lang=="en" else "./en/")}{file}" lang="{code}" hreflang="{code}" data-language="{code}" {"aria-current=\"page\"" if code==lang else ""}>{label}</a>' for code,label in [('zh','中文'),('en','EN')])
    return f'''<a class="skip-link" href="#main">{t['skip']}</a>
<header class="site-header"><div class="nav-wrap">
<a class="brand" href="./index.html" aria-label="{t['name']} · {t['home']}"><span class="brand-mark">V<span>•</span></span><span class="brand-name">{t['name']}<span>{BRAND}</span></span></a>
<nav aria-label="{t['nav']}"><a href="./index.html#work">{t['work']}</a><a href="./index.html#capabilities">{t['capabilities']}</a><a href="./index.html#about">{t['about']}</a><a href="./index.html#contact">{t['contact']}</a><a class="resume-nav" href="{root}liu-zhi-resume.pdf?v=20261025-contact" target="_blank" rel="noopener">{t['resume']} ↗</a></nav>
<div class="language-switch" role="group" aria-label="Language / 语言">{languages}</div>
{theme_control(lang)}</div></header>'''

def footer(lang):
    t=UI[lang];root='../' if lang=='en' else './'
    return f'''<footer class="site-footer"><span>© 2026 {t['name']} · {BRAND}</span><span>{t['footer']}</span><div class="footer-links"><a href="{root}manage.html">{t['manager']}</a><a href="https://github.com/vaiorett" target="_blank" rel="noopener">GitHub ↗</a></div></footer><button class="back-top" type="button" aria-label="{t['top']}" hidden>↑</button></body></html>'''

def capabilities(lang):
    t=UI[lang]
    items=[(f'{i+1:02d}',*row,id) for i,(row,id) in enumerate(zip(CAPS[lang],['grandstand','digital-assets','product-rendering']))]
    cards=''.join(f'<a class="capability" href="./work-{id}.html"><span class="eyebrow accent">{num}</span><h3>{title}</h3><p>{desc}</p><p class="tool-line">{tools}</p><span class="capability-link">{t["view"]} ↗</span></a>' for num,title,desc,tools,id in items)
    return f'<section id="capabilities" class="capability-section wrap"><div class="section-top"><div><p class="eyebrow accent">02 / {t["capabilities"]}</p><h2>{HOME[lang]['capTitle']}</h2></div></div><div class="capability-grid">{cards}</div></section>'

def about(lang):
    t=UI[lang]
    jobs=''.join(f'<li><span class="timeline-date">{row["date"]}</span><h4>{e(row[lang][0])}</h4><p>{e(row[lang][1])}</p>'+ (f'<p class="timeline-detail">{e(row[lang][2])}</p>' if row[lang][2] else '')+'</li>' for row in PROFILE['experience'])
    education=''.join(f'<div class="education-item"><h4>{e(row[lang][0])}</h4><p>{e(row[lang][1])}</p><p>{e(row[lang][2])}</p></div>' for row in PROFILE['education'])
    tools=''.join(f'<span>{e(tool)}</span>' for tool in PROFILE['tools'])
    certs=''.join(f'<p>{e(cert)}</p>' for cert in PROFILE['certificates'][lang])
    intro=HOME[lang]['aboutIntro']
    return f'''<section id="about" class="about-section"><div class="wrap"><div class="section-top"><div><p class="eyebrow accent">03 / {t['about']}</p><h2>{HOME[lang]['aboutTitle']}</h2></div><div class="about-intro">{intro}</div></div><div class="about-columns"><div><h3 class="small-heading">{t['experience']}</h3><ol class="timeline">{jobs}</ol></div><div><h3 class="small-heading">{t['education']}</h3>{education}<h3 class="small-heading skills-heading">{t['alltools']}</h3><div class="skill-tags">{tools}</div><div class="certificates"><h3 class="small-heading">{t['certificates']}</h3>{certs}</div></div></div></div></section>'''

def home(lang):
    t=UI[lang];root='../' if lang=='en' else './'; hero=project('yunba-depot',lang)
    groups=[('all','all','08'),('architecture','architecture','04'),('assets','assets','01'),('product','product','01'),('studies','studies','02')]
    filters=''.join(f'<button type="button" class="filter {"active" if i==0 else ""}" data-filter="{key}" aria-pressed="{str(i==0).lower()}">{t[label]} <span>@@total.{key}@@</span></button>' for i,(key,label,n) in enumerate(groups))
    cards=[]
    for index,id in enumerate(ORDER):
        p=project(id,lang);group=GROUP.get(id,'architecture')
        cards.append(f'''<article class="project-card" data-project-card="{id}" data-category="{group}"><a href="./work-{id}.html" class="project-link"><div class="project-image"><img src="{root}{GALLERY[id]['cover']}" alt="{e(p['title'])}" loading="lazy" decoding="async" width="800" height="570"><span class="image-number">{index+1:02d}</span><span class="project-open" aria-hidden="true">↗</span></div><div class="project-meta"><span class="eyebrow">{t[group]}</span></div><h3>{e(p['title'])}</h3><p class="project-role">{e(p['role'])}</p><p class="card-description">{e(p['desc'])}</p><p class="card-tools">{e(' / '.join(p['tools']))}</p></a></article>''')
    h= head(lang,'index.html',t['title'],t['description'],GALLERY['yunba-depot']['cover'])+header(lang,'index.html')
    h+=f'''<main id="main"><section class="hero wrap" aria-labelledby="intro-title"><div class="hero-copy"><p class="eyebrow accent">{t['name']} / {HOME[lang]['kicker']}</p><h1 id="intro-title">{HOME[lang]['hero']}<br><span>{HOME[lang]['heroAccent']}</span></h1><p class="hero-intro">{HOME[lang]['intro']}</p><div class="hero-actions"><a class="button primary" href="#work">{t['work']} ↓</a><a class="text-link" href="{root}liu-zhi-resume.pdf?v=20261025-contact" target="_blank" rel="noopener">{t['resume_full']} ↗</a></div></div><a class="hero-art" href="./work-yunba-depot.html" aria-label="{e(hero['title'])}"><img src="{root}{GALLERY['yunba-depot']['cover']}" alt="{e(hero['title'])}" width="1033" height="634" fetchpriority="high"><div class="hero-art-caption"><span>01 / {t['architecture']}</span><span>{e(hero['title'])} <b aria-hidden="true">↗</b></span><span>{e(hero['role'])}</span></div></a></section>
<section id="work" class="work-section wrap" aria-labelledby="work-title"><div class="section-top"><div><p class="eyebrow accent">01 / {t['work']}</p><h2 id="work-title">{HOME[lang]['workTitle']}<span class="section-count">@@total.all@@</span></h2></div><p class="section-description">{HOME[lang]['workIntro']}</p></div><div class="filter-bar" role="group" aria-label="{t['filter']}" hidden>{filters}</div><p class="sr-only" id="filter-status" aria-live="polite"></p><div class="project-grid">@@cards.{lang}@@</div></section>
{capabilities(lang)}{about(lang)}
<section id="contact" class="contact-section wrap"><p class="eyebrow accent">04 / {t['contact']}</p><h2>{HOME[lang]['contactTitle']}</h2><div class="contact-bottom"><p>{HOME[lang]['contactIntro']}</p><div class="contact-links"><span class="contact-phone">{'手机 / 微信' if lang=='zh' else 'Phone / WeChat'}：{PHONE}</span><a href="mailto:{EMAIL}">{EMAIL} ↗</a><button type="button" class="copy-email" data-email="{EMAIL}" hidden>{t['copy']}</button></div></div><p class="copy-status" role="status"></p></section></main>'''
    return h+footer(lang)

def detail(lang,id):
    p=project(id,lang);t=UI[lang];root='../' if lang=='en' else './';file=f'work-{id}.html';g=GALLERY[id]
    gallery=['@@gallery.'+id+'.'+lang+'@@']
    nextid=ORDER[(ORDER.index(id)+1)%len(ORDER)];nextp=project(nextid,lang)
    return head(lang,file,p['title']+' · '+t['name'],p['desc'],g['cover'])+header(lang,file)+f'''<main id="main" class="project-page wrap"><a class="back-link" href="./index.html#work">← {t['back']}</a><p class="eyebrow accent">@@category.{id}.{lang}@@</p><h1>{e(p['title'])}</h1><p class="project-lead">{e(p['desc'])}</p>
<div class="project-facts"><div><span>{t['category']}</span><strong>@@category.{id}.{lang}@@</strong></div><div><span>{t['role']}</span><strong>{e(p['role'])}</strong></div><div><span>{t['tools']}</span><strong>{e(' / '.join(p['tools']))}</strong></div></div>
<figure class="project-preview"><img data-project-preview="{id}" src="{root}{g['cover']}" alt="{e(p['title'])}" width="1033" height="634" fetchpriority="high"><figcaption>{e(p['role'])}</figcaption></figure>
<div class="detail-overview"><div><h2>{t['context']}</h2><p>{e(p['context'])}</p></div><div><h2>{t['tasks']}</h2><ul>{''.join(f'<li>{e(task)}</li>' for task in p['tasks'])}</ul></div></div>
@@videos.{id}.{lang}@@
<div class="gallery-heading"><h2>{t['gallery']}</h2><span data-gallery-count>@@count.{id}@@ / {t['open']}</span></div><div class="work-gallery" data-gallery="{id}" data-title="{e(p['title'])}" data-root="{root}">{''.join(gallery)}</div>
<div class="work-note"><div><h2>{t['note']}</h2><p>{e(p['note'])}</p></div>@@source.{id}.{lang}@@</div>@@next.{id}.{lang}@@</main>
<dialog class="lightbox" aria-label="{t['zoom']}"><div class="lightbox-toolbar"><span>{e(p['title'])}</span><div class="lightbox-controls"><button type="button" class="previous-image" aria-label="{t['previous']}">←</button><span class="lightbox-position"></span><button type="button" class="next-image" aria-label="{t['nextimage']}">→</button><button type="button" class="close-lightbox" aria-label="{t['close']}">{t['close']} ✕</button></div></div><div class="lightbox-scroll"><img alt=""></div></dialog>'''+footer(lang)

def card_template(lang):
    root='../' if lang=='en' else './';id='__project__'
    return f'<article class="project-card" data-project-card="{id}" data-category="@@group.{id}@@"><a href="./work-{id}.html" class="project-link"><div class="project-image"><img src="{root}@@cover.{id}@@" alt="@@project.{id}.{lang}.title@@" loading="lazy" decoding="async" width="800" height="570"><span class="image-number">@@number.{id}@@</span><span class="project-open" aria-hidden="true">↗</span></div><div class="project-meta"><span class="eyebrow">@@category.{id}.{lang}@@</span></div><h3>@@project.{id}.{lang}.title@@</h3><p class="project-role">@@project.{id}.{lang}.role@@</p><p class="card-description">@@project.{id}.{lang}.desc@@</p><p class="card-tools">@@project.{id}.{lang}.tools@@</p></a></article>'

def build():
    from content_render import render, serialize
    old_path=ROOT/'content-data.js'
    old=json.loads(old_path.read_text().split(' = ',1)[1].strip().rstrip(';')) if old_path.exists() else {'version':1,'values':{}}
    values={**VALUES,**old['values']}
    content={'version':1,'values':values,'projects':old.get('projects',DEFAULT_PROJECTS)}
    pages={('en/' if lang=='en' else '')+'index.html':home(lang) for lang in UI}
    details={lang:detail(lang,'grandstand').replace('grandstand','__project__') for lang in UI}
    for collection in [pages,details]:
        for path,html in collection.items():
            # Arrays own wrappers so the number of entries is editable.
            html=re.sub(r'<li>(@@project\.[\w.-]+\.tasks@@)</li>',r'\1',html)
            for key,definition in FIELDS.items():
                wrapper={'tasks':'li','tags':'span','paragraphs':'p'}.get(definition['type'])
                if wrapper:html=html.replace(f'<{wrapper}>@@{key}@@</{wrapper}>',f'@@{key}@@')
            collection[path]=html
    templates={'version':2,'fields':FIELDS,'pages':pages,'details':details,'cards':{lang:card_template(lang) for lang in UI},'projects':DEFAULT_PROJECTS}
    (ROOT/'content-data.js').write_text(serialize('PORTFOLIO_CONTENT',content))
    (ROOT/'content-templates.js').write_text(serialize('PORTFOLIO_TEMPLATES',templates))
    galleries=json.loads((ROOT/'gallery-data.js').read_text().split(' = ',1)[1].strip().rstrip(';'))
    output=render(content,templates,galleries)
    for path,html in output.items():
        (ROOT/path).parent.mkdir(exist_ok=True);(ROOT/path).write_text(html)
    (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE+'sitemap.xml\n')
    print(f'Generated {len(output)-1} bilingual pages and sitemap, preserving current projects and text.')
if __name__=='__main__': build()
