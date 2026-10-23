import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined,key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const configured=!!(url&&key);
export const supabase=createClient(url||'http://localhost',key||'missing',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function api(path:string,body:unknown){const {data}=await supabase.auth.getSession();
 const r=await fetch('/api/'+path,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+(data.session?.access_token||'')},body:JSON.stringify(body)});
 const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j}
