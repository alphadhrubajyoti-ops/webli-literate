import {PF,json,sb,userFrom} from './_lib';
export const onRequestPost:PF=async({request,env})=>{
 const user=await userFrom(env,request);if(!user)return json({error:'Sign in required'},401);
 const {bookId}=await request.json().catch(()=>({})) as {bookId?:string};if(!bookId||!/^[0-9a-f-]{36}$/.test(bookId))return json({error:'Bad request'},400);
 const e=await(await sb(env,`entitlements?user_id=eq.${user.id}&book_id=eq.${bookId}&revoked=eq.false&select=book_id`)).json() as any[];
 if(!e.length)return json({error:'You do not own this book'},403);
 const f=((await(await sb(env,`book_files?book_id=eq.${bookId}&select=pdf_path`)).json()) as any[])[0];if(!f)return json({error:'File missing'},404);
 const r=await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/book-files/${f.pdf_path}`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'content-type':'application/json'},body:JSON.stringify({expiresIn:300})});
 if(!r.ok)return json({error:'Could not sign URL'},502);const s=await r.json() as {signedURL:string};
 return json({url:`${env.SUPABASE_URL}/storage/v1${s.signedURL}`});
};
