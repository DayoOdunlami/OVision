import asyncio,json,base64,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/study-t/motion');OUT.mkdir(parents=True,exist_ok=True)
async def probe(page,duration=3000):
 return await page.evaluate('''async duration=>{const c=document.querySelector('#landscape'),cx=c.getContext('2d'),before=studyState(),a=cx.getImageData(0,0,c.width,c.height).data;let prev=performance.now(),start=prev;const ts=[];await new Promise(resolve=>{function f(t){ts.push(t-prev);prev=t;if(t-start>=duration)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);});const b=cx.getImageData(0,0,c.width,c.height).data,after=studyState();let changed=0,n=0;for(let i=0;i<a.length;i+=16){n++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;}const t=ts.slice(1).sort((a,b)=>a-b),mean=t.reduce((a,b)=>a+b)/t.length;return{before,after,fps:1000/mean,p95Ms:t[Math.floor(t.length*.95)],changedFraction:changed/n,headDisplacements:after.fish.map((f,i)=>Math.hypot(f.x-before.fish[i].x,f.y-before.fish[i].y))};}''',duration)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=await browser.new_context(viewport={'width':1180,'height':820},reduced_motion='reduce',device_scale_factor=1)
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://localhost:5190/study/?dial=ink&h=12&intro=0',wait_until='networkidle');await page.wait_for_function('window.studyState && studyState().reduced')
  pixels=await page.evaluate('''async()=>{
   const{default:Fish,buildPondMixFromCounts}=await import('/src/app/pond/SpineFish.js');const{createMotionContext,createNativeFishPainter}=await import('/src/study/fish.js');
   const originalRandom=Math.random,own=Object.hasOwn(performance,'now'),oldNow=performance.now;
   const seeded=seed=>{let s=seed;return()=>{s=Math.imul(s,1664525)+1013904223|0;return(s>>>0)/4294967296;};};
   const records=[];let images;
   try{performance.now=()=>60000;
    for(const density of [1,1.5])for(const name of ['chagoi','kohaku','showa']){
     const variety={...buildPondMixFromCounts({[name]:1})[0]};variety.sizeScale*=.6;
     const make=()=>{Math.random=seeded(800);const f=new Fish(1180,820,variety);f.shift(590-f.head.x,410-f.head.y);const hidden=createMotionContext();for(let t=0;t<72;t++){Math.random=seeded(1000+t);f.update(1180,820,{x:-9999,y:-9999});f.draw(hidden);}return f;};
     const direct=make(),tight=make(),padding=250;
     const surface=()=>{const c=document.createElement('canvas');c.width=1680*density;c.height=1320*density;const ctx=c.getContext('2d');ctx.setTransform(density,0,0,density,padding*density,padding*density);return[c,ctx];};
     const[ac,ax]=surface(),[bc,bx]=surface();direct.draw(ax);createNativeFishPainter(bx,{density,padding})(tight);
     const a=ax.getImageData(0,0,ac.width,ac.height).data,b=bx.getImageData(0,0,bc.width,bc.height).data;
     let max=0,changed=0,over1=0,nonzero=0,alphaMax=0;for(let i=0;i<a.length;i+=4){let delta=0;for(let j=0;j<4;j++){const d=Math.abs(a[i+j]-b[i+j]);max=Math.max(max,d);delta=Math.max(delta,d);if(j===3)alphaMax=Math.max(alphaMax,d);}if(delta)changed++;if(delta>1)over1++;if(a[i+3]||b[i+3])nonzero++;}
     records.push({name,density,maxChannelDelta:max,maxAlphaDelta:alphaMax,changedPixels:changed,pixelsOver1:over1,nonzeroPixels:nonzero});
     if(density===1&&name==='kohaku')images={direct:ac.toDataURL(),tight:bc.toDataURL()};
    }
    return{records,images};
   }finally{Math.random=originalRandom;if(own)performance.now=oldNow;else delete performance.now;}
  }''')
  for name,data in pixels.pop('images').items():(OUT/f'native-{name}.png').write_bytes(base64.b64decode(data.split(',')[1]))
  (OUT/'native-pixel-comparison.json').write_text(json.dumps(pixels,indent=2));print('PIXELS '+json.dumps(pixels),flush=True)
  result={'probes':[],'errors':errors}
  for size in [(390,844),(1180,820)]:
   await page.set_viewport_size({'width':size[0],'height':size[1]});await page.emulate_media(reduced_motion='no-preference')
   await page.goto('http://localhost:5190/study/?dial=colour&place=pond&h=12&intro=0',wait_until='networkidle');await page.wait_for_function('window.studyState && !studyState().reduced');await page.wait_for_timeout(500)
   r=await probe(page,4000);r.update({'size':size,'mode':'normal-colour'});result['probes'].append(r)
   await page.emulate_media(reduced_motion='reduce');await page.wait_for_function('studyState().reduced');await page.wait_for_timeout(200)
   r=await probe(page,1100);r.update({'size':size,'mode':'reduced-settled'});result['probes'].append(r)
  (OUT/'post-tight-audit.json').write_text(json.dumps(result,indent=2));print('PERF '+json.dumps(result),flush=True)
  await context.close()
  video_context=await browser.new_context(viewport={'width':1180,'height':820},device_scale_factor=1,record_video_dir=str(OUT),record_video_size={'width':1180,'height':820},reduced_motion='no-preference')
  page=await video_context.new_page();await page.goto('http://localhost:5190/study/?dial=ink&h=12&intro=0',wait_until='networkidle');await page.wait_for_timeout(400)
  for selector,wait in [('#pond-entry',2200),('[data-dial="wash"]',2500),('[data-dial="colour"]',3000),('[data-dial="ink"]',2200),('#back',2200),('[data-dial="wash"]',2200),('[data-dial="paper"]',1500),('[data-dial="ink"]',1500)]:
   await page.locator(selector).click(force=True,no_wait_after=True);await page.wait_for_timeout(wait)
  video=page.video;await video_context.close();path=await video.path();os.replace(path,OUT/'study-transition-dial-native-final.webm');await browser.close();print('CLOSED',flush=True)
asyncio.run(main())
