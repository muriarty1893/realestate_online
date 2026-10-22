import sys
from PIL import Image, ImageDraw, ImageFont
src,x0,y0,x1,y1,sc,out=sys.argv[1],*map(int,sys.argv[2:6]),float(sys.argv[6]),sys.argv[7]
step=int(sys.argv[8]) if len(sys.argv)>8 else 50
im=Image.open(src).convert('RGB').crop((x0,y0,x1,y1))
im=im.resize((int((x1-x0)*sc),int((y1-y0)*sc)),Image.LANCZOS)
d=ImageDraw.Draw(im)
try: f=ImageFont.truetype('/usr/share/fonts/TTF/DejaVuSans.ttf',12)
except: f=ImageFont.load_default()
if step>0:
  for x in range((x0//step+1)*step,x1,step):
    X=(x-x0)*sc; d.line([(X,0),(X,im.height)],fill=(255,0,0),width=1); d.text((X+2,2),str(x),fill=(255,255,0),font=f)
  for y in range((y0//step+1)*step,y1,step):
    Y=(y-y0)*sc; d.line([(0,Y),(im.width,Y)],fill=(255,0,0),width=1); d.text((2,Y+2),str(y),fill=(255,255,0),font=f)
im.save(out)
