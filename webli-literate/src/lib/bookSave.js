import {validateBook,toPaise,checkFile} from './validate.js';
const extOf=n=>(String(n).split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';
/** Save order: metadata (published untouched) -> uploads -> private pdf path -> final update (urls + published). Full PDFs never get a public URL. */
export async function saveBook({client,id,form,existing,files,onStatus=(_msg)=>{},uuid=()=>crypto.randomUUID()}){
 const errors=validateBook({...form,hasPdf:existing.hasPdf||!!files.pdf});
 for(const [k,f] of [['cover',files.cover],...files.prev.map(p=>['preview',p]),['pdf',files.pdf]])if(f){const b=checkFile(k,f);if(b)errors.push(b)}
 if(errors.length)return{ok:false,errors};
 const up=async(bucket,file)=>{onStatus(`Uploading ${file.name}…`);const path=`${id}/${uuid()}.${extOf(file.name)}`;
  const {error}=await client.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(error)throw new Error(`Upload failed (${file.name}): ${error.message}`);
  return{path,url:bucket==='book-files'?'':client.storage.from(bucket).getPublicUrl(path).data.publicUrl}};
 const chk=r=>{if(r&&r.error)throw new Error(r.error.message)};
 chk(await client.from('books').upsert({id,title:form.title.trim(),author:form.author.trim(),description:form.description,category_id:form.category_id||null,language:form.language||null,page_count:form.page_count===''?null:Number(form.page_count),
  original_price_paise:toPaise(form.original),discount_percent:Number(form.discount)||0,sale_price_paise:form.sale===''?null:toPaise(form.sale),purchasable:form.purchasable,featured:form.featured}));
 let coverUrl=existing.cover,previews=[...existing.prev],hasPdf=existing.hasPdf;
 if(files.cover)coverUrl=(await up('covers',files.cover)).url;
 for(const p of files.prev)previews.push((await up('previews',p)).url);
 if(files.pdf){const old=await client.from('book_files').select('pdf_path').eq('book_id',id).maybeSingle();const n=await up('book-files',files.pdf);
  chk(await client.from('book_files').upsert({book_id:id,pdf_path:n.path}));hasPdf=true;if(old&&old.data&&old.data.pdf_path)await client.storage.from('book-files').remove([old.data.pdf_path])}
 chk(await client.from('books').update({cover_url:coverUrl||null,preview_urls:previews,published:form.published}).eq('id',id));
 return{ok:true,coverUrl,previews,hasPdf};
}
