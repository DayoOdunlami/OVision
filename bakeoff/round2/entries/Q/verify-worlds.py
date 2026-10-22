"""Browser walkthrough. Run with a dev/preview URL and an output folder."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, re, sys
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5190'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/q-world-checks');out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 c=b.new_context(service_workers='block',timezone_id='Europe/London');page=c.new_page();page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def snap(name):
  # Hold the already-rendered canvas while reading pixels; resume immediately.
  # Actual motion has a separate native recording and cadence audit.
  page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
  try: page.screenshot(path=str(out/(name+'.png')),timeout=60000,animations='disabled')
  finally: page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
 def health(label):
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),label
  tiny=page.locator('.compass-screen button').evaluate_all('(els)=>els.filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute("aria-label")||e.innerText,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(r=>r.w<47.9||r.h<47.9)')
  assert not tiny,(label,tiny)
  results.append({'state':label,'errors':len(errors),'undersized':len(tiny)})
  print(label,'PASS',flush=True)
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  page.set_viewport_size({'width':w,'height':h})
  for world in ['pond','grove']:
   for light,hour in [('day',12),('night',22)]:
    page.goto(f'{base}/?demo=1&world={world}&h={hour}#/board',wait_until='networkidle',timeout=60000)
    page.get_by_role('heading',name='Rooted',exact=True).wait_for()
    snap(f'{world}-family-{size}-{light}');health(f'{world} family {size} {light}')
    page.get_by_role('button',name="Ada's board, Brave",exact=True).click()
    page.get_by_role('heading',name='Brave',exact=True).wait_for()
    snap(f'{world}-personal-{size}-{light}');health(f'{world} personal {size} {light}')
    page.get_by_role('button',name=re.compile('Our family')).click()
    page.get_by_role('button',name='Leave it open',exact=True).click()
    page.get_by_role('button',name='Show controls',exact=True).wait_for(state='visible')
    snap(f'{world}-glance-{size}-{light}')
    page.get_by_role('button',name='Show controls',exact=True).click()
    if world=='pond' and light=='day':
     page.get_by_role('button',name=re.compile('Choose a world')).click();snap(f'world-switch-{size}')
     page.get_by_role('button',name=re.compile('Grove')).click()
     page.locator('.world-grove').wait_for()
     page.reload(wait_until='networkidle');page.locator('.world-grove').wait_for()
   page.goto(f'{base}/?demo=1&world={world}&h=12',wait_until='networkidle',timeout=60000)
   page.get_by_role('heading',name='Rooted',exact=True).wait_for();snap(f'{world}-home-{size}');health(f'{world} home {size}')
 # Large text must be scrollable, with a reachable footer, including on a phone.
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  page.set_viewport_size({'width':w,'height':h})
  page.goto(f'{base}/?demo=1&world=grove&h=22#/board',wait_until='networkidle')
  page.evaluate("localStorage.setItem('qw.demo.device',JSON.stringify({...JSON.parse(localStorage.getItem('qw.demo.device')),textScale:2}))")
  page.reload(wait_until='networkidle');health(f'200 percent {size}');snap(f'grove-large-text-{size}')
  page.get_by_role('button',name='Review our words',exact=True).scroll_into_view_if_needed();page.get_by_role('button',name='Review our words',exact=True).click()
  page.get_by_role('dialog',name='Review our direction',exact=True).wait_for()
  snap(f'ritual-large-text-{size}')
 realSeed=page.evaluate("localStorage.getItem('qw.demo.v1')")
 # A household with no season gets an honest, usable empty board.
 page.goto(f'{base}/?demo=1&world=pond&h=12#/board',wait_until='networkidle')
 page.evaluate("const s=JSON.parse(localStorage.getItem('qw.demo.v1'));s.seasons=[];localStorage.setItem('qw.demo.v1',JSON.stringify(s));const d=JSON.parse(localStorage.getItem('qw.demo.device'));d.textScale=1;localStorage.setItem('qw.demo.device',JSON.stringify(d))")
 page.reload(wait_until='networkidle');page.get_by_role('heading',name='Our compass',exact=True).wait_for();health('empty season');snap('empty-season-tablet')
 page.get_by_role('button',name='Choose our words',exact=True).click();page.get_by_role('dialog',name='A new season together',exact=True).wait_for();snap('ritual-start-tablet')
 c.close()
 for world in ['pond','grove']:
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block',reduced_motion='reduce')
  page=c.new_page();page.goto(f'{base}/?demo=1&world={world}&h=12#/board',wait_until='networkidle',timeout=60000)
  page.get_by_role('heading',name='Rooted',exact=True).wait_for();snap(f'{world}-reduced-motion-phone');c.close()
 # Device choice also survives without a preview URL forcing the world.
 c=b.new_context(viewport={'width':390,'height':844},service_workers='block')
 c.add_init_script("localStorage.setItem('qw.v1',"+json.dumps(realSeed)+");sessionStorage.removeItem('qw.demo')")
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/?demo=0&h=12',wait_until='networkidle')
 page.get_by_role('button',name=re.compile('Choose a world')).click()
 page.get_by_role('button',name=re.compile('Grove')).click();page.locator('.world-grove').wait_for()
 page.evaluate("const u=new URL(location.href);u.searchParams.delete('world');history.replaceState(null,'',u)")
 page.reload(wait_until='networkidle');page.locator('.world-grove').wait_for()
 page.get_by_role('button',name='Season book',exact=True).click()
 page.get_by_role('button',name='Our living compass',exact=True).click();page.locator('.world-grove').wait_for()
 assert not errors,errors
 print('REAL DEVICE CHOICE AND ROOM ROUND TRIP PASS',flush=True)
 c.close();b.close()
(out/'browser-results.json').write_text(json.dumps(results,indent=2))
print('ALL WORLD WALKTHROUGHS PASS',flush=True)
