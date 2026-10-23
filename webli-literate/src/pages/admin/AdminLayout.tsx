import {ReactNode,useEffect,useState} from 'react';import {Link,NavLink,Outlet} from 'react-router-dom';import {LayoutDashboard,BookCopy,Receipt,Tags,Settings as Cog,Store} from 'lucide-react';import {supabase} from '../../lib/supabase';import BrandLogo from '../../components/BrandLogo';import {Loading,Alert} from '../../components/ui';
export function AdminGuard({children}:{children:ReactNode}){const [ok,setOk]=useState<boolean|null>(null);
 useEffect(()=>{supabase.rpc('is_admin').then(({data})=>setOk(data===true))},[]);
 if(ok===null)return <Loading text="Checking access…"/>;
 if(!ok)return <div className="container-page max-w-lg py-16"><Alert>Admin access required. <Link to="/" className="font-semibold underline">Back to store</Link></Alert></div>;return <>{children}</>}
const items:[string,string,typeof Cog,boolean][]=[['/admin','Dashboard',LayoutDashboard,true],['/admin/books','Books',BookCopy,false],['/admin/orders','Orders',Receipt,false],['/admin/categories','Categories',Tags,false],['/admin/settings','Settings',Cog,false]];
export default function AdminLayout(){const cls=({isActive}:{isActive:boolean})=>`nav-link flex items-center gap-2 whitespace-nowrap ${isActive?'nav-link-active':''}`;
 return <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[240px_1fr]">
  <aside className="border-b border-brand-100 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
   <div className="flex items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-start lg:gap-1 lg:px-5 lg:py-5"><BrandLogo height={40}/><span className="badge badge-info">Admin</span></div>
   <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin">
    {items.map(([to,t,Icon,end])=><NavLink key={to} to={to} end={end} className={cls}><Icon size={17} aria-hidden="true"/>{t}</NavLink>)}
    <Link to="/" className="nav-link flex items-center gap-2 whitespace-nowrap lg:mt-4 lg:border-t lg:border-brand-100 lg:pt-4"><Store size={17} aria-hidden="true"/>View store</Link>
   </nav></aside>
  <main className="min-w-0 p-4 sm:p-6 lg:p-8"><Outlet/></main></div>}
