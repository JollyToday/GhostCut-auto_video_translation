export function resolveBilling(settings={},env=process.env){
  if(env.APIFY_USER_IS_PAYING==='1')return 'store';
  return settings.billing||'own';
}
