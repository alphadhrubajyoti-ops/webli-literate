import {useEffect,useState} from 'react';import {Link,useNavigate,useParams} from 'react-router-dom';import {supabase} from '../../lib/supabase';import {inr,finalPaise} from '../../lib/brand';import {audit} from '../../lib/admin';import {toPaise} from '../../lib/validate.js';import {saveBook} from '../../lib/bookSave.js';import {Plus} from 'lucide-react';import {Alert,Empty,PageHead} from '../../components/ui';
export function BookList(){const [rows,setRows]=useState<any[]>([]);const [q,setQ]=useState('');const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
 const load=()=>{let r=supabase.from('books').select('*,categories(name)').order('created_at',{ascending:false}).limit(200);if(q.trim())r=r.or(`title.ilike.%${q.replace(/[%,()]/g,' ')}%,author.ilike.%${q.replace(/[%,()]/g,' ')}%`);r.then(({data,error})=>error?setErr(error.message):setRows(data||[]))};
 useEffect(load,[q]);
 const set=async(b:any,patch:any,action:string)=>{setBusy(true);setErr('');
  if(patch.published&&!(await supabase.from('book_files').select('book_id').eq('book_id',b.id)).data?.length){setErr('Upload the full PDF before publishing.');setBusy(false);return}
  const {error}=await supabase.from('books').update(patch).eq('id',b.id);if(error)setErr(error.message);else{await audit(action,{book_id:b.id});load()}setBusy(false)};
 return <div><PageHead title="Books"><Link to="/admin/books/new" className="btn btn-primary"><Plus size={16} aria-hidden="true"/>Add book</Link></PageHead>
 <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title or author" aria-label="Search books" className="input mb-4 max-w-md"/>{err&&<div className="mb-4"><Alert>{err}</Alert></div>}
 {rows.length>0&&<div className="table-wrap"><table className="table"><thead><tr><th>Book</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(b=><tr key={b.id} className={b.archived?'opacity-60':''}><td><p className="font-semibold">{b.title}</p><p className="text-xs text-slate-600">{b.author} · {b.categories?.name||'No category'}</p></td><td className="whitespace-nowrap font-semibold">{inr(finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise))}</td><td><span className={`badge ${b.archived?'badge-muted':b.published?'badge-ok':'badge-warn'}`}>{b.archived?'Archived':b.published?'Published':'Draft'}</span>{b.featured&&<span className="badge badge-sale ml-1">Featured</span>}</td>
 <td><div className="flex flex-wrap gap-1.5"><Link className="btn btn-outline btn-sm" to={`/admin/books/${b.id}`}>Edit</Link><Link className="btn btn-ghost btn-sm" to={`/books/${b.id}`}>View</Link>
 <button className="btn btn-outline btn-sm" disabled={busy||b.archived} onClick={()=>set(b,{published:!b.published},b.published?'unpublish':'publish')}>{b.published?'Unpublish':'Publish'}</button>
 <button className="btn btn-outline btn-sm" disabled={busy} onClick={()=>set(b,{featured:!b.featured},'feature_toggle')}>{b.featured?'Unfeature':'Feature'}</button>
 <button className="btn btn-outline btn-sm" disabled={busy} onClick={()=>set(b,{purchasable:!b.purchasable},'purchasable_toggle')}>{b.purchasable?'Disable sales':'Enable sales'}</button>
 {b.archived?<button className="btn btn-outline btn-sm" disabled={busy} onClick={()=>set(b,{archived:false},'unarchive')}>Restore</button>:<button className="btn btn-danger btn-sm" disabled={busy} onClick={()=>confirm('Archive this book? It will be hidden from the store; past orders are kept.')&&set(b,{archived:true,published:false},'archive')}>Archive</button>}</div></td></tr>)}</tbody></table></div>}{!rows.length&&<Empty title="No books yet">Use Add book to create your first one.</Empty>}</div>}
