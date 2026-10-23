import {PF,json,hmacHex,safeEqual,rpc} from './_lib';
// Trust model: (1) HMAC over the raw body, (2) payment re-fetched from the Razorpay API (authoritative status/amount/currency/order),
// (3) one atomic SQL function validates against our pending order and grants access. User id always comes from our order row.
export const onRequestPost:PF=async({request,env})=>{
 if(!env.RAZORPAY_WEBHOOK_SECRET||!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET||!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_URL)return json({error:'Server not configured'},500);
 const raw=await request.text();const sig=request.headers.get('x-razorpay-signature')||'';
 if(!sig||!safeEqual(await hmacHex(env.RAZORPAY_WEBHOOK_SECRET,raw),sig))return json({error:'Invalid signature'},400);
 const eid=request.headers.get('x-razorpay-event-id');if(!eid)return json({error:'Missing event id'},400);
 let ev:any;try{ev=JSON.parse(raw)}catch{return json({error:'Bad JSON'},400)}
 const ent=ev?.payload?.payment?.entity;if(!ent?.id||!ent?.order_id)return json({ok:true,result:'ignored_no_payment'});
 let pay:any;
 try{const r=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(ent.id)}`,{headers:{Authorization:'Basic '+btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}});
  if(!r.ok)return json({error:'Gateway lookup failed'},502);pay=await r.json()}catch{return json({error:'Gateway unreachable'},502)}
 if(pay.id!==ent.id||pay.order_id!==ent.order_id)return json({ok:true,result:'order_mismatch'});
 let r:Response;try{r=await rpc(env,'process_razorpay_event',{p_event_id:eid,p_event:String(ev.event||''),p_rzp_order_id:pay.order_id,p_payment_id:pay.id,p_amount:pay.amount,p_currency:pay.currency,p_status:pay.status})}catch{return json({error:'Database unreachable'},500)}
 if(!r.ok)return json({error:'Database error'},500);
 const result=await r.json();console.log(JSON.stringify({event_id:eid,result}));
 if(result==='unknown_order')return json({error:'Order not found yet'},503);
 return json({ok:true,result});
};
