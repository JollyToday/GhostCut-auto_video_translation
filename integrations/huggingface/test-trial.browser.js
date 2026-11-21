// Run with `playwright-cli run-code --filename=...` on the local staged Space.
// Intercepts the trial route: never reserves a slot.
async page => {
  if (new URL(page.url()).hostname !== '127.0.0.1') throw Error('Run on a local staged Space.');
  const panel = page.locator('.trial-view');
  const status = panel.getByRole('status');
  const send = panel.getByRole('button', {name: 'Remove subtitles', exact: true});
  const check = panel.getByRole('button', {name: 'Check status'});
  let posts = 0, saved, exhausted = true;
  await page.route('**/sponsored-removal', async route => {
    const request = route.request(), receipt = request.headers()['x-trial-receipt'];
    if (!/^[0-9a-f]{64}$/.test(receipt) || (saved && saved !== receipt)) throw Error('Receipt changed');
    saved = receipt;
    if (request.method() === 'POST') {
      posts++;
      if (request.headers()['x-confirm-upload'] !== 'yes' || request.postDataBuffer().length !== 48)
        throw Error('Unexpected upload');
      if (exhausted) return route.fulfill({status:429, json:{error:'Shared trial allowance exhausted.'}});
      return route.fulfill({status:202, json:{state:'queued'}});
    }
    return route.fulfill({json:{state:'ready',videoUrl:'https://example.org/fixture.mp4'}});
  });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await panel.getByLabel('Video file').setInputFiles({name:'clip.mp4', mimeType:'video/mp4', buffer:Buffer.alloc(48)});
  if (posts || !await send.isDisabled()) throw Error('File selection must not submit');
  await panel.getByRole('checkbox').check();
  await send.click();
  await status.filter({hasText:'exhausted'}).waitFor();
  if (posts !== 1 || await check.isDisabled()) throw Error('Failed to preserve receipt at quota limit');
  exhausted = false;
  await send.click();
  await status.filter({hasText:'queued'}).waitFor();
  await page.reload();
  await check.click();
  const link = panel.getByRole('link', {name:'Download cleaned MP4'});
  await link.waitFor();
  if (await link.getAttribute('href') !== 'https://example.org/fixture.mp4' || posts !== 2) throw Error('Resume created another job');
  await page.getByRole('radio', {name:'Translate image'}).check();
  await panel.waitFor({state:'hidden'});
  await page.getByRole('radio', {name:'Remove subtitles'}).check();
  await panel.waitFor();
  await page.setViewportSize({width:390,height:844});
  if (await panel.evaluate(el => el.scrollWidth > el.clientWidth + 1)) throw Error('Trial panel overflows on mobile');
  return {consent:true, quota:true, sameReceiptRetry:true, resume:true, scope:true, mobile:true};
}
