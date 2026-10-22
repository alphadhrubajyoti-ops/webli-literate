import {useState} from 'react';import {Navigate} from 'react-router-dom';import BrandLogo from '../components/BrandLogo';import {useSession} from '../components/AuthGuard';import {supabase,configured} from '../lib/supabase';
export default function Login(){const {session,loading}=useSession();const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
 if(!loading&&session){const n=sessionStorage.getItem('wl_next')||'/';sessionStorage.removeItem('wl_next');return <Navigate to={n} replace/>}
 const go=async()=>{setErr('');if(!configured)return setErr('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');setBusy(true);
  const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/login'}});if(error){setErr(error.message);setBusy(false)}};
 return <main style={{maxWidth:420,margin:'10vh auto',padding:24,textAlign:'center'}}><BrandLogo height={72}/><h1>Welcome to Webli Literate</h1><p>Sign in to discover, purchase, and read your books.</p>
  <button onClick={go} disabled={busy} style={{padding:'12px 20px',fontSize:16,minHeight:44,cursor:'pointer'}}>{busy?'Redirecting…':'Continue with Google'}</button>{err&&<p role="alert" style={{color:'#b00020'}}>{err}</p>}</main>}
