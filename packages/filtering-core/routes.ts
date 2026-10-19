export const version = '0.1.0';
export type Platform = 'instagram' | 'tiktok' | 'external';
export type Settings = { feeds: boolean; reels: boolean; stories: boolean; explore: boolean };
export const defaults: Settings = {feeds:true,reels:true,stories:true,explore:true};
export function settings(value: unknown): Settings {
  const out = {...defaults};
  if (value && typeof value === 'object') for (const key of Object.keys(out) as (keyof Settings)[]) {
    const v = (value as Record<string,unknown>)[key]; if (typeof v === 'boolean') out[key] = v;
  }
  return out;
}
export function platform(host: string): Platform {
  host=host.toLowerCase();
  if (host==='instagram.com'||host.endsWith('.instagram.com')) return 'instagram';
  if (host==='tiktok.com'||host.endsWith('.tiktok.com')) return 'tiktok';
  return 'external';
}
export type Decision = {blocked:boolean; reason:string; platform:Platform; upload:boolean};
// Pure function callable from JavaScriptCore without browser globals or user data.
export function decide(host: string, rawPath: string, search: string = '', value: unknown = defaults): Decision {
  const site=platform(host), s=settings(value);
  const answer=(reason:string,blocked:boolean,upload=false):Decision=>({blocked,reason,platform:site,upload});
  if(site==='external') return answer('external',false);
  let p:string;
  try { p=decodeURIComponent(rawPath).replace(/\/{2,}/g,'/').toLowerCase().replace(/\/+$/,'')||'/'; }
  catch { return answer('malformed',true); }
  if(/[\\\u0000-\u001f]/.test(p)||/%[0-9a-f]{2}/i.test(p)) return answer('malformed',true);
  if(site==='tiktok') p=p.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i,'')||'/';
  const segments=p.split('/').filter(Boolean);
  // Consumption has precedence over safe parent routes and user toggles for unknown routes.
  if(segments.some(x=>['reel','reels','video','photo','live','tv'].includes(x))) return answer('reels',s.reels);
  if(segments.some(x=>['story','stories','highlights'].includes(x))) return answer('stories',s.stories);
  if(site==='instagram') {
    if(p==='/' || /^\/(feed|following|favorites)(\/|$)/.test(p)) return answer('feeds',s.feeds);
    if(/^\/(explore|search|suggested)(\/|$)/.test(p)) return answer('explore',s.explore);
    if(/^\/(create|upload)(\/|$)/.test(p)) return answer('upload',false,true);
    if(/^\/(direct|accounts|challenge|checkpoint|oauth|privacy|legal|emails)(\/|$)/.test(p)) return answer('utility',false);
    if(/^\/p\/[^/]+(?:\/embed)?$/.test(p)) return answer('post',false);
    if(/^\/[a-z0-9._]+(?:\/(saved|tagged))?$/.test(p) && !['share','s','reels','stories','explore','about','api','web'].includes(segments[0])) return answer('profile',false);
  } else {
    if(/^\/(?:foryou|following|friends|discover|explore|recommend|music|tag|search)?(?:\/|$)/.test(p)) return answer(p.includes('search')?'explore':'feeds',p.includes('search')?s.explore:s.feeds);
    if(/^\/(upload|tiktokstudio\/upload)(\/|$)/.test(p)) return answer('upload',false,true);
    if(/^\/(messages|settings|login|signup|passport|legal|feedback|account)(\/|$)/.test(p)) return answer('utility',false);
    if(/^\/@[a-z0-9._]+$/.test(p)) return answer('profile',false);
  }
  // Short links and unknown layouts cannot unlock consumption before a redirect is resolved.
  return answer('unknown-route',true);
}
export function classify(raw: string, value: unknown = defaults, base?: string): Decision {
  try {
    const u=new URL(raw,base);
    if(!['https:','http:'].includes(u.protocol)||u.username||u.password) return {blocked:true,reason:'malformed',platform:'external',upload:false};
    return decide(u.hostname,u.pathname,u.search,value);
  } catch { return {blocked:true,reason:'malformed',platform:'external',upload:false}; }
}
