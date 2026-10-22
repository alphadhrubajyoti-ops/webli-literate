import {useEffect,useState} from 'react';import {supabase} from '../../lib/supabase';import {inr} from '../../lib/brand';
export default function Dashboard(){const [s,setS]=useState<any>(null);const [rec,setRec]=useState<any[]>([]);const [logs,setLogs]=useState<any[]>([]);const [err,setErr]=useState('');
 useEffect(()=>{supabase.rpc('admin_stats').then(({data,error})=>error?setErr(error.message):setS(data));
  supabase.from('orders').select('reference,total_paise,status,created_at').order('created_at',{ascending:false}).limit(5).then(({data})=>setRec(data||[]));
  supabase.from('admin_audit_logs').select('action,created_at').order('created_at',{ascending:false}).limit(5).then(({data})=>setLogs(data||[]))},[]);
 const cards:[string,any][]=s?[['Published books',s.published],['Draft books',s.drafts],['Total orders',s.orders],['Paid orders',s.paid],['Pending',s.pending],['Failed',s.failed],['Refunded',s.refunded],['Payment events needing review',s.needs_review],['Verified revenue',inr(s.revenue_paise)]]:[];
 return <div><h2>Dashboard</h2>{err&&<p role="alert">{err}</p>}<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>{cards.map(([k,v])=><div key={k} style={{border:'1px solid #ddd',borderRadius:8,padding:12}}><small>{k}</small><div style={{fontSize:22}}><b>{v}</b></div></div>)}</div>
 <h3>Recent orders</h3>{rec.map(o=><p key={o.reference}>{o.reference} · {inr(o.total_paise)} · {o.status} · {new Date(o.created_at).toLocaleString()}</p>)}{!rec.length&&<p>No orders yet.</p>}
 <h3>Recent admin activity</h3>{logs.map((l,i)=><p key={i}>{l.action} · {new Date(l.created_at).toLocaleString()}</p>)}</div>}
