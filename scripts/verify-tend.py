"""Browser checks for the built static book. Requires Python Playwright + Chromium.
Run npm run build, npm run preview -- --port 4173, then python scripts/verify-tend.py.
Screenshots are a separate, deliberate capture pass after functional checks.
"""
from playwright.sync_api import sync_playwright
import json, os, re
BASE=os.environ.get('TEND_URL','http://localhost:4173')
KEY='tend.household.v1'
results=[]
def check(label, condition):
 assert condition,label
 results.append(label)
 print('PASS',label,flush=True)
def stored(page): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
def go(page,query):
 page.goto(BASE+'/?'+query,wait_until='domcontentloaded')
 page.locator('main').wait_for()
def amen(page):
 page.get_by_role('button',name='Begin',exact=True).click()
 text=page.locator('.scripture-verse').inner_text()
 page.get_by_role('button',name='Pray for them',exact=True).click()
 for _ in range(3): page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('button',name='Carry it with you',exact=True).click()
 page.get_by_role('button',name='Amen',exact=True).click()
 page.get_by_role('heading',name='Amen.').wait_for()
 return text
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 page=context.new_page();page.set_default_timeout(20000)
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 go(page,'h=6')
 check('Fresh device has a clear setup and demonstration choice', page.get_by_role('button',name='Make it yours').is_visible() and page.get_by_role('button',name='Explore a household').is_visible())
 page.get_by_role('button',name='Make it yours').click()
 page.get_by_label('What shall we call your household?').fill('The Ash household')
 page.get_by_label('Who’s in your household?').fill('Alex\nRobin\nJamie')
 page.get_by_role('button',name='Begin your book').click()
 check('Three-person household can begin without a six-person assumption',len(stored(page)['household']['members'])==3)
 page.get_by_role('button',name=re.compile('Pray quietly')).click()
 check('One tap from Today opens prayer with a ready participant',page.get_by_role('button',name='Begin',exact=True).is_enabled())
 verse1=amen(page)
 data=stored(page);check('Quiet Amen saves only the one actual participant',len(data['sessions'])==1 and len(data['sessions'][0]['participants'])==1 and len(data['practices'])==0)
 page.get_by_role('button',name='Back to Today',exact=True).click()
 check('Morning Amen leaves Gather and pray available',page.get_by_role('button',name=re.compile('Gather & pray')).is_enabled())
 page.get_by_role('button',name=re.compile('Gather & pray')).click()
 page.get_by_role('button',name=re.compile('Alex')).click()
 verse2=amen(page)
 data=stored(page)
 check('Evening uses the same immutable verse',verse1==verse2)
 check('Evening records two other people in a second sitting',len(data['sessions'])==2 and len(data['sessions'][1]['participants'])==2 and set(data['sessions'][0]['participants']).isdisjoint(data['sessions'][1]['participants']))
 page.get_by_role('button',name='Back to Today',exact=True).click()
 page.get_by_role('button',name=re.compile('Pray quietly')).click()
 check('Return to solo restores one participant',page.locator('.solo-person select').input_value() in data['sessions'][0]['participants'])
 go(page,'view=season&edit=1&h=12')
 page.get_by_label('One word to grow towards').fill('Listen')
 page.get_by_role('button',name='Keep this season').click()
 page.reload(wait_until='domcontentloaded');page.locator('main').wait_for()
 check('Season changes and its previous season survive reload',stored(page)['board']['word']=='Listen' and len(stored(page)['seasons'])==1)
 go(page,'view=garden&h=22')
 page.get_by_role('button',name='Feed the koi').click()
 check('Feeding is available at phone size',page.get_by_role('button',name='Feed the koi').is_visible())
 for view in ['today','prayer','release','garden','season','household','rest']:
  go(page,'view='+view+'&h=22')
  page.evaluate("document.documentElement.style.fontSize='32px'")
  check('200% text reflows: '+view,page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  page.evaluate("document.documentElement.style.fontSize=''")
 check('No unhandled browser errors in the household story',not errors)
 context.close();browser.close()
print(json.dumps({'passed':results},indent=2))
