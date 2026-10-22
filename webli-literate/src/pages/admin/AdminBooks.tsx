import {useEffect,useState} from 'react';import {Link,useNavigate,useParams} from 'react-router-dom';import {supabase} from '../../lib/supabase';import {inr,finalPaise} from '../../lib/brand';import {audit} from '../../lib/admin';import {toPaise} from '../../lib/validate.js';import {saveBook} from '../../lib/bookSave.js';
export function BookList(){const [rows,setRows]=useState<any[]>([]);const [q,setQ]=useState('');const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
 const load=()=>{let r=supabase.from('books').select('*,categories(name)').order('created_at',{ascending:false}).limit(200);if(q.trim())r=r.or(`title.ilike.%${q.replace(/[%,()]/g,' ')}%,author.ilike.%${q.replace(/[%,()]/g,' ')}%`);r.then(({data,error})=>error?setErr(error.message):setRows(data||[]))};
 useEffect(load,[q]);
 const set=async(b:any,patch:any,action:string)=>{setBusy(true);setErr('');
  if(patch.published&&!(await supabase.from('book_files').select('book_id').eq('book_id',b.id)).data?.length){setErr('Upload the full PDF before publishing.');setBusy(false);return}
  const {error}=await supabase.from('books').update(patch).eq('id',b.id);if(error)setErr(error.message);else{await audit(action,{book_id:b.id});load()}setBusy(false)};
 return <div><h2>Books</h2><Link to="/admin/books/new"><button>+ Add book</button></Link> <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title or author" aria-label="Search books"/>{err&&<p role="alert">{err}</p>}
 <table style={{width:'100%',marginTop:12,borderCollapse:'collapse'}}><tbody>{rows.map(b=><tr key={b.id} style={{borderBottom:'1px solid #eee',opacity:b.archived?.5:1}}><td>{b.title}<br/><small>{b.author} · {b.categories?.name||'No category'}</small></td><td>{inr(finalPaise(b.original_price_paise,b.discount_percent,b.sale_price_paise))}</td><td>{b.archived?'Archived':b.published?'Published':'Draft'}</td>
 <td style={{whiteSpace:'nowrap'}}><Link to={`/admin/books/${b.id}`}>Edit</Link> <Link to={`/books/${b.id}`}>View</Link>
 <button disabled={busy||b.archived} onClick={()=>set(b,{published:!b.published},b.published?'unpublish':'publish')}>{b.published?'Unpublish':'Publish'}</button>
 <button disabled={busy} onClick={()=>set(b,{featured:!b.featured},'feature_toggle')}>{b.featured?'Unfeature':'Feature'}</button>
 <button disabled={busy} onClick={()=>set(b,{purchasable:!b.purchasable},'purchasable_toggle')}>{b.purchasable?'Disable sales':'Enable sales'}</button>
 {b.archived?<button disabled={busy} onClick={()=>set(b,{archived:false},'unarchive')}>Restore</button>:<button disabled={busy} onClick={()=>confirm('Archive this book? It will be hidden from the store; past orders are kept.')&&set(b,{archived:true,published:false},'archive')}>Archive</button>}</td></tr>)}</tbody></table>{!rows.length&&<p>No books yet.</p>}</div>}
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
 const L=({t,children}:any)=><label style={{display:'block',margin:'8px 0'}}>{t}<br/>{children}</label>;
 return <div style={{maxWidth:640}}><h2>{isNew?'Add book':'Edit book'}</h2>{errs.map((x,i)=><p role="alert" key={i} style={{color:'#b00020'}}>{x}</p>)}{status&&<p role="status">{status}</p>}
 <L t="Title"><input value={f.title} onChange={u('title')} style={{width:'100%'}}/></L><L t="Author"><input value={f.author} onChange={u('author')} style={{width:'100%'}}/></L>
 <L t="Description"><textarea value={f.description} onChange={u('description')} rows={5} style={{width:'100%'}}/></L>
 <L t="Category"><select value={f.category_id} onChange={u('category_id')}><option value="">None</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
 <L t="Language"><input value={f.language} onChange={u('language')}/></L><L t="Page count"><input type="number" min={1} value={f.page_count} onChange={u('page_count')}/></L>
 <L t="Original price (₹)"><input type="number" min={0} step="0.01" value={f.original} onChange={u('original')}/></L><L t="Discount %"><input type="number" min={0} max={100} value={f.discount} onChange={u('discount')}/></L>
 <L t="Final selling price override (₹, optional — leave blank to use the discount)"><input type="number" min={0} step="0.01" value={f.sale} onChange={u('sale')}/></L><p>Customer pays: <b>{inr(calc)}</b></p>
 <L t={`Cover image (PNG/JPG/WebP, max 2 MB)${cover?' — current cover set':''}`}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFiles({...files,cover:e.target.files?.[0]})}/></L>
 <L t="Sample pages (images or PDF, max 10 MB each)"><input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>setFiles({...files,prev:Array.from(e.target.files||[])})}/></L>
 {prev.map((p,i)=><p key={p}><small>Sample {i+1}</small> <button type="button" onClick={()=>setPrev(prev.filter(x=>x!==p))}>Remove (save to apply)</button></p>)}
 <L t={`Full book PDF (private, max 50 MB)${hasPdf?' — a PDF is on file; choose a file to replace it':''}`}><input type="file" accept="application/pdf" onChange={e=>setFiles({...files,pdf:e.target.files?.[0]})}/></L>
 <label><input type="checkbox" checked={f.published} onChange={u('published')}/> Published</label><br/><label><input type="checkbox" checked={f.purchasable} onChange={u('purchasable')}/> Purchases enabled</label><br/><label><input type="checkbox" checked={f.featured} onChange={u('featured')}/> Featured on homepage</label>
 <p><button onClick={save} disabled={busy} style={{minHeight:44}}>{busy?'Saving…':'Save book'}</button> <Link to="/admin/books">Back to list</Link></p></div>}
