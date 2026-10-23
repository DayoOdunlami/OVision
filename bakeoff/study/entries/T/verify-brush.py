import json, sys
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:5190'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':760,'height':580})
 page.route('**/brush-proof',lambda route: route.fulfill(content_type='text/html',body='<html><body style="margin:0;background:#f4efe3"><canvas id="proof" width="760" height="580"></canvas></body></html>'))
 page.goto(base+'/brush-proof',wait_until='domcontentloaded')
 result=page.evaluate('''async () => {
 const {stroke,wash,paperTexture}=await import('/src/study/brush.js');
 const canvas=document.getElementById('proof'),ctx=canvas.getContext('2d');
 const curve=Array.from({length:45},(_,i)=>{const t=i/44;return [60+t*620,105+30*Math.sin(t*Math.PI*1.7), .2+.75*Math.sin(t*Math.PI)];});
 const ground=[[30,220],[100,180],[190,220],[280,155],[390,200],[500,140],[630,190],[740,175],[740,285],[20,285]];
 const draw=()=>{
 ctx.clearRect(0,0,760,580);ctx.fillStyle='#f4efe3';ctx.fillRect(0,0,760,580);ctx.drawImage(paperTexture(760,580),0,0);
 wash(ctx,ground,{colour:'#6e8a7c',seed:'mist',alpha:.3,layers:28});
 stroke(ctx,ground.slice(0,8),{width:1.8,seed:'hills',alpha:.8,dry:.6});
 stroke(ctx,curve,{width:7,seed:'one-nib',dry:.7});
 for(let k=0;k<8;k++){
  const blade=Array.from({length:20},(_,i)=>{const t=i/19;return [80+k*38+(10+k*2)*Math.sin(t*Math.PI/2),520-t*(110+(k%3)*35),.9*(1-t)+.04];});
  stroke(ctx,blade,{width:4.5,seed:'grass'+k,alpha:.85,dry:.5});
 }
 const body=Array.from({length:50},(_,i)=>{const t=i/49*Math.PI*2;return [540+Math.cos(t)*116,414+Math.sin(t)*37, .25+.6*(1-Math.abs(Math.cos(t)))];});
 wash(ctx,body,{colour:'#987353',seed:'fish',alpha:.25,layers:4});stroke(ctx,body,{width:2.4,seed:'fish',dry:.5});
 ctx.fillStyle='#3a3e37';ctx.font='14px Georgia';ctx.fillText('One nib · pressure and dry fibres',60,42);ctx.fillText('Layered, seeded wash · no animated grain',30,320);
 };
 draw(); const first=canvas.toDataURL();draw();const second=canvas.toDataURL();
 return {deterministic:first===second,alphaRestored:ctx.globalAlpha===1,canvas:[canvas.width,canvas.height]};
 }''')
 page.screenshot(path='/tmp/study-brush-proof.png',animations='disabled')
 assert result['deterministic'] and result['alphaRestored'],result
 print(json.dumps(result),flush=True);b.close()
