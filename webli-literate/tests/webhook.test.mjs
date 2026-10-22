import test,{before} from 'node:test';import assert from 'node:assert';import {createHmac} from 'node:crypto';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {buildSync} from 'esbuild';
import {makeDb,su,ID} from './helpers/db.mjs';
const {U1,U2,AD,B1,B2,O1,O2}=ID;const SECRET='test_webhook_secret';let db,handler;
const env={SUPABASE_URL:'https://sb.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',RAZORPAY_KEY_ID:'test_key',RAZORPAY_KEY_SECRET:'test_secret',RAZORPAY_WEBHOOK_SECRET:SECRET};
const P=(id,order,amount,currency='INR',status='captured')=>({id,order_id:order,amount,currency,status});
const payments={pay_1:P('pay_1','order_1',10000),pay_9:P('pay_9','order_1',10000),pay_2:P('pay_2','order_2',100),pay_3:P('pay_3','order_2',20000,'USD'),pay_auth:P('pay_auth','order_2',20000,'INR','authorized'),pay_4:P('pay_4','order_2',20000),
 pay_nf:P('pay_nf','order_999',100),pay_n3:P('pay_n3','order_3',10000),pay_f:P('pay_f','order_4',20000,'INR','failed'),pay_5:P('pay_5','order_4',20000)};
before(async()=>{db=await makeDb();buildSync({entryPoints:['functions/api/razorpay-webhook.ts'],bundle:true,format:'esm',platform:'neutral',outfile:'.tmp/webhook.mjs',logLevel:'silent'});
 handler=(await import(pathToFileURL(resolve('.tmp/webhook.mjs')).href)).onRequestPost;
 globalThis.fetch=async(url,init)=>{url=String(url);
  if(url.startsWith('https://api.razorpay.com/v1/payments/')){const p=payments[url.split('/').pop()];return p?new Response(JSON.stringify(p)):new Response('{}',{status:404})}
  if(url.endsWith('/rest/v1/rpc/process_razorpay_event')){const a=JSON.parse(init.body);try{await db.exec('set role service_role');
   const r=await db.query('select process_razorpay_event($1,$2,$3,$4,$5,$6,$7) r',[a.p_event_id,a.p_event,a.p_rzp_order_id,a.p_payment_id,a.p_amount,a.p_currency,a.p_status]);return new Response(JSON.stringify(r.rows[0].r))}
   catch(e){return new Response(JSON.stringify({message:'db error'}),{status:500})}finally{await db.exec('reset role')}}
  throw new Error('unexpected fetch '+url)}});
const send=async({event='payment.captured',eid='e',order,pay,sig,raw})=>{raw??=JSON.stringify({event,payload:{payment:{entity:{id:pay,order_id:order}}}});
 const res=await handler({request:new Request('https://x/api/razorpay-webhook',{method:'POST',body:raw,headers:{'x-razorpay-signature':sig??createHmac('sha256',SECRET).update(raw).digest('hex'),...(eid?{'x-razorpay-event-id':eid}:{})}}),env});return{status:res.status,body:await res.json()}};
