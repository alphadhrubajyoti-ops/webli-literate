import {ReactNode,useEffect,useState} from 'react';import {Link,Outlet} from 'react-router-dom';import {supabase} from '../../lib/supabase';import BrandLogo from '../../components/BrandLogo';
export function AdminGuard({children}:{children:ReactNode}){const [ok,setOk]=useState<boolean|null>(null);
 useEffect(()=>{supabase.rpc('is_admin').then(({data})=>setOk(data===true))},[]);
 if(ok===null)return <p style={{padding:24}}>Checking access…</p>;
 if(!ok)return <p role="alert" style={{padding:24}}>Admin access required. <Link to="/">Back to store</Link></p>;return <>{children}</>}
export default function AdminLayout(){return <div><header style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'center',padding:'8px 16px',background:'#f4f6fb'}}><BrandLogo height={32}/><strong>Admin</strong>
 <nav style={{display:'flex',flexWrap:'wrap',gap:14}}><Link to="/admin">Dashboard</Link><Link to="/admin/books">Books</Link><Link to="/admin/orders">Orders</Link><Link to="/admin/categories">Categories</Link><Link to="/admin/settings">Settings</Link><Link to="/">View store</Link></nav></header><main style={{padding:16,overflowX:'auto'}}><Outlet/></main></div>}
