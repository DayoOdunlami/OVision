"""Production browser checks, before/after plates and genuine touch input."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,time
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4170'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/study-t-sprint2/plates');out.mkdir(parents=True,exist_ok=True)
results=[]
def state(page):return page.evaluate('studyState()')
def settled(page):page.wait_for_function('window.studyState && !studyState().spreading && studyState().open%1===0 && (studyState().gardenOpen??0)%1===0')
def check(page,errors):
 assert not errors,errors
 tiny=page.locator('button').evaluate_all('(es)=>es.filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.innerText,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(e=>e.w<47.9||e.h<47.9)');assert not tiny,tiny
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
def paper(page):
 assert page.locator('#landscape').get_attribute('aria-hidden')=='true'
 assert page.locator('#landscape').evaluate('(c)=>{const a=c.getContext("2d").getImageData(0,0,c.width,c.height).data;for(let i=4;i<a.length;i+=4)if(a[i]!==a[0]||a[i+1]!==a[1]||a[i+2]!==a[2])return false;return true}')
def capture(page,name):page.screenshot(path=str(out/(name+'.png')),animations='disabled');print(name,'PASS',flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  for light,hour in [('day',12),('night',22)]:
   c=b.new_context(viewport={'width':w,'height':h},reduced_motion='reduce',has_touch=True,service_workers='block');page=c.new_page();page.set_default_timeout(30000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   for dial in ['ink','wash']:
    page.goto(f'{base}/study/?v=1&dial={dial}&h={hour}&intro=0',wait_until='networkidle');page.wait_for_function('window.studyState');assert page.locator('#garden-entry').count()==0
    check(page,errors);capture(page,f'before-{dial}-{size}-{light}')
   page.goto(f'{base}/study/?v=2&dial=ink&h={hour}&intro=0',wait_until='networkidle');settled(page);heads=state(page)['fish']
   for place in ['scroll','pond','garden']:
    if place!='scroll':
     page.locator('[data-dial="ink"]').click()
     if state(page)['place']!='scroll':page.locator('#back').click();settled(page)
     page.locator('#pond-entry' if place=='pond' else '#garden-entry').click();settled(page)
    for dial in ['paper','ink','wash','colour']:
     page.locator(f'[data-dial="{dial}"]').click();settled(page)
     s=state(page);assert s['place']==place and s['dial']==dial and s['light']==light;assert s['fish']==heads,'a dial/arrival replaced the held skeleton'
     check(page,errors)
     if dial=='paper':paper(page)
     capture(page,f'after-{place}-{dial}-{size}-{light}');results.append({'state':f'{place}-{dial}-{size}-{light}','sameHeldHeads':True,'pageErrors':0,'undersizedTargets':0})
   # Genuine touch: each object can be cleared by a child tapping its physical place.
   for ident in ['stone-1','stone-2','stone-3','thorn']:
    obj=page.locator(f'[data-object="{ident}"]');box=obj.bounding_box();page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
   assert state(page)['garden']['phase']=='ready';page.locator('#sow').click();assert state(page)['garden']['phase']=='complete'
   for dial in ['ink','wash','colour']:
    page.locator(f'[data-dial="{dial}"]').click();check(page,errors);capture(page,f'rooted-{dial}-{size}-{light}')
   page.locator('#back').click();settled(page);assert page.locator('#garden-entry').evaluate('(e)=>e===document.activeElement')
   page.locator('#pond-entry').click();settled(page);page.touchscreen.tap(w*.52,h*.53);page.wait_for_timeout(100);page.touchscreen.tap(w*.52,h*.53);assert len(state(page)['food'])==3
   page.keyboard.press('Escape');settled(page);assert state(page)['place']=='scroll'
   # Native dialog and keyboard dial remain usable.
   page.locator('[data-dial="ink"]').focus();page.keyboard.press('ArrowRight');assert state(page)['dial']=='wash'
   page.locator('#about').click();assert page.locator('#note').is_visible();page.keyboard.press('Escape');assert not page.locator('#note').is_visible()
   c.close()
 # Every switch really reaches the corresponding isolated implementation.
 c=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for switch in ['wet','pigment','birds','squash','fullsize','arrival','touch','garden']:
  place='pond' if switch in ['touch','fullsize'] else 'scroll'
  page.goto(f'{base}/study/?dial=ink&place={place}&h=6.75&off={switch}&intro=0',wait_until='networkidle');settled(page);s=state(page)
  assert s['switches'][switch] is False and sum(s['switches'].values())==7 and s['light']=='night'
  if switch=='garden':assert not page.locator('#garden-entry').count()
  if switch=='touch':
   page.mouse.dblclick(200,400,delay=80);assert state(page)['food']==[];assert not page.locator('#feed-koi').count()
  if switch=='fullsize':assert s['view']['sx']<.4 and s['view']['sy']==s['view']['sx']
  if switch=='squash':assert s['view']['sx']==s['view']['sy']
  if switch=='arrival':assert s['view']['ellipse'] is False
  check(page,errors);print('off='+switch,'PASS',flush=True)
 page.goto(base+'/study/?off=garden,wet,birds&place=garden&intro=0',wait_until='networkidle');settled(page);assert state(page)['place']=='scroll'
 # Keyboard-only clearing is a second, forgiving route through the same state.
 page.goto(base+'/study/?place=garden&dial=ink&h=12&intro=0',wait_until='networkidle');settled(page)
 for ident in ['stone-1','stone-2','stone-3','thorn']:
  page.locator(f'[data-object="{ident}"]').focus();page.keyboard.press('Enter')
 assert state(page)['garden']['phase']=='ready';page.locator('#sow').focus();page.keyboard.press('Enter');assert state(page)['garden']['phase']=='complete'
 # Existing entry still renders and its season room opens.
 page.goto(base+'/?demo=1&h=12',wait_until='networkidle');page.get_by_role('button',name='Play the verse',exact=True).wait_for();page.get_by_role('button',name='This season',exact=True).click();page.get_by_role('button',name='Begin a new season',exact=True).wait_for()
 c.close();b.close()
(out/'browser-results.json').write_text(json.dumps({'plates':results,'switches':8,'touchClearing':True,'doubleTapFeed':True,'keyboardClearing':True,'legacyApp':True},indent=2))
print('ALL REQUIRED PLATES AND FLOWS PASS',flush=True)
