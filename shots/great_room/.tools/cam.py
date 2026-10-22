import numpy as np, sys
W=1789
CAM=dict(pos=[3.225,1.422,-2.600], yaw=127.46, f=1271.8, cy=499.6, s=1.0725)
def basis():
    th=np.deg2rad(CAM['yaw']); F=np.array([np.cos(th),0,np.sin(th)]); U=np.array([0,1.,0]); R=np.cross(F,U); return np.array(CAM['pos']),F,U,R
def proj(P):
    C,F,U,R=basis(); d=np.array(P,float)-C; z=d@F
    return np.array([W/2+CAM['f']*(d@R)/z, CAM['cy']-CAM['f']*CAM['s']*(d@U)/z])
def bp(u,v,axis,val):
    C,F,U,R=basis(); d=F+R*(u-W/2)/CAM['f']-U*(v-CAM['cy'])/(CAM['f']*CAM['s'])
    i={'x':0,'y':1,'z':2}[axis]; t=(val-C[i])/d[i]; return C+t*d
if __name__=='__main__':
    for a in sys.argv[1:]:
        if a.startswith('bp:'):
            _,u,v,ax,val=a.split(':'); print(a,'->',bp(float(u),float(v),ax,float(val)).round(3))
        else:
            n,xyz=a.split('='); print(n, proj([float(t) for t in xyz.split(',')]).round(0))
