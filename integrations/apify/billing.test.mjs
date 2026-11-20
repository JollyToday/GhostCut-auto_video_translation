import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveBilling} from './billing.mjs';

test('Apify paying runs always use Store billing',()=>{
  assert.equal(resolveBilling({billing:'own',appKey:'customer-key'},{APIFY_USER_IS_PAYING:'1'}),'store');
  assert.equal(resolveBilling({},{APIFY_USER_IS_PAYING:'1'}),'store');
});

test('self-hosted and BYO runs keep their requested billing mode',()=>{
  assert.equal(resolveBilling({},{APIFY_USER_IS_PAYING:'0'}),'own');
  assert.equal(resolveBilling({billing:'own'},{ }),'own');
  assert.equal(resolveBilling({billing:'store'},{ }),'store');
});
