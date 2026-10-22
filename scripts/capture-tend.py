"""Capture the built entry's eight moments at both sizes and light settings."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'bakeoff/entries/B/screens/after'
OUT.mkdir(parents=True,exist_ok=True)
BASE='http://localhost:4173'
shots=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for label,width,height in [('phone',390,844),('tablet',1180,820)]:
  for light,hour in [('day',12),('night',22)]:
   c=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1,service_workers='block',timezone_id='Europe/London',reduced_motion='no-preference')
   page=c.new_page();page.set_default_timeout(20000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def capture(number,view,extra='',prepare=None):
    page.goto(f'{BASE}/?demo=1&view={view}&h={hour}'+extra,wait_until='domcontentloaded')
    page.locator('main').wait_for()
    if view in ['today','garden','rest','season'] and 'edit=1' not in extra:page.locator('.garden-scene > svg').first.wait_for()
    if prepare:prepare()
    page.evaluate('document.fonts.ready')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(label,light,number,'overflow')
    path=OUT/f'{label}-{light}-{number}.png'
    page.screenshot(path=str(path),full_page=True,animations='disabled',timeout=15000)
    shots.append({'file':path.name,'errors':list(errors)})
    print(path.name,flush=True)
   capture('00-today','today')
   capture('01','prayer','&mode=solo&step=1')
   def start_game():
    page.locator('.game-start button').click()
    page.get_by_role('dialog',name='Words to carry.').wait_for()
    # Reduced motion supplies the still word bank; normal physics is tested separately.
    button=page.get_by_role('button',name='Let the words fall')
    if button.count():button.click()
    else:page.get_by_role('button',name='Mix the words').click()
    page.wait_for_timeout(900)
   capture('02','play','&mode=together',prepare=start_game)
   capture('03','prayer','&mode=together&day=sunday')
   capture('04','rest')
   capture('05','release')
   def child_stone():
    page.get_by_role('button',name='With children').click()
    page.get_by_role('button',name='Ask for forgiveness').click()
   capture('05-child','release',prepare=child_stone)
   capture('06','garden')
   capture('07','season','&edit=1')
   page.evaluate('localStorage.clear();sessionStorage.clear()')
   page.goto(f'{BASE}/?h={hour}',wait_until='domcontentloaded')
   page.get_by_role('button',name='Make it yours').wait_for()
   page.locator('.garden-scene > svg').wait_for()
   page.evaluate('document.fonts.ready')
   path=OUT/f'{label}-{light}-08.png'
   page.screenshot(path=str(path),full_page=True,animations='disabled',timeout=15000)
   shots.append({'file':path.name,'errors':list(errors)})
   print(path.name,flush=True)
   c.close()
 b.close()
assert all(not s['errors'] for s in shots),shots
(OUT/'capture-receipt.json').write_text(json.dumps(shots,indent=2)+'\n')
print(f'{len(shots)} screenshots, no browser errors',flush=True)
