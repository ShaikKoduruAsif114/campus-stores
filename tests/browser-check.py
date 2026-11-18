"""Real Chrome acceptance check. Run: uv run --with playwright python tests/browser-check.py"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
out=repo/'docs'/'evidence';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='C:/Program Files/Google/Chrome/Application/chrome.exe',headless=True)
 page=browser.new_page(viewport={'width':1440,'height':1100})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((repo/'index.html').as_uri())
 def state():return page.evaluate("JSON.parse(localStorage.getItem('campus-stores.shift.v2'))")
 def tab(name):page.locator('[data-action="tab"]').filter(has_text=name).click()
 def kit():
  if page.locator('[data-action="close"]').count():page.locator('[data-action="close"]').click()
  page.locator('[data-page] [data-action="request"][data-val="RQ-214"]').click()
 def shot(name):page.screenshot(path=str(out/name),full_page=True)
 def issue(asset):
  tab('Requests');kit();page.locator('[data-action="issue-request"]').click()
  assert page.locator('[name="req"]').input_value()=='RQ-214'
  assert page.locator('[name="due"]').input_value()=='Fri 8 pm'
  page.locator('[name="asset"]').select_option(asset)
  page.locator('[name="who"]').select_option('Kabir Sen')
  page.get_by_role('button',name='Save issue slip').click()
 for asset in ['PR-04','SP-02','AD-12']:issue(asset)
 page.get_by_role('button',name='Move to return time').click()
 def receive(num,asset,person):
  page.locator(f'[data-action="return"][data-val="{num}"]').click()
  assert page.locator('[data-return] [name="asset"]').evaluate('(e)=>e===document.activeElement')
  page.locator('[data-return] [name="asset"]').fill(asset)
  page.locator('[data-return] [name="returnedBy"]').fill(person)
  page.get_by_role('button',name='Confirm return',exact=True).click()
 receive(402,'PR-04','Kabir Sen');receive(403,'SP-02','Kabir Sen')
 page.locator('[data-action="custody"][data-val="404"]').click()
 page.locator('[data-custody] [name="holder"]').select_option('Leela Das')
 page.locator('[data-custody] [name="due"]').select_option('Sat 9 am')
 page.locator('[name="reason"]').fill('Kabir confirmed Leela has AD-12 and will return it Saturday at 9 am.')
 page.get_by_role('button',name='Save custody agreement').click()
 tab('Requests');kit()
 assert '2 of 3' in page.locator('[data-page]').inner_text()
 assert 'Leela Das' in page.locator('[data-page]').inner_text()
 shot('after-01-partial-kit.png')
 page.reload();assert state()['loans'][-1]['holder']=='Leela Das'
 tab('Desk book');page.locator('[name="note"]').fill('Please read the adapter label before closing the slip.')
 # Draft must survive moving away and back.
 tab('Inventory');tab('Desk book');assert 'adapter label' in page.locator('[name="note"]').input_value()
 page.get_by_role('button',name='Save handover snapshot').click()
 assert page.locator('[name="note"]').input_value()==''
 page.get_by_role('button',name='Move to next morning').click()
 assert 'Leela Das' in page.locator('[data-handover]').inner_text()
 shot('after-02-morning-handover.png')
 page.locator('[data-handover] [data-val="RQ-214"]').click()
 receive(404,'AD-15','Leela Das')
 assert 'Unit mismatch' in page.locator('[data-status]').inner_text()
 assert not state()['loans'][-1]['back']
 shot('after-03-wrong-unit-blocked.png')
 page.locator('[data-return] [name="asset"]').fill('AD-12')
 page.get_by_role('button',name='Confirm return',exact=True).click()
 assert 'Complete' in page.locator('[data-page]').inner_text()
 assert 'Returned by Leela Das' in page.locator('[data-page]').inner_text()
 assert not state()['loans'][0]['back']
 shot('after-04-complete.png')
 mobile=[]
 for width in [375,768]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Overflow at {width}'
  shot(f'after-05-mobile-{width}.png');mobile.append(width)
 page.get_by_role('button',name='Restart sample shift').click()
 assert len(state()['loans'])==1 and state()['phase']==0 and not state()['notes']
 # Regression: starting a return must close an unsaved custody editor.
 tab('Loan register')
 page.locator('[data-action="custody"][data-val="401"]').click()
 receive(401,'MI-09','Tara Shah')
 assert state()['loans'][0]['back'], 'Return was not persisted after opening custody editor'
 page.reload();assert state()['loans'][0]['back']
 page.get_by_role('button',name='Restart sample shift').click()
 assert not errors,errors
 report={'transport':'file://, offline bundled assets','scenario':'Film Society pickup → partial return → Leela custody agreement → saved handover → morning wrong-unit rejection → correct return','reloadPersistence':True,'draftPreservation':True,'returnFocus':True,'wrongUnitBlocked':True,'unrelatedMicrophoneRemainsOpen':True,'restartVerified':True,'mobileNoHorizontalOverflow':mobile,'pageErrors':errors}
 (out/'browser-results.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2));browser.close()
