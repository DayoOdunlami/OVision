import asyncio,json,re,base64
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  try:
   page=await browser.new_page(viewport={'width':1180,'height':820})
   await page.route('**/brush-cache-proof',lambda r:r.fulfill(content_type='text/html',body='<html><body style="margin:0;background:#f1ecde"></body></html>'))
   before=(Path(__file__).resolve().parents[4]/'src/study/v1/brush.js').read_text().replace("from 'perfect-freehand'","from '/node_modules/.vite/deps/perfect-freehand.js'")
   await page.route('**/brush-before.js',lambda r:r.fulfill(content_type='text/javascript',body=before))
   await page.goto('http://localhost:5190/brush-cache-proof')
   data=await page.evaluate('''async()=>{
    const before=await import('/brush-before.js'),after=await import('/src/study/brush.js');
    let gradients=0;const native=CanvasRenderingContext2D.prototype.createRadialGradient;
    CanvasRenderingContext2D.prototype.createRadialGradient=function(...args){gradients++;return native.apply(this,args);};
    const W=1180,H=820,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
    const fixtures=[];
    const oval=(x,y,rx,ry,n)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return[x+Math.cos(a)*rx,y+Math.sin(a)*ry*(.88+.12*Math.cos(a))];});
    for(let fish=0;fish<3;fish++){
     let x=230+fish*340,y=190+(fish%2)*300;
     fixtures.push({p:oval(x,y,180,65,78),colour:['#6d8d93','#a7b7a1','#b1844a'][fish],alpha:.39,layers:4,seed:71+fish*100});
     for(let fin=0;fin<3;fin++)fixtures.push({p:oval(x+(fin-1)*75,y+(fin%2?85:-70),65,34,24),colour:'#86a89f',alpha:.13,layers:3,seed:72+fish*100+fin});
     fixtures.push({p:oval(x+38,y,33,25,12),colour:'#b56b46',alpha:.32,layers:3,seed:82+fish*100});
    }
    function draw(api,phase=0){
     ctx.clearRect(0,0,W,H);ctx.fillStyle='#f1ecde';ctx.fillRect(0,0,W,H);
     for(const f of fixtures){const polygon=f.p.map(([x,y],i)=>[x+Math.sin(i*.4+phase)*2,y+Math.cos(i*.3+phase)*2]);api.wash(ctx,polygon,f);}
    }
    draw(before);const beforeURL=c.toDataURL(),a=ctx.getImageData(0,0,W,H).data;
    draw(after);const afterURL=c.toDataURL(),b=ctx.getImageData(0,0,W,H).data;
    let sum=0,max=0,changed=0,over3=0;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<3;k++){const v=Math.abs(a[i+k]-b[i+k]);sum+=v;max=Math.max(max,v);d=Math.max(d,v);}if(d)changed++;if(d>3)over3++;}
    const first=c.toDataURL();draw(after);const deterministic=first===c.toDataURL();
    ctx.globalAlpha=.63;after.wash(ctx,fixtures[0].p,fixtures[0]);const callerAlpha=ctx.globalAlpha===.63;ctx.globalAlpha=1;
    const bench=api=>{gradients=0;const start=performance.now();for(let i=0;i<18;i++){draw(api,i*.08);ctx.getImageData(300,200,1,1);}return {ms:performance.now()-start,gradients};};
    bench(after);const beforePerf=bench(before),afterPerf=bench(after);
    return {beforeURL,afterURL,deterministic,callerAlpha,meanRGBError:sum/(W*H*3),maxChannelError:max,changedFraction:changed/(W*H),over3Fraction:over3/(W*H),beforePerf,afterPerf};
   }''')
   for key,label in [('beforeURL','before'),('afterURL','after')]:
    Path(f'/tmp/study-brush-cache-{label}.png').write_bytes(base64.b64decode(data.pop(key).split(',')[1]))
   Path('/tmp/study-brush-cache-results.json').write_text(json.dumps(data,indent=2));print(json.dumps(data),flush=True)
  finally:await browser.close()
asyncio.run(main())
