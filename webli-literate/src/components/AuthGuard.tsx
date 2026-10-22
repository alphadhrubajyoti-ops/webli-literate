import {ReactNode,useEffect,useState} from 'react';import {Navigate,useLocation} from 'react-router-dom';import type {Session} from '@supabase/supabase-js';import {supabase} from '../lib/supabase';
export function useSession(){const [s,setS]=useState<Session|null>(null);const [loading,setL]=useState(true);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setS(data.session);setL(false)});const {data}=supabase.auth.onAuthStateChange((_e,x)=>setS(x));return()=>data.subscription.unsubscribe()},[]);return{session:s,loading}}
export default function AuthGuard({children}:{children:ReactNode}){const {session,loading}=useSession();const loc=useLocation();
 if(loading)return <p style={{padding:24}}>Loading…</p>;
 if(!session){sessionStorage.setItem('wl_next',loc.pathname+loc.search);return <Navigate to="/login" replace/>}return <>{children}</>}
