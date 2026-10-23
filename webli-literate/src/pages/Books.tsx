import {useEffect,useState} from 'react';import {Link,useSearchParams} from 'react-router-dom';import {Search,ShoppingCart,MessageCircle} from 'lucide-react';import {supabase} from '../lib/supabase';import {finalPaise,waLink} from '../lib/brand';import {cartIds,setCart} from '../lib/cart';import {BookCover,Price,Loading,Empty,Alert,PageHead} from '../components/ui';
export default function Books(){const [p,setP]=useSearchParams();const q=p.get('q')||'',cat=p.get('cat')||'',sort=p.get('sort')||'new',max=p.get('max')||'';const [limit,setLimit]=useState(24);
 const [books,setBooks]=useState<any[]|null>(null);const [cats,setCats]=useState<any[]>([]);const [err,setErr]=useState('');const [added,setAdded]=useState('');
 useEffect(()=>{supabase.from('categories').select('*').order('name').then(({data})=>setCats(data||[]))},[]);
 useEffect(()=>{setBooks(null);setErr('');let r=supabase.from('books').select('id,title,author,cover_url,original_price_paise,discount_percent,sale_price_paise,categories(name)').eq('published',true).eq('archived',false).limit(limit);
  r=sort==='title'?r.order('title'):r.order('created_at',{ascending:false});if(cat)r=r.eq('category_id',cat);
  if(q){const s=q.replace(/[%,()]/g,' ');r=r.or(`title.ilike.%${s}%,author.ilike.%${s}%,description.ilike.%${s}%`)}
  r.then(({data,error})=>{if(error)return setErr(error.message);let d=(data||[]).map((b:any)=>({...b,f:finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise)}));
   if(max)d=d.filter(b=>b.f<=Number(max)*100);if(sort==='price')d.sort((a,b)=>a.f-b.f);setBooks(d)})},[q,cat,sort,max,limit]);
 const set=(k:string,v:string)=>{const n=new URLSearchParams(p);v?n.set(k,v):n.delete(k);setP(n)};
 const add=(id:string)=>{setCart([...cartIds(),id]);setAdded(id);setTimeout(()=>setAdded(''),1800)};
 return <section className="container-page py-8"><PageHead title="Books"/>
 <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1.2fr_.8fr_auto] lg:items-end">
  <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"/><input defaultValue={q} key={q} onKeyDown={e=>e.key==='Enter'&&set('q',e.currentTarget.value)} placeholder="Search, press Enter" aria-label="Search books" className="input pl-9"/></div>
  <select value={cat} onChange={e=>set('cat',e.target.value)} aria-label="Category" className="input"><option value="">All categories</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  <select value={sort} onChange={e=>set('sort',e.target.value)} aria-label="Sort" className="input"><option value="new">Newest</option><option value="title">Title</option><option value="price">Price (low to high)</option></select>
  <input type="number" min={0} placeholder="Max ₹" defaultValue={max} key={'m'+max} onBlur={e=>set('max',e.target.value)} aria-label="Maximum price" className="input"/>
  <button className="btn btn-outline" onClick={()=>setP({})}>Clear filters</button></div>
 {err&&<Alert>{err}</Alert>}{!books&&!err&&<Loading text="Loading books…"/>}{books&&!books.length&&<Empty title="No books found">Try a different search or <button className="font-semibold text-brand-700 underline" onClick={()=>setP({})}>clear the filters</button>.</Empty>}
 <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{books?.map(b=><article key={b.id} className="card flex flex-col p-3">
  <Link to={`/books/${b.id}`} aria-label={`View details: ${b.title}`}><BookCover url={b.cover_url} title={b.title}/></Link>
  <div className="mt-3 flex-1"><h3 className="line-clamp-2 text-base font-bold leading-snug"><Link to={`/books/${b.id}`} className="hover:text-brand-700">{b.title}</Link></h3><p className="mt-0.5 text-sm text-slate-600">{b.author}</p>{b.categories?.name&&<span className="badge badge-info mt-2">{b.categories.name}</span>}</div>
  <div className="mt-3"><Price o={b.original_price_paise} d={b.discount_percent} s={b.sale_price_paise}/></div>
  <div className="mt-3 grid grid-cols-2 gap-2"><Link to={`/books/${b.id}`} className="btn btn-outline btn-sm">View Details</Link><button className="btn btn-primary btn-sm" onClick={()=>add(b.id)}><ShoppingCart size={14} aria-hidden="true"/>{added===b.id?'Added':'Add to Cart'}</button>
  <a className="btn btn-whatsapp btn-sm col-span-2" href={waLink(`Hi, I want to buy this book: ${b.title}. Please share the purchase details.`)} target="_blank" rel="noreferrer"><MessageCircle size={14} aria-hidden="true"/>WhatsApp</a></div></article>)}</div>
 {books&&books.length>=limit&&<div className="mt-8 text-center"><button className="btn btn-outline btn-lg" onClick={()=>setLimit(limit+24)}>Load more</button></div>}</section>}
