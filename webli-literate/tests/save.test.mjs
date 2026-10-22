import test from 'node:test';import assert from 'node:assert';import {saveBook} from '../src/lib/bookSave.js';
const mk=(failUpload)=>{const calls=[];const client={from:t=>({upsert:async r=>{calls.push(['upsert',t,r]);return{}},update:r=>({eq:async()=>{calls.push(['update',t,r]);return{}}}),select:()=>({eq:()=>({maybeSingle:async()=>({data:{pdf_path:'old/x.pdf'}})})})}),
 storage:{from:b=>({upload:async(p,f,o)=>{calls.push(['upload',b,p,o.contentType]);return failUpload===b?{error:{message:'boom'}}:{}},getPublicUrl:p=>{calls.push(['public',b]);return{data:{publicUrl:`https://pub/${b}/${p}`}}},remove:async ps=>{calls.push(['remove',b,ps]);return{}}})}};return{client,calls}};
const form={title:'T',author:'A',description:'',category_id:'',language:'English',page_count:'',original:'499',discount:'20',sale:'',published:true,purchasable:true,featured:false};
const F=(name,type,size=1000)=>({name,type,size});let n=0;const uuid=()=>'u'+(++n);
const args=(client,files)=>({client,id:'book1',form,existing:{cover:'',prev:[],hasPdf:false},files,uuid});
test('stores cover/previews publicly, full PDF privately, in a safe order',async()=>{const {client,calls}=mk();
 const r=await saveBook(args(client,{cover:F('c.png','image/png'),prev:[F('s1.jpg','image/jpeg'),F('s.pdf','application/pdf')],pdf:F('book.pdf','application/pdf')}));assert.equal(r.ok,true);
 assert.deepEqual(calls.filter(c=>c[0]==='upload').map(c=>c[1]),['covers','previews','previews','book-files']);
 assert.ok(!calls.some(c=>c[0]==='public'&&c[1]==='book-files'));
 const bf=calls.find(c=>c[1]==='book_files');assert.match(bf[2].pdf_path,/^book1\/u\d+\.pdf$/);
 const first=calls.find(c=>c[1]==='books');assert.ok(!('published' in first[2]));assert.equal(first[2].original_price_paise,49900);
 const fin=calls.filter(c=>c[0]==='update'&&c[1]==='books').pop()[2];assert.equal(fin.published,true);assert.equal(fin.preview_urls.length,2);assert.ok(fin.cover_url.startsWith('https://pub/covers/'));assert.ok(!JSON.stringify(fin).includes('book-files'));
 assert.ok(calls.findIndex(c=>c[1]==='book_files')<calls.findIndex(c=>c[0]==='update'));assert.deepEqual(calls.find(c=>c[0]==='remove')[2],['old/x.pdf'])});
test('invalid files / missing PDF are rejected before any write',async()=>{const {client,calls}=mk();
 assert.equal((await saveBook(args(client,{prev:[],pdf:F('a.exe','application/x-msdownload')}))).ok,false);assert.equal((await saveBook(args(client,{prev:[]}))).ok,false);assert.equal((await saveBook(args(client,{prev:[],pdf:F('big.pdf','application/pdf',60e6)}))).ok,false);assert.equal(calls.length,0)});
test('failed PDF upload throws and never publishes or stores a path',async()=>{const {client,calls}=mk('book-files');await assert.rejects(saveBook(args(client,{prev:[],pdf:F('b.pdf','application/pdf')})),/Upload failed/);assert.ok(!calls.some(c=>c[1]==='book_files'));assert.ok(!calls.some(c=>c[0]==='update'))});
