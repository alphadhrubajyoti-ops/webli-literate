import {useEffect,useState} from 'react';import {supabase,api} from '../lib/supabase';
export default function Purchases(){const [rows,setRows]=useState<any[]|null>(null);const [err,setErr]=useState('');
 useEffect(()=>{supabase.from('entitlements').select('book_id,books(title,author)').eq('revoked',false).then(({data,error})=>error?setErr(error.message):setRows(data||[]))},[]);
 const open=async(id:string)=>{try{const {url}=await api('book-url',{bookId:id});window.open(url,'_blank','noopener')}catch(e:any){setErr(e.message)}};
 return <section style={{padding:16}}><h2>My Purchases</h2>{err&&<p role="alert">{err}</p>}{rows&&!rows.length&&<p>No purchases yet.</p>}{rows?.map(r=><p key={r.book_id}>{r.books?.title} <button onClick={()=>open(r.book_id)}>Read / Download</button></p>)}</section>}
