import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5190'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/q-ritual');out.mkdir(parents=True,exist_ok=True)
def live(page):
 return page.evaluate("JSON.parse(localStorage.getItem('qw.demo.v1')).seasons.find(s=>!s.end)")
def snap(page,label):
 page.screenshot(path=str(out/(label+'.png')),animations='disabled',timeout=60000)
 print(json.dumps({'label':label,'text':page.locator('body').inner_text(),'overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth+1')}),flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 errors=[]
 c=b.new_context(viewport={'width':390,'height':844},timezone_id='Europe/London',service_workers='block');page=c.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/?demo=1&world=pond&h=22#/season/new?person=ada&edit=1',wait_until='domcontentloaded',timeout=60000)
 room=page.get_by_role('dialog',name="Choose Ada's direction",exact=True);room.wait_for()
 room.get_by_label('My word',exact=True).fill('Ubuntu')
 room.get_by_label('Make room for',exact=True).fill('Ask who needs a friend')
 room.get_by_label('Leave behind',exact=True).fill('Leaving someone out')
 room.locator('summary').click();room.get_by_role('button',name='Belonging',exact=False).click()
 room.get_by_role('button',name='Continue',exact=True).click();snap(page,'real-phone-review-night')
 room.get_by_role('button',name='Save my direction',exact=True).click();page.wait_for_url('**#/board?person=ada')
 assert live(page)['compass']['people']['ada']['word']=='Ubuntu'
 page.reload(wait_until='domcontentloaded');page.get_by_role('button',name='Settings',exact=True).wait_for() if page.get_by_role('button',name='Settings',exact=True).count() else None
 assert live(page)['compass']['people']['ada']['word']=='Ubuntu'
 assert live(page)['compass']['people']['sam']['word']=='Steady'
 print('personal persisted after reload; other boards retained',flush=True);c.close()
 c=b.new_context(viewport={'width':1180,'height':820},timezone_id='Europe/London',service_workers='block');page=c.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/?demo=1&world=grove&h=12#/season/new',wait_until='domcontentloaded',timeout=60000)
 page.get_by_role('button',name='Choose our family’s direction',exact=False).click()
 page.get_by_label('A term, or the months ahead',exact=True).fill('Winter together')
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_label('Our word',exact=True).fill('Welcome')
 page.get_by_label('Make room for',exact=True).fill('A spare chair')
 page.get_by_label('Leave behind',exact=True).fill('Always being too busy')
 page.get_by_role('button',name='Continue',exact=True).click();snap(page,'real-tablet-family-review')
 page.get_by_role('button',name='Begin the season',exact=True).click();page.wait_for_url('**#/board')
 assert live(page)['name']=='Winter together';assert live(page)['compass']['family']['word']=='Welcome'
 assert live(page)['compass']['people']=={}
 print('direct family save archives previous season and needs no personal boards',flush=True);c.close()
 c=b.new_context(viewport={'width':1180,'height':820},timezone_id='Europe/London',service_workers='block');page=c.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/?demo=1&world=pond&h=12#/season/new',wait_until='domcontentloaded',timeout=60000)
 page.get_by_role('button',name='Pass the tablet round',exact=False).click();page.get_by_role('button',name='Continue',exact=True).click()
 for word,yes,no in [('Steady','Listen before answering','Rushing an answer'),('Welcome','Invite someone to join','Leaving someone out')]:
  page.get_by_label('My word',exact=True).fill(word);page.get_by_label('Make room for',exact=True).fill(yes);page.get_by_label('Leave behind',exact=True).fill(no)
  page.get_by_role('button',name='Continue',exact=True).click()
 for i in range(4):page.get_by_role('button',name='Not now',exact=True).click()
 snap(page,'real-tablet-gather')
 page.get_by_role('button',name='Choose our family word',exact=True).click()
 page.get_by_role('button',name='Jo Welcome',exact=False).click()
 assert page.get_by_label('Make room for',exact=True).input_value()=='Invite someone to join'
 assert page.get_by_label('Leave behind',exact=True).input_value()=='Leaving someone out'
 page.get_by_label('Make room for',exact=True).fill('A spare chair');page.get_by_label('Leave behind',exact=True).fill('Always being too busy')
 page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Begin the season',exact=True).click();page.wait_for_url('**#/board')
 assert live(page)['compass']['family']['word']=='Welcome';assert len(live(page)['compass']['people'])==2
 print(json.dumps({'pass-around-saved':live(page),'errors':errors}),flush=True)
 c.close();b.close()
