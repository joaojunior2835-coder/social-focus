
import {test,expect,chromium} from '@playwright/test';
import fs from 'node:fs';
test('shared runtime initializes once, batches mutations, and reaches idle without polling',async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();const content=fs.readFileSync('dist/chromium/content.js','utf8');
 await page.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main><form><input type="file"><video id="draft"></video></form></main></body></html>'}));
 await page.addInitScript({content:fs.readFileSync('extensions/chromium/navigation.js','utf8')+content});
 await page.goto('https://www.instagram.com/direct/inbox/');
 await expect(page.locator('html')).toHaveAttribute('data-sf-ready','');
 await page.evaluate(()=>{window.originalEngine=window.__socialFocus;for(let i=0;i<150;i++){const a=document.createElement('a');a.href='/reel/'+i;document.querySelector('main').append(a);}});
 await page.addScriptTag({content});
 expect(await page.evaluate(()=>window.originalEngine===window.__socialFocus)).toBe(true);
 await expect(page.locator('a[data-sf-link]')).toHaveCount(150);
 await page.waitForTimeout(100);const before=await page.evaluate(()=>window.__socialFocus.diagnostics());
 await page.waitForTimeout(150);const after=await page.evaluate(()=>window.__socialFocus.diagnostics());
 expect(after.scans).toBe(before.scans);expect(after.scans).toBeLessThan(20);
 expect(Object.keys(after).sort()).toEqual(['version','platform','reason','blocked','scans','blockedCount'].sort());
 await page.evaluate(()=>history.pushState({},'', '/reel/future'));
 await expect(page.locator('#sf-gate')).toBeVisible();
 await page.screenshot({path:'evidence/sanitized-blocked-fixture.png'});
 await browser.close();
});
