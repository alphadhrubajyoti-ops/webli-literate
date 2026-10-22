import {supabase} from './supabase';
export async function audit(action:string,detail:object={}){const {data}=await supabase.auth.getUser();if(data.user)await supabase.from('admin_audit_logs').insert({admin_id:data.user.id,action,detail})}
export const csv=(rows:any[][])=>rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n');
