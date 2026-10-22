import test from 'node:test';import assert from 'node:assert';
const f=(o,d,x)=>x??Math.floor((o*(100-d)+50)/100);
test('20% off 499 rupees',()=>assert.equal(f(49900,20),39920));
test('no discount',()=>assert.equal(f(10000,0),10000));
test('override wins',()=>assert.equal(f(10000,50,7000),7000));
