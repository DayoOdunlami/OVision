"""Native motion, actual touch drags, live reduced motion and unedited recordings."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4170'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/study-t-sprint2/native');out.mkdir(parents=True,exist_ok=True)
result={'probes':[],'errors':[]}
def settled(page):page.wait_for_function('window.studyState && !studyState().spreading && studyState().open%1===0 && studyState().gardenOpen%1===0')
def probe(page):
 return page.evaluate('''async()=>{const before=studyState(),times=[];let previous=performance.now();await new Promise(resolve=>{const start=previous;function f(t){times.push(t-previous);previous=t;if(t-start>=1700)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);});const after=studyState(),a=times.slice(1).sort((a,b)=>a-b);return{fps:1000/(a.reduce((x,y)=>x+y,0)/a.length),p95Ms:a[Math.floor(a.length*.95)],displacements:after.fish.map((f,i)=>Math.hypot(f.x-before.fish[i].x,f.y-before.fish[i].y))};}''')
def touch_drag(page,item,dy=90,hold=900):
 cdp=page.context.new_cdp_session(page);x=item.get('hitX',item['x']);y=item.get('hitY',item['y'])
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for i in range(1,13):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-dy*i/12}]});page.wait_for_timeout(35)
 page.wait_for_timeout(hold)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=True,service_workers='block');page=c.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)))
  for hour in [12,22]:
   for dial in ['ink','wash','colour']:
    page.goto(f'{base}/study/?dial={dial}&place=pond&h={hour}&intro=0',wait_until='networkidle');settled(page)
    r=probe(page);r.update({'size':size,'hour':hour,'dial':dial});assert any(n>.1 for n in r['displacements']),r;result['probes'].append(r);print(size,hour,dial,round(r['fps'],1),'fps',flush=True)
   page.emulate_media(reduced_motion='reduce');page.wait_for_function('studyState().reduced');page.wait_for_timeout(100)
   before=page.locator('#landscape').evaluate('(c)=>c.toDataURL()');heads=page.evaluate('studyState().fish');page.wait_for_timeout(450)
   assert page.evaluate('studyState().fish')==heads;assert page.locator('#landscape').evaluate('(c)=>c.toDataURL()')==before
   page.locator('[data-dial="ink"]').click();assert page.evaluate('studyState().fish')==heads
   page.emulate_media(reduced_motion='no-preference');page.wait_for_function('!studyState().reduced')
  # Genuine upward touch drags, including roots held under tension.
  page.goto(base+'/study/?dial=wash&place=garden&h=12&intro=0',wait_until='networkidle');settled(page)
  touch_drag(page,page.evaluate('studyState().garden.stones[0]'),80,150);assert page.evaluate('studyState().garden.stones[0].cleared')
  touch_drag(page,page.evaluate('studyState().garden.thorn'),95,1000);assert page.evaluate('studyState().garden.thorn.cleared')
  # Reduced-motion dragging needs no timed physics loop.
  page.emulate_media(reduced_motion='reduce');page.goto(base+'/study/?dial=ink&place=garden&h=22&intro=0',wait_until='networkidle');settled(page)
  touch_drag(page,page.evaluate('studyState().garden.thorn'),95,0);assert page.evaluate('studyState().garden.thorn.cleared')
  c.close()
 # Normal wet reveal, interrupted changes and its independent off switch.
 c=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=c.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.goto(base+'/study/?dial=ink&h=12&intro=0',wait_until='networkidle');settled(page)
 page.locator('[data-dial="wash"]').click();page.wait_for_function('studyState().spreading');page.wait_for_timeout(500);page.screenshot(path=str(out/'wet-spread-mid.png'));page.locator('[data-dial="colour"]').click();page.wait_for_timeout(130);page.locator('[data-dial="paper"]').click();settled(page);assert page.evaluate('studyState().dial')=='paper'
 page.goto(base+'/study/?dial=ink&off=wet&h=12&intro=0',wait_until='networkidle');settled(page);page.locator('[data-dial="wash"]').click();assert page.evaluate('!studyState().spreading');page.wait_for_timeout(1700);c.close()
 # Two untouched native recordings, with actual touch input.
 for destination in ['pond','garden']:
  c=b.new_context(viewport={'width':1180,'height':820},has_touch=True,service_workers='block',record_video_dir=str(out),record_video_size={'width':1180,'height':820});page=c.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:result['errors'].append(str(e)))
  page.goto(base+'/study/?dial=ink&h=12&intro=0',wait_until='networkidle');settled(page);page.wait_for_timeout(450)
  page.locator('#'+destination+'-entry').click();settled(page)
  if destination=='pond':
   page.touchscreen.tap(610,430);page.wait_for_timeout(500);page.touchscreen.tap(650,430);page.wait_for_timeout(100);page.touchscreen.tap(650,430);assert len(page.evaluate('studyState().food'))==3
   page.locator('[data-dial="wash"]').click();settled(page);page.wait_for_timeout(700);page.locator('[data-dial="colour"]').click();settled(page);page.wait_for_timeout(1000)
  else:
   touch_drag(page,page.evaluate('studyState().garden.stones[0]'),90,180)
   for ident in ['stone-2','stone-3']:
    r=page.locator(f'[data-object="{ident}"]').bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2)
   touch_drag(page,page.evaluate('studyState().garden.thorn'),95,1000);assert page.evaluate('studyState().garden.phase')=='ready'
   page.locator('[data-dial="wash"]').click();settled(page);page.locator('#sow').click();page.wait_for_function('studyState().garden.phase==="complete"',timeout=45000);page.screenshot(path=str(out/'rooted-normal-tablet.png'));page.wait_for_timeout(1400)
  page.locator('#back').click();settled(page);page.wait_for_timeout(500)
  video=page.video;c.close();video.save_as(str(out/(destination+'-arrival-native.webm')));Path(video.path()).unlink(missing_ok=True)
 assert not result['errors'],result['errors'];b.close()
result.update({'liveReducedMotion':'pixel and pose identical at both sizes/lights','normalTouchDrags':True,'reducedTouchDrag':True,'wetInterrupted':True,'wetOff':True})
(out/'motion-results.json').write_text(json.dumps(result,indent=2));print('NATIVE MOTION, TOUCH DRAGS, LIVE REDUCED MOTION AND BOTH RECORDINGS PASS',flush=True)
