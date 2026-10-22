import {useEffect,useState} from 'react';import {Link,useNavigate} from 'react-router-dom';import {supabase,api} from '../lib/supabase';import {useCart,setCart} from '../lib/cart';import {inr,finalPaise} from '../lib/brand';
declare global{interface Window{Razorpay:any}}
export default function Cart(){const ids=useCart();const nav=useNavigate();const [rows,setRows]=useState<any[]>([]);const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!ids.length){setRows([]);return}supabase.from('books').select('id,title,original_price_paise,discount_percent,sale_price_paise').in('id',ids).then(({data})=>setRows(data||[]))},[ids.join()]);
 const total=rows.reduce((s,b)=>s+finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise),0);
 const pay=async()=>{setBusy(true);setMsg('');try{const o=await api('create-order',{bookIds:ids});
  if(!window.Razorpay){await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=ok;s.onerror=no;document.body.appendChild(s)})}
  new window.Razorpay({key:o.keyId,amount:o.amount,currency:'INR',order_id:o.razorpayOrderId,name:'Webli Literate',handler:()=>{setCart([]);nav('/order/'+o.reference)},modal:{ondismiss:()=>setMsg('Payment cancelled. You can retry.')}}).open()}catch(e:any){setMsg(e.message)}setBusy(false)};
 if(!ids.length)return <section style={{padding:16}}><h2>Your cart is empty</h2><Link to="/books">Browse books</Link></section>;
 return <section style={{padding:16}}><h2>Purchase</h2>{rows.map(b=><p key={b.id}>{b.title} — {inr(finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise))} <button onClick={()=>setCart(ids.filter(i=>i!==b.id))}>Remove</button></p>)}
 <h3>Total: {inr(total)}</h3><button onClick={pay} disabled={busy} style={{minHeight:44}}>{busy?'Please wait…':'Pay Now'}</button>{msg&&<p role="status">{msg}</p>}</section>}
