import {useEffect,useState} from 'react';import {Link,useSearchParams} from 'react-router-dom';import {supabase} from '../lib/supabase';import {inr,finalPaise,waLink} from '../lib/brand';import {cartIds,setCart} from '../lib/cart';
export default function Books(){const [p,setP]=useSearchParams();const q=p.get('q')||'',cat=p.get('cat')||'',sort=p.get('sort')||'new',max=p.get('max')||'';const [limit,setLimit]=useState(24);
 const [books,setBooks]=useState<any[]|null>(null);const [cats,setCats]=useState<any[]>([]);const [err,setErr]=useState('');
 useEffect(()=>{supabase.from('categories').select('*').order('name').then(({data})=>setCats(data||[]))},[]);
 useEffect(()=>{setBooks(null);setErr('');let r=supabase.from('books').select('id,title,author,cover_url,original_price_paise,discount_percent,sale_price_paise,categories(name)').eq('published',true).eq('archived',false).limit(limit);
  r=sort==='title'?r.order('title'):r.order('created_at',{ascending:false});if(cat)r=r.eq('category_id',cat);
  if(q){const s=q.replace(/[%,()]/g,' ');r=r.or(`title.ilike.%${s}%,author.ilike.%${s}%,description.ilike.%${s}%`)}
  r.then(({data,error})=>{if(error)return setErr(error.message);let d=(data||[]).map((b:any)=>({...b,f:finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise)}));
   if(max)d=d.filter(b=>b.f<=Number(max)*100);if(sort==='price')d.sort((a,b)=>a.f-b.f);setBooks(d)})},[q,cat,sort,max,limit]);
 const set=(k:string,v:string)=>{const n=new URLSearchParams(p);v?n.set(k,v):n.delete(k);setP(n)};
 return <section style={{padding:16}}><div style={{display:'flex',flexWrap:'wrap',gap:8}}><input defaultValue={q} key={q} onKeyDown={e=>e.key==='Enter'&&set('q',e.currentTarget.value)} placeholder="Search, press Enter" aria-label="Search books" style={{padding:10}}/>
 <select value={cat} onChange={e=>set('cat',e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
 <select value={sort} onChange={e=>set('sort',e.target.value)} aria-label="Sort"><option value="new">Newest</option><option value="title">Title</option><option value="price">Price (low to high)</option></select>
 <input type="number" min={0} placeholder="Max ₹" defaultValue={max} onBlur={e=>set('max',e.target.value)} aria-label="Maximum price" style={{width:90}}/><button onClick={()=>setP({})}>Clear filters</button></div>
 {err&&<p role="alert">{err}</p>}{!books&&!err&&<p>Loading books…</p>}{books&&!books.length&&<p>No books found.</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginTop:16}}>{books?.map(b=><article key={b.id} style={{border:'1px solid #ddd',borderRadius:8,padding:12}}>
  {b.cover_url&&<img src={b.cover_url} alt={b.title} loading="lazy" style={{width:'100%',aspectRatio:'2/3',objectFit:'cover'}}/>}<h3>{b.title}</h3><p>{b.author}{b.categories?.name&&<><br/><small>{b.categories.name}</small></>}</p>
  <p>{b.f<b.original_price_paise&&<s>{inr(b.original_price_paise)} </s>}{b.discount_percent>0&&<b>{b.discount_percent}% OFF </b>}<strong>{inr(b.f)}</strong></p>
  <Link to={`/books/${b.id}`}>View Details</Link> <button onClick={()=>setCart([...cartIds(),b.id])}>Add to Cart</button> <a href={waLink(`Hi, I want to buy this book: ${b.title}. Please share the purchase details.`)} target="_blank" rel="noreferrer">WhatsApp</a></article>)}</div>
 {books&&books.length>=limit&&<p><button onClick={()=>setLimit(limit+24)}>Load more</button></p>}</section>}
