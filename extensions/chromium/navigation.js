// Runs in MAIN world: synchronous route signal before the next render.
if (!window.__sfNavigationInstalled) {
  window.__sfNavigationInstalled = true;
  for (const name of ['pushState','replaceState']) {
    const original=history[name];
    history[name]=function(...args){const result=original.apply(this,args);window.dispatchEvent(new Event('sf-navigation'));return result;};
  }
  if (window.navigation) window.navigation.addEventListener('navigatesuccess',()=>window.dispatchEvent(new Event('sf-navigation')));
}
