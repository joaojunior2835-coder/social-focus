const ext=globalThis.browser||chrome;
const keys=['feeds','reels','stories','explore'];
ext.storage.local.get('filters',(v)=>{for(const key of keys) document.getElementById(key).checked=v.filters?.[key]!==false;document.getElementById('status').textContent='Settings saved locally.';});
for(const key of keys)document.getElementById(key).addEventListener('change',()=>{
 const filters=Object.fromEntries(keys.map(k=>[k,document.getElementById(k).checked]));ext.storage.local.set({filters},()=>{document.getElementById('status').textContent='Saved. Filters changed on open protected pages.';});
});
document.getElementById('profile').addEventListener('submit',e=>{e.preventDefault();const handle=document.getElementById('handle').value;if(!/^[A-Za-z0-9._]{1,30}$/.test(handle))return;const platform=document.getElementById('platform').value;window.open(platform==='instagram'?'https://www.instagram.com/'+handle+'/':'https://www.tiktok.com/@'+handle,'_blank','noopener');});
