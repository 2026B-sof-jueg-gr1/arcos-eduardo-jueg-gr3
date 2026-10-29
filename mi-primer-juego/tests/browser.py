"""Real Chromium + Phaser Arcade integration tests.
Start `python3 -m http.server 8080` at repository root first.
Requires Python playwright and Chromium. CIMA_URL can target a deployed build.
Only ?qa=1 exposes the scene. The 25-jump route never changes player coordinates.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('CIMA_URL', 'http://127.0.0.1:8080/mi-primer-juego/')
OUT = Path(os.environ.get('CIMA_TEST_OUTPUT', '/workspace/work/cima-tests'))
OUT.mkdir(parents=True, exist_ok=True)
HARNESS = '''() => {
 const {game,scene:s,PLATFORMS}=__CIMA__;game.loop.stop();let clock=performance.now();
 const step=(n=1)=>{for(let i=0;i<n;i++){clock+=1000/60;game.headlessStep(clock,1000/60);}};
 const key=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true,cancelable:true}));
 const reset=()=>{document.activeElement?.blur();s.startRun();step(5);};
 const jumpTo=(i)=>{
 const target=PLATFORMS[i],dir=Math.sign(target.x-s.player.x),launch=target.x-dir*208;
 const walkDir=Math.sign(launch-s.player.x),walkKey=walkDir>0?'ArrowRight':'ArrowLeft';key(walkKey,true);
 let n=0;while(Math.abs(launch-s.player.x)>2.6&&n++<150)step();key(walkKey,false);step();
 if(n>=150)throw Error('Cannot reach takeoff '+i);
 const jumpKey=dir>0?'ArrowRight':'ArrowLeft';key(jumpKey,true);key('Space',true);step(49);key('Space',false);step(2);
 let flight=0;while(!(s.player.body.blocked.down&&s.lastPlatform===i)&&s.state==='playing'&&flight++<140)step();key(jumpKey,false);step();
 if(s.lastPlatform!==i)throw Error('Missed platform '+i+' at '+s.player.x+','+s.player.y);
 return {platform:i,x:s.player.x,y:s.player.y,jumps:s.jumps,zone:s.zone};
 };
 window.qa={s,game,step,key,reset,jumpTo,render:()=>{for(let i=0;i<30;i++)game.step(clock+i*17,1000/60);}};
 reset();return s.state;
}'''
checks = []
def check(name, value):
 assert value, name
 checks.append(name)
 print('PASS', name, flush=True)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':1150},has_touch=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 # Exercise the offline fallback rather than relying on the CDN in every test.
 page.route('https://cdn.jsdelivr.net/**',lambda r:r.abort())
 page.goto(BASE+'?qa=1');page.wait_for_function('window.__CIMA__')
 check('start screen and local Phaser 3.90.0 fallback',page.evaluate("__CIMA__.scene.state==='ready' && Phaser.VERSION==='3.90.0'") )
 page.screenshot(path=str(OUT/'desktop-start.png'),full_page=True)
 page.click('#primary');check('start begins the run',page.evaluate(HARNESS)=='playing')
 check('ground movement and alternate key aliases',page.evaluate('''()=>{const{key,step,s}=qa;let x=s.player.x;key('ArrowRight',true);key('KeyD',true);step(10);key('ArrowRight',false);step(10);key('KeyD',false);step(2);return s.player.x>x+45&&s.player.body.velocity.x===0;}'''))
 heights=page.evaluate('''()=>{let result=[];for(const n of [3,49]){qa.reset();qa.key('Space',true);qa.step(n);qa.key('Space',false);qa.step(2);let top=qa.s.player.y;for(let i=0;i<70;i++){qa.step();top=Math.min(top,qa.s.player.y);}result.push(3240-top);}return result;}''')
 check('long charge jumps higher than short charge',heights[1]>heights[0]+100)
 check('direction stays locked in the air',page.evaluate('''()=>{qa.reset();qa.key('ArrowRight',true);qa.key('Space',true);qa.step(49);qa.key('Space',false);qa.step(3);qa.key('ArrowRight',false);qa.key('ArrowLeft',true);let x=qa.s.player.x;qa.step(10);qa.key('ArrowLeft',false);return qa.s.player.x>x+35&&qa.s.player.body.velocity.x===250;}'''))
 check('pause freezes position and timer and cancels charge',page.evaluate('''()=>{qa.reset();qa.key('Space',true);qa.step(20);qa.key('Escape',true);qa.key('Escape',false);let x=qa.s.player.x,y=qa.s.player.y,t=qa.s.elapsed;qa.step(120);const frozen=qa.s.state==='paused'&&qa.s.player.x===x&&qa.s.player.y===y&&qa.s.elapsed===t;qa.key('Space',false);qa.key('Escape',true);qa.key('Escape',false);qa.step(3);return frozen&&qa.s.state==='playing'&&!qa.s.charging&&qa.s.jumps===0;}'''))
 check('restart asks first, cancel resumes, confirm clears run',page.evaluate('''()=>{qa.key('KeyR',true);qa.key('KeyR',false);let asked=!document.querySelector('#overlay').hidden&&qa.s.state==='paused';document.querySelector('#secondary').click();const canceled=qa.s.state==='playing';qa.key('KeyR',true);qa.key('KeyR',false);document.querySelector('#primary').click();qa.step(3);return asked&&canceled&&qa.s.elapsed<100&&qa.s.jumps===0&&qa.s.falls===0&&qa.s.player.x===120;}'''))
 # A deliberate fall after ten genuine jumps verifies losing altitude without a checkpoint.
 fall=page.evaluate('''()=>{qa.reset();for(let i=1;i<=10;i++)qa.jumpTo(i);const before=qa.s.zone;qa.key('ArrowLeft',true);qa.step(37);qa.key('ArrowLeft',false);qa.step(150);return {before,after:qa.s.zone,falls:qa.s.falls,y:qa.s.player.y};}''')
 check('fall loses zones and does not respawn at a checkpoint',fall['falls']>=1 and fall['after']<fall['before'] and fall['y']>2040)
 # Isolated wall/underside fixtures, separate from the unmodified full route.
 check('solid underside blocks upward travel',page.evaluate('''()=>{qa.reset();qa.s.player.body.reset(300,3240);qa.step(3);qa.key('Space',true);qa.step(49);qa.key('Space',false);let top=3240;for(let i=0;i<60;i++){qa.step();top=Math.min(top,qa.s.player.body.top);}return top>=3143;}'''))
 check('world edge bounces airborne horizontal velocity',page.evaluate('''()=>{qa.reset();qa.s.player.body.reset(775,3020);qa.s.airVX=250;qa.s.player.setVelocity(250,-100);qa.step(15);return qa.s.player.body.velocity.x<0&&qa.s.player.body.right<=800;}'''))
 route=page.evaluate('''()=>{qa.reset();const route=[];for(let i=1;i<=25;i++)route.push(qa.jumpTo(i));qa.render();return {route,state:qa.s.state,jumps:qa.s.jumps,falls:qa.s.falls,elapsed:qa.s.elapsed,camera:qa.s.cameras.main.scrollY,record:localStorage.getItem('cima.best.v1')};}''')
 check('25 consecutive real jumps reach victory across five zones',route['state']=='won' and route['jumps']==25 and route['falls']==0 and set(x['zone'] for x in route['route'])=={0,1,2,3,4})
 check('camera follows to summit and winning time persists',route['camera']<500 and float(route['record'])>0)
 page.screenshot(path=str(OUT/'desktop-victory.png'),full_page=True)
 check('victory replay has no stale win state',page.evaluate('''()=>{document.querySelector('#primary').click();qa.step(5);return qa.s.state==='playing'&&qa.s.jumps===0&&qa.s.falls===0&&qa.s.highestZone===0&&qa.s.player.x===120&&qa.s.player.y===3240&&!document.querySelector('#toast').classList.contains('show');}'''))
 check('window blur pauses and releases controls',page.evaluate('''()=>{qa.key('ArrowRight',true);qa.key('Space',true);window.dispatchEvent(new Event('blur'));qa.step(5);return qa.s.state==='paused'&&!__CIMA__.input.right&&!__CIMA__.input.jump&&!qa.s.charging;}'''))
 # Real pointer events on mobile controls; no scene or input-field mutation.
 page.set_viewport_size({'width':390,'height':844});page.click('#primary')
 check('mobile layout has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 cdp=page.context.new_cdp_session(page)
 def touch(selector, event):
  box=page.locator(selector).bounding_box()
  cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2,'id':1}] if event=='touchStart' else []})
 touch('[data-touch="jump"]','touchStart')
 page.evaluate('qa.step(49)')
 touch('[data-touch="jump"]','touchEnd')
 page.evaluate('qa.step(3)')
 check('touch hold and release launches a jump',page.evaluate('qa.s.jumps===1&&qa.s.player.body.velocity.y<0'))
 touch('[data-touch="left"]','touchStart')
 touch('[data-touch="left"]','touchCancel')
 check('canceled pointer releases its direction',page.evaluate('!__CIMA__.input.left'))
 page.evaluate('qa.render()')
 page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 check('no browser JavaScript errors',not errors)
 (OUT/'results.json').write_text(json.dumps({'checks':checks,'charge_heights':heights,'fall':fall,'full_route':route,'errors':errors},indent=2))
 browser.close()
print(f'{len(checks)} browser checks passed. Evidence: {OUT}')