const order=async ref=>(await su(db,'select * from orders where reference=$1',[ref])).rows[0];const ents=async()=>(await su(db,'select user_id,book_id,revoked from entitlements order by book_id,user_id')).rows;
const ev=async id=>(await su(db,'select status,error from webhook_events where event_id=$1',[id])).rows[0];
test('invalid signature rejected, nothing changes',async()=>{const r=await send({eid:'e0',order:'order_1',pay:'pay_1',sig:'0'.repeat(64)});assert.equal(r.status,400);assert.equal((await order('R1')).status,'pending');assert.equal((await ents()).length,0)});
test('signature over a tampered body rejected',async()=>{const raw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_1',order_id:'order_1'}}}});const sig=createHmac('sha256',SECRET).update(raw).digest('hex');assert.equal((await send({eid:'e0',raw:raw.replace('pay_1','pay_9'),sig})).status,400)});
test('missing event id rejected',async()=>assert.equal((await send({eid:null,order:'order_1',pay:'pay_1'})).status,400));
test('valid payment grants entitlement to the order owner only',async()=>{const r=await send({eid:'e3',order:'order_1',pay:'pay_1'});assert.equal(r.body.result,'fulfilled');const o=await order('R1');assert.equal(o.status,'paid');assert.equal(o.razorpay_payment_id,'pay_1');assert.deepEqual(await ents(),[{user_id:U1,book_id:B1,revoked:false}])});
test('redelivery of the same event is a no-op',async()=>{assert.equal((await send({eid:'e3',order:'order_1',pay:'pay_1'})).body.result,'duplicate_event');assert.equal((await ents()).length,1)});
test('order.paid for same payment (different event id) creates no duplicate',async()=>{assert.equal((await send({event:'order.paid',eid:'e5',order:'order_1',pay:'pay_1'})).body.result,'already_paid');assert.equal((await ents()).length,1)});
test('second, different payment on a paid order is rejected',async()=>{assert.equal((await send({eid:'e6',order:'order_1',pay:'pay_9'})).body.result,'rejected');assert.equal((await order('R1')).razorpay_payment_id,'pay_1');assert.equal((await ents()).length,1)});
test('amount mismatch rejected, order stays pending, no access',async()=>{assert.equal((await send({eid:'e7',order:'order_2',pay:'pay_2'})).body.result,'rejected');assert.equal((await order('R2')).status,'pending');assert.equal((await ev('e7')).status,'rejected');assert.equal((await ents()).length,1)});
test('currency mismatch rejected',async()=>{assert.equal((await send({eid:'e8',order:'order_2',pay:'pay_3'})).body.result,'rejected');assert.equal((await order('R2')).status,'pending')});
test('uncaptured payment ignored',async()=>{assert.equal((await send({eid:'e9',order:'order_2',pay:'pay_auth'})).body.result,'ignored');assert.equal((await order('R2')).status,'pending')});
test('unknown order -> 503 so gateway retries, event not recorded',async()=>{const r=await send({eid:'e10',order:'order_999',pay:'pay_nf'});assert.equal(r.status,503);assert.equal(await ev('e10'),undefined)});
test('gateway lookup failure -> 502 (retry), nothing changes',async()=>{const r=await send({eid:'e11',order:'order_2',pay:'pay_missing'});assert.equal(r.status,502);assert.equal((await order('R2')).status,'pending')});
test('payload that disagrees with the gateway record is ignored',async()=>{const r=await send({eid:'e12',order:'order_2',pay:'pay_1'});assert.equal(r.body.result,'order_mismatch');assert.equal((await order('R2')).status,'pending');assert.equal(await ev('e12'),undefined)});
test('partial DB failure rolls back fully; retry of same event then succeeds',async()=>{
 await db.exec('reset role');await db.exec("create function boom() returns trigger language plpgsql as $$begin raise exception 'boom';end$$;create trigger t_boom before insert on entitlements for each row execute function boom()");
 const r=await send({eid:'e13',order:'order_2',pay:'pay_4'});assert.equal(r.status,500);assert.equal((await order('R2')).status,'pending');assert.equal(await ev('e13'),undefined);assert.equal((await ents()).length,1);
 await db.exec('drop trigger t_boom on entitlements');const r2=await send({eid:'e13',order:'order_2',pay:'pay_4'});assert.equal(r2.body.result,'fulfilled');assert.equal((await order('R2')).status,'paid');
 assert.deepEqual((await ents()).filter(e=>e.book_id===B2),[{user_id:U2,book_id:B2,revoked:false}])});
test('order without items goes to needs_review, no access',async()=>{assert.equal((await send({eid:'e14',order:'order_3',pay:'pay_n3'})).body.result,'needs_review');assert.equal((await order('R3')).status,'pending');assert.equal((await ev('e14')).status,'needs_review')});
test('failed attempt then successful retry on the same order',async()=>{assert.equal((await send({event:'payment.failed',eid:'e15a',order:'order_4',pay:'pay_f'})).body.result,'failed_recorded');assert.equal((await order('R4')).status,'failed');
 assert.equal((await send({eid:'e15b',order:'order_4',pay:'pay_5'})).body.result,'fulfilled');assert.equal((await order('R4')).status,'paid');assert.ok((await ents()).some(e=>e.user_id===U1&&e.book_id===B2))});
test('replayed event does not undo an admin revocation',async()=>{await su(db,`update entitlements set revoked=true where user_id='${U1}' and book_id='${B2}'`);assert.equal((await send({event:'order.paid',eid:'e16',order:'order_4',pay:'pay_5'})).body.result,'already_paid');
 assert.equal((await ents()).find(e=>e.user_id===U1&&e.book_id===B2).revoked,true)});
test('late event for a refunded order is rejected and access stays revoked',async()=>{await su(db,`select set_config('request.sub','${AD}',false)`);await su(db,`select admin_refund_order('${O1}')`);
 assert.equal((await send({event:'order.paid',eid:'e17',order:'order_1',pay:'pay_1'})).body.result,'rejected');assert.equal((await ents()).find(e=>e.book_id===B1).revoked,true)});
test('server refuses to run unconfigured',async()=>{const res=await handler({request:new Request('https://x',{method:'POST',body:'{}'}),env:{}});assert.equal(res.status,500)});
