"""The study's local browser checks and static plates; pass URL and output folder."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5190'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/study-t/plates');out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  for light,hour in [('day',12),('night',22)]:
   context=browser.new_context(viewport={'width':w,'height':h},service_workers='block',reduced_motion='reduce')
   page=context.new_page();page.set_default_timeout(30000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'{base}/study/?dial=ink&h={hour}&intro=0',wait_until='networkidle',timeout=60000)
   page.wait_for_function('window.studyState')
   pose=page.evaluate('window.studyState().fish')
   for place in ['scroll','pond']:
    if place=='pond':
     page.locator('[data-dial="ink"]').click();page.locator('#pond-entry').click()
     page.wait_for_function('window.studyState().open===1')
     assert page.evaluate('window.studyState().fish')==pose,'pond transition recreated or moved a frozen skeleton'
    for dial in ['paper','ink','wash','colour']:
     page.locator(f'[data-dial="{dial}"]').click()
     page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
     s=page.evaluate('window.studyState()');assert s['dial']==dial and s['place']==place and s['light']==light,s
     assert s['fish']==pose,'dial changed the frozen skeleton'
     tiny=page.locator('button').evaluate_all('(els)=>els.filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.innerText,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(e=>e.w<47.9||e.h<47.9)')
     assert not tiny,tiny
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     if dial=='paper':
      assert page.locator('#landscape').get_attribute('aria-hidden')=='true'
      assert page.locator('#landscape').evaluate('(c)=>{const a=c.getContext("2d").getImageData(0,0,c.width,c.height).data;for(let i=4;i<a.length;i+=4)if(a[i]!==a[0]||a[i+1]!==a[1]||a[i+2]!==a[2])return false;return true}'),'Paper contains painted world pixels'
     assert not errors,errors
     name=f'{place}-{dial}-{size}-{light}'
     page.screenshot(path=str(out/(name+'.png')),animations='disabled',timeout=60000)
     results.append({'state':name,'pageErrors':0,'undersizedTargets':0,'samePose':True})
     print(name,'PASS',flush=True)
   page.locator('#back').click();page.wait_for_function('window.studyState().open===0')
   assert page.evaluate('window.studyState().fish')==pose
   page.locator('[data-dial="ink"]').focus();page.keyboard.press('ArrowRight');page.wait_for_function('window.studyState().dial==="wash"')
   page.locator('#about').click();assert page.locator('#note').is_visible();page.keyboard.press('Escape');assert not page.locator('#note').is_visible()
   context.close()
 # Deep links resolve independently, including Paper and the 06:45 night.
 c=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',service_workers='block');page=c.new_page()
 page.goto(base+'/study/?dial=paper&place=pond&h=6.75&intro=0',wait_until='networkidle')
 assert page.evaluate('window.studyState().dial==="paper"&&window.studyState().place==="pond"&&window.studyState().light==="night"')
 # Existing app remains at its original entry and routes.
 page.goto(base+'/?demo=1&h=12',wait_until='networkidle');page.get_by_role('button',name='Play the verse',exact=True).wait_for()
 page.get_by_role('button',name='This season',exact=True).click();page.get_by_role('button',name='Begin a new season',exact=True).wait_for()
 c.close();browser.close()
(out/'browser-results.json').write_text(json.dumps(results,indent=2))
print('32 PLATES, UNIFORM PAPER, SAME POSE, TARGETS, KEYBOARD, CLOCK, BACK AND EXISTING APP PASS',flush=True)
