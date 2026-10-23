import {useEffect,useState} from 'react';import {useParams} from 'react-router-dom';import {Mail,MessageCircle} from 'lucide-react';import {supabase} from '../lib/supabase';import {WHATSAPP} from '../lib/brand';import {Loading,Alert} from '../components/ui';
const TITLES:Record<string,string>={terms:'Terms and Conditions',privacy:'Privacy Policy',refund:'Refund and Cancellation Policy',copyright:'Digital Product Usage and Copyright Policy'};
export function Policy(){const {key}=useParams();const [t,setT]=useState<string|null>(null);
 useEffect(()=>{setT(null);supabase.from('store_settings').select('value').eq('key','policy_'+key).maybeSingle().then(({data})=>setT(data?.value||''))},[key]);
 return <section className="container-page max-w-3xl py-8"><h1 className="page-title capitalize">{TITLES[key||'']||key}</h1>{t===null?<Loading/>:<div className="panel mt-6"><p className="whitespace-pre-wrap leading-relaxed text-slate-700">{t||'This policy has not been published yet. (Template pending review by the store owner.)'}</p></div>}</section>}
export function Contact(){const [s,setS]=useState<Record<string,string>>({});const [name,setName]=useState('');const [m,setM]=useState('');const [msg,setMsg]=useState('');const [ok,setOk]=useState(false);
 useEffect(()=>{supabase.from('store_settings').select('*').then(({data})=>setS(Object.fromEntries((data||[]).map((r:any)=>[r.key,r.value]))))},[]);
 const send=async()=>{setOk(false);if(!name.trim()||m.trim().length<5)return setMsg('Enter your name and a message (5+ characters).');const {data}=await supabase.auth.getUser();
  const {error}=await supabase.from('contact_messages').insert({user_id:data.user!.id,name:name.trim(),message:m.trim()});setMsg(error?'Could not send (you may have hit the hourly limit): '+error.message:'Message sent. We will get back to you.');if(!error){setOk(true);setName('');setM('')}};
 return <section className="container-page max-w-4xl py-8"><h1 className="page-title">Contact Us</h1>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
  <div className="panel"><h2 className="text-lg font-extrabold">Get in touch</h2>{s.contact_info&&<p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-700">{s.contact_info}</p>}
   <div className="mt-4 flex flex-col gap-2">{s.support_email&&<a className="btn btn-outline justify-start" href={`mailto:${s.support_email}`}><Mail size={16} aria-hidden="true"/>{s.support_email}</a>}<a className="btn btn-whatsapp justify-start" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true"/>Chat on WhatsApp</a></div></div>
  <div className="panel"><h2 className="text-lg font-extrabold">Send a message</h2>
   <div className="mt-3 space-y-3"><div><label htmlFor="cname" className="label">Your name</label><input id="cname" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" aria-label="Name" maxLength={100} className="input"/></div>
   <div><label htmlFor="cmsg" className="label">Message</label><textarea id="cmsg" value={m} onChange={e=>setM(e.target.value)} placeholder="How can we help?" aria-label="Message" rows={5} maxLength={2000} className="input"/></div>
   <button onClick={send} className="btn btn-primary btn-lg w-full">Send message</button>{msg&&<Alert kind={ok?'ok':'error'}>{msg}</Alert>}</div></div></div></section>}
