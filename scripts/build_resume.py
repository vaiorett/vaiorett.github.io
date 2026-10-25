#!/usr/bin/env python3
"""A4 resume using the current site contact details and preserved original resume facts.
Requires reportlab; RESUME_CJK_FONT may select an installed TrueType CJK font.
"""
import json, os, re
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
ROOT=Path(__file__).resolve().parents[1]
CONTENT=json.loads((ROOT/'content-data.js').read_text().split(' = ',1)[1].strip().rstrip(';'))['values']
DATA=json.loads((ROOT/'content/resume.json').read_text())
FONT=os.environ.get('RESUME_CJK_FONT','/usr/share/fonts/google-droid-sans-fonts/DroidSansFallbackFull.ttf')
pdfmetrics.registerFont(TTFont('CN',FONT))
LATIN='/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf'
pdfmetrics.registerFont(TTFont('Latin',LATIN))
pdfmetrics.registerFont(TTFont('LatinBold','/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf'))
W,H=A4;LEFT=42;RIGHT=W-42;WIDTH=RIGHT-LEFT
INK=HexColor('#172b32');MUTED=HexColor('#596b71');ACCENT=HexColor('#1b777a');LINE=HexColor('#d8e3e4')
OUT=ROOT/'liu-zhi-resume.pdf'
c=Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle(CONTENT['ui.zh.name']+' | 三维制作与可视化履历')
c.setAuthor(CONTENT['ui.zh.name']);c.setSubject('工作经历、专业技能与教育经历')
c.setCreator('Portfolio resume builder')
def mixed(value):
    value=escape(value)
    return re.sub(r'([\x20-\x7e\u00b7]+)',r'<font name="Latin">\1</font>',value)
def text_width(text,size,font='CN'):
    if font!='CN':return pdfmetrics.stringWidth(text,font,size)
    return sum(pdfmetrics.stringWidth(part,'Latin' if re.fullmatch(r'[\x20-\x7e\u00b7]+',part) else 'CN',size) for part in re.findall(r'[\x20-\x7e\u00b7]+|[^\x20-\x7e\u00b7]+',text))
def line(text,x,y,size=10,color=INK,bold=False,font='CN'):
    c.saveState();c.setFillColor(color);c.setStrokeColor(color)
    obj=c.beginText(x,y);obj.setTextRenderMode(0)
    if bold and font=='CN':c.setLineWidth(.16);obj.setTextRenderMode(2)
    parts=re.findall(r'[\x20-\x7e\u00b7]+|[^\x20-\x7e\u00b7]+',text) if font=='CN' else [text]
    for part in parts:
        selected='Latin' if font=='CN' and re.fullmatch(r'[\x20-\x7e\u00b7]+',part) else font
        obj.setFont(selected,size);obj.textOut(part)
    c.drawText(obj);c.restoreState()
def para(text,x,y,width,size=9.4,leading=14,color=INK):
    p=Paragraph(mixed(text),ParagraphStyle('p',fontName='CN',fontSize=size,leading=leading,textColor=color,wordWrap='CJK'))
    _,h=p.wrap(width,900);p.drawOn(c,x,y-h);return y-h

def section(title,eng,y,x=LEFT,width=WIDTH):
    line(title,x,y,11.4,ACCENT,True)
    c.setFillColor(MUTED);c.setFont('Latin',7.5);c.drawRightString(x+width,y+1,eng)
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(x,y-8,x+width,y-8)
    return y-23

# Header: compact contact block with live links.
c.setFillColor(ACCENT);c.rect(LEFT,H-49,4,17,fill=1,stroke=0)
line(CONTENT['ui.zh.name'],LEFT,H-88,31,INK,True)
line('三维制作 / 可视化 / 产品数字化',LEFT,H-112,11.3,MUTED)
line(CONTENT['site.brand'],RIGHT-pdfmetrics.stringWidth(CONTENT['site.brand'],'Latin',10),H-57,10,ACCENT,font='Latin')
contact_y=H-82
line('手机 / 微信  '+CONTENT['site.phone'],RIGHT-218,contact_y,9.5,INK)
line(CONTENT['site.email'],RIGHT-218,contact_y-18,9.8,INK,font='Latin')
line('作品集  vaiorett.github.io',RIGHT-218,contact_y-36,9.5,ACCENT)
c.linkURL('mailto:'+CONTENT['site.email'],(RIGHT-220,contact_y-21,RIGHT,contact_y-8),relative=0)
c.linkURL('tel:'+CONTENT['site.phone'],(RIGHT-220,contact_y-3,RIGHT,contact_y+10),relative=0)
c.linkURL('https://vaiorett.github.io/',(RIGHT-220,contact_y-39,RIGHT,contact_y-24),relative=0)
y=para(DATA['summary'],LEFT,H-137,WIDTH,9.8,14.5,MUTED)-24

# Experience is the central reading path. Dates remain in a stable right column.
y=section('工作经历','EXPERIENCE',y)
for i,job in enumerate(DATA['experience']):
    line(job['role'],LEFT,y,10.8,INK,True)
    c.setFont('Latin',9.1);c.setFillColor(MUTED);c.drawRightString(RIGHT,y,job['date'])
    y-=16;line(job['company'],LEFT,y,9.8,MUTED)
    if job.get('note'):
        line(job['note'],RIGHT-text_width(job['note'],8.3),y,8.3,MUTED)
    y-=8
    for bullet in job['bullets']:
        c.setFillColor(ACCENT);c.circle(LEFT+2,y-6,1.2,fill=1,stroke=0)
        y=para(bullet,LEFT+10,y,WIDTH-10,9.7,14.3)-3
    y-=12 if i<4 else 17

y=section('专业技能','SKILLS',y)
for label,body in DATA['skills']:
    line(label,LEFT,y-9,9.3,INK,True)
    y=para(body,LEFT+72,y,WIDTH-72,9.2,13)-5
y-=12

# Two compact, aligned blocks for supporting qualifications.
column=(WIDTH-25)/2;left_y=section('教育经历','EDUCATION',y,LEFT,column);right_x=LEFT+column+25;right_y=section('证书与学习','CERTIFICATES',y,right_x,column)
for i in range(2):
    key=f'profile.education.{i}.zh.'
    line(CONTENT[key+'0'],LEFT,left_y,9.6,INK,True);left_y-=7
    left_y=para(CONTENT[key+'1'],LEFT,left_y,column,8.6,12.5,MUTED)-3
    left_y=para(CONTENT[key+'2'].replace('—','-'),LEFT,left_y,column,8.4,12,MUTED)-11
for cert in CONTENT['profile.certificates.zh']:
    right_y=para(cert,right_x,right_y+3,column,8.6,12.5,INK)-7
right_y=para(DATA['learning'],right_x,right_y,column,8.2,12,MUTED)
lowest=min(left_y,right_y)
if lowest<40:raise ValueError(f'Resume overflow: content ends at {lowest:.1f} pt')
c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(LEFT,32,RIGHT,32)
line('刘志 · 个人简历',LEFT,20,7.8,MUTED)
c.setFont('Latin',7.8);c.setFillColor(MUTED);c.drawRightString(RIGHT,20,'01 / 01')
c.showPage();c.save();print(f'Created {OUT}; lowest content {lowest:.1f} pt')
