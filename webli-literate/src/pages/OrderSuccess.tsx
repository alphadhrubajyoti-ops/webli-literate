import {useEffect,useState} from 'react';import {useParams,Link} from 'react-router-dom';import {supabase,api} from '../lib/supabase';import {inr} from '../lib/brand';
export default function OrderSuccess(){const {reference}=useParams();const [o,setO]=useState<any>(null);const [err,setErr]=useState('');const [tries,setTries]=useState(0);
 useEffect(()=>{let stop=false;(async()=>{const {data,error}=await supabase.from('orders').select('reference,total_paise,status,paid_at,created_at,order_items(book_id,books(title))').eq('reference',reference).maybeSingle();if(stop)return;
  if(error)setErr(error.message);else if(!data)setErr('Order not found.');else{setO(data);if(data.status==='pending'&&tries<20)setTimeout(()=>setTries(t=>t+1),3000)}})();return()=>{stop=true}},[reference,tries]);
 const open=async(id:string)=>{try{const {url}=await api('book-url',{bookId:id});window.open(url,'_blank','noopener')}catch(e:any){setErr(e.message)}};
 if(err)return <p role="alert" style={{padding:16}}>{err}</p>;if(!o)return <p style={{padding:16}}>Loading…</p>;
 const msg:Record<string,string>={pending:'Waiting for payment confirmation from the gateway…',paid:'Payment confirmed. Thank you!',failed:'Payment failed. You have not been charged for access — please try again.',refunded:'This order was refunded; access has been revoked.'};
 return <section style={{padding:16,maxWidth:600,margin:'0 auto'}}><h2>Order {o.reference}</h2><p role="status">{msg[o.status]}</p>{o.status==='pending'&&tries>=20&&<p>Still pending. Check My Purchases in a few minutes or contact us with this reference.</p>}
 <p>Status: <b>{o.status}</b> · Amount: <b>{inr(o.total_paise)}</b><br/>{new Date(o.paid_at||o.created_at).toLocaleString()}</p>
 {o.order_items.map((i:any)=><p key={i.book_id}>{i.books?.title} {o.status==='paid'&&<button onClick={()=>open(i.book_id)}>Read / Download PDF</button>}</p>)}{o.status==='failed'&&<Link to="/cart">Retry from cart</Link>} <Link to="/purchases">My Purchases</Link></section>}