export function BookForm(){const {id}=useParams();const nav=useNavigate();const isNew=id==='new';const [bid]=useState(isNew?crypto.randomUUID():id!);
 const [f,setF]=useState<any>({title:'',author:'',description:'',category_id:'',language:'English',page_count:'',original:'',discount:'0',sale:'',published:false,purchasable:true,featured:false});
 const [cats,setCats]=useState<any[]>([]);const [cover,setCover]=useState('');const [prev,setPrev]=useState<string[]>([]);const [hasPdf,setHasPdf]=useState(false);
 const [files,setFiles]=useState<{cover?:File;prev:File[];pdf?:File}>({prev:[]});const [errs,setErrs]=useState<string[]>([]);const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{supabase.from('categories').select('id,name').order('name').then(({data})=>setCats(data||[]));if(isNew)return;
  supabase.from('books').select('*').eq('id',bid).single().then(({data:b,error})=>{if(error||!b){setErrs(['Book not found']);return}
   setF({title:b.title,author:b.author,description:b.description||'',category_id:b.category_id||'',language:b.language||'',page_count:b.page_count??'',original:String(b.original_price_paise/100),discount:String(b.discount_percent),sale:b.sale_price_paise==null?'':String(b.sale_price_paise/100),published:b.published,purchasable:b.purchasable,featured:b.featured});setCover(b.cover_url||'');setPrev(b.preview_urls||[])});
  supabase.from('book_files').select('book_id').eq('book_id',bid).then(({data})=>setHasPdf(!!data?.length))},[]);
 const u=(k:string)=>(e:any)=>setF({...f,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
 const o=toPaise(f.original);const calc=Number.isFinite(o)?finalPaise(o,Number(f.discount)||0,f.sale===''?null:toPaise(f.sale)):0;
 const save=async()=>{setErrs([]);setStatus('');setBusy(true);
  try{const r:any=await saveBook({client:supabase,id:bid,form:f,existing:{cover,prev,hasPdf},files,onStatus:setStatus});
   if(!r.ok){setErrs(r.errors);setStatus('')}else{await audit(isNew?'book_create':'book_update',{book_id:bid});setStatus('Saved.');setFiles({prev:[]});setCover(r.coverUrl);setPrev(r.previews);setHasPdf(r.hasPdf);if(isNew)nav(`/admin/books/${bid}`,{replace:true})}
  }catch(x:any){setErrs([x.message]);setStatus('')}setBusy(false)};
 const L=({t,hint,children}:any)=><label className="block"><span className="label">{t}{hint&&<span className="hint">{hint}</span>}</span>{children}</label>;
 return <div className="max-w-3xl"><PageHead title={isNew?'Add book':'Edit book'}><Link to="/admin/books" className="btn btn-outline">Back to list</Link></PageHead>
 <div className="mb-4 space-y-2">{errs.map((x,i)=><Alert key={i}>{x}</Alert>)}{status&&<Alert kind="ok">{status}</Alert>}</div>
 <div className="space-y-6">
 <section className="panel space-y-4"><h2 className="text-lg font-extrabold">Details</h2>
 <L t="Title"><input value={f.title} onChange={u('title')} className="input"/></L><L t="Author"><input value={f.author} onChange={u('author')} className="input"/></L>
 <L t="Description"><textarea value={f.description} onChange={u('description')} rows={5} className="input"/></L>
 <div className="grid gap-4 sm:grid-cols-3"><L t="Category"><select value={f.category_id} onChange={u('category_id')} className="input"><option value="">None</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
 <L t="Language"><input value={f.language} onChange={u('language')} className="input"/></L><L t="Page count"><input type="number" min={1} value={f.page_count} onChange={u('page_count')} className="input"/></L></div></section>
 <section className="panel space-y-4"><h2 className="text-lg font-extrabold">Pricing</h2>
 <div className="grid gap-4 sm:grid-cols-2"><L t="Original price (₹)"><input type="number" min={0} step="0.01" value={f.original} onChange={u('original')} className="input"/></L><L t="Discount %"><input type="number" min={0} max={100} value={f.discount} onChange={u('discount')} className="input"/></L></div>
 <L t="Final selling price override (₹, optional)" hint="Leave blank to use the discount."><input type="number" min={0} step="0.01" value={f.sale} onChange={u('sale')} className="input max-w-xs"/></L>
 <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm">Customer pays: <b className="font-display text-lg">{inr(calc)}</b></p></section>
 <section className="panel space-y-4"><h2 className="text-lg font-extrabold">Files</h2>
 <L t="Cover image" hint={`PNG/JPG/WebP, max 2 MB${cover?' — current cover set':''}`}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFiles({...files,cover:e.target.files?.[0]})} className="input"/></L>
 <L t="Sample pages" hint="Images or PDF, max 10 MB each"><input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>setFiles({...files,prev:Array.from(e.target.files||[])})} className="input"/></L>
 {prev.length>0&&<ul className="space-y-2">{prev.map((p,i)=><li key={p} className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 px-3 py-2 text-sm"><span>Sample {i+1}</span><button type="button" className="btn btn-danger btn-sm" onClick={()=>setPrev(prev.filter(x=>x!==p))}>Remove (save to apply)</button></li>)}</ul>}
 <L t="Full book PDF" hint={`Private, max 50 MB${hasPdf?' — a PDF is on file; choose a file to replace it':''}`}><input type="file" accept="application/pdf" onChange={e=>setFiles({...files,pdf:e.target.files?.[0]})} className="input"/></L></section>
 <section className="panel space-y-3"><h2 className="text-lg font-extrabold">Visibility</h2>
 <label className="check"><input type="checkbox" checked={f.published} onChange={u('published')}/> Published</label><label className="check"><input type="checkbox" checked={f.purchasable} onChange={u('purchasable')}/> Purchases enabled</label><label className="check"><input type="checkbox" checked={f.featured} onChange={u('featured')}/> Featured on homepage</label></section>
 <div className="flex flex-wrap items-center gap-3"><button onClick={save} disabled={busy} className="btn btn-primary btn-lg">{busy?'Saving…':'Save book'}</button><Link to="/admin/books" className="btn btn-ghost btn-lg">Back to list</Link></div></div></div>}
