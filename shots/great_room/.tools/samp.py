import numpy as np, sys
from PIL import Image
im=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
for a in sys.argv[2:]:
    name,x0,y0,x1,y1=a.split(':'); x0,y0,x1,y1=map(int,(x0,y0,x1,y1))
    m=im[y0:y1,x0:x1].reshape(-1,3).mean(0)
    print(f'{name:14s} {m.round(0)} #{int(m[0]):02x}{int(m[1]):02x}{int(m[2]):02x}')
