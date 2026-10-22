from playwright.sync_api import sync_playwright
from pathlib import Path
import json, sys
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5190'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/q-amen');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for size,w,h in [('phone',390,844),('tablet',1180,820)]:
  for world in ['pond','grove']:
   c=b.new_context(viewport={'width':w,'height':h},service_workers='block',timezone_id='Europe/London');page=c.new_page();page.set_default_timeout(20000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'{base}/?demo=1&world={world}&h=6.75',wait_until='networkidle',timeout=60000)
   page.get_by_role('button',name='Pray',exact=True).click()
   for name in ['Begin','Read it again','Be still','Skip the quiet','Next','Next','Next','Amen']:
    page.get_by_role('button',name=name,exact=True).click()
   if world=='grove':page.locator('.compass-amen-grove canvas').wait_for()
   else:
    page.locator('.pz-koi').wait_for()
    page.wait_for_function('()=>{const c=document.querySelector(".pz-koi");const a=c.getContext("2d").getImageData(0,0,c.width,c.height).data;for(let i=3;i<a.length;i+=4)if(a[i]>40)return true;return false}',timeout=60000)
   assert page.locator('.compass-amen-grove canvas').evaluate('(c)=>c.getBoundingClientRect().height>100') if world=='grove' else True
   page.screenshot(path=str(out/f'{world}-amen-{size}-night.png'),timeout=60000,animations='disabled')
   page.get_by_role('button',name='Done',exact=True).click();page.locator('.world-'+world).wait_for()
   assert not errors,errors
   print(json.dumps({'world':world,'size':size,'amenAndReturn':'PASS','errors':errors}),flush=True)
   c.close()
 b.close()
