import sys, numpy as np
from PIL import Image, ImageFilter
ours=Image.open(sys.argv[1]).convert('RGB'); ref=Image.open(sys.argv[4] if len(sys.argv)>4 else 'gr_ref.png').convert('RGB')
mode=sys.argv[3] if len(sys.argv)>3 else 'edges'
if mode=='blend':
    Image.blend(ref,ours,0.5).save(sys.argv[2]); sys.exit()
e=np.asarray(ours.convert('L').filter(ImageFilter.FIND_EDGES)).astype(float)>14
r=np.asarray(ref).astype(float)*0.75
er=np.asarray(ref.convert('L').filter(ImageFilter.FIND_EDGES)).astype(float)>40
r[er]=r[er]*0.4+np.array([0,200,255])*0.6
r[e]=[255,30,30]
Image.fromarray(r.astype(np.uint8)).save(sys.argv[2])
