import {PF,json,sb,userFrom,finalPaise} from './_lib';
export const onRequestPost:PF=async({request,env})=>{
 const user=await userFrom(env,request);if(!user)return json({error:'Sign in required'},401);
 const {bookIds}=await request.json().catch(()=>({})) as {bookIds?:string[]};
 if(!Array.isArray(bookIds)||!bookIds.length||bookIds.length>20||!bookIds.every(i=>/^[0-9a-f-]{36}$/.test(i)))return json({error:'Invalid cart'},400);
 const br=await sb(env,`books?id=in.(${[...new Set(bookIds)].join(',')})&published=eq.true&archived=eq.false&purchasable=eq.true&select=id,original_price_paise,discount_percent,sale_price_paise`);if(!br.ok)return json({error:'Catalogue unavailable'},502);
 const books=await br.json() as any[];
 if(books.length!==new Set(bookIds).size)return json({error:'A book in your cart is no longer available'},409);
 const items=books.map(b=>({book_id:b.id,price_paise:finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise)}));
 const total=items.reduce((s,i)=>s+i.price_paise,0);if(total<100)return json({error:'Invalid total'},400);
 const reference='WL-'+crypto.randomUUID().slice(0,8).toUpperCase();
 const or=await sb(env,'orders',{method:'POST',body:JSON.stringify({reference,user_id:user.id,total_paise:total})});if(!or.ok)return json({error:'Could not create order'},500);
 const order=(await or.json() as any[])[0];const drop=()=>sb(env,`orders?id=eq.${order.id}&status=eq.pending`,{method:'DELETE'});
 const ir=await sb(env,'order_items',{method:'POST',body:JSON.stringify(items.map(i=>({...i,order_id:order.id})))});if(!ir.ok){await drop();return json({error:'Could not create order'},500)}
 const rp=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{'content-type':'application/json',Authorization:'Basic '+btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)},body:JSON.stringify({amount:total,currency:'INR',receipt:reference})});
 if(!rp.ok){await drop();return json({error:'Payment gateway unavailable'},502)}
 const g=await rp.json() as {id:string};
 const pr=await sb(env,`orders?id=eq.${order.id}`,{method:'PATCH',body:JSON.stringify({razorpay_order_id:g.id})});if(!pr.ok)return json({error:'Could not finalise order'},500);
 return json({reference,razorpayOrderId:g.id,amount:total,keyId:env.RAZORPAY_KEY_ID});
};
