import {ReactNode,useEffect,useState} from 'react';import {Link,NavLink,useLocation} from 'react-router-dom';import {Menu,X,ShoppingBag,LogOut,ShieldCheck,Mail} from 'lucide-react';
import {useSession} from './AuthGuard';import BrandLogo from './BrandLogo';import {supabase} from '../lib/supabase';import {useCart} from '../lib/cart';import {waLink} from '../lib/brand';

const links:[string,string][]=[['/','Home'],['/books','Books'],['/purchases','My Purchases'],['/contact','Contact Us']];

export default function Layout({children}:{children:ReactNode}){
 const n=useCart().length;const {session}=useSession();const [adm,setAdm]=useState(false);const [open,setOpen]=useState(false);const loc=useLocation();
 useEffect(()=>{supabase.rpc('is_admin').then(({data})=>setAdm(data===true))},[]);
 useEffect(()=>{setOpen(false);window.scrollTo(0,0)},[loc.pathname]);
 const email=session?.user?.email||'';const cls=({isActive}:{isActive:boolean})=>`nav-link ${isActive?'nav-link-active':''}`;
 return <div className="flex min-h-screen flex-col">
  <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
  <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 backdrop-blur">
   <div className="container-page flex h-16 items-center gap-3">
    <Link to="/" aria-label="Webli Literate home" className="mr-2 shrink-0"><BrandLogo height={46}/></Link>
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
     {links.map(([to,t])=><NavLink key={to} to={to} end={to==='/'} className={cls}>{t}</NavLink>)}
     {adm&&<NavLink to="/admin" className={cls}>Admin</NavLink>}
    </nav>
    <div className="ml-auto flex items-center gap-2">
     <Link to="/cart" className="btn btn-outline relative" aria-label={`Purchase cart${n>0?`, ${n} item${n>1?'s':''}`:''}`}><ShoppingBag size={18} aria-hidden="true"/><span className="hidden sm:inline">Purchase</span>{n>0&&<span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-spark-500 px-1 text-xs font-bold text-ink">{n}</span>}</Link>
     {session&&<button className="btn btn-ghost hidden md:inline-flex" onClick={()=>supabase.auth.signOut()} title={email}><LogOut size={16} aria-hidden="true"/>Sign out</button>}
     <button className="btn btn-ghost px-2 md:hidden" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button>
    </div>
   </div>
   {open&&<nav className="border-t border-brand-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
    <div className="flex flex-col gap-1">
     {links.map(([to,t])=><NavLink key={to} to={to} end={to==='/'} className={cls}>{t}</NavLink>)}
     {adm&&<NavLink to="/admin" className={cls}>Admin</NavLink>}
     {session&&<button className="nav-link text-left" onClick={()=>supabase.auth.signOut()}>Sign out{email&&<span className="ml-1 font-normal text-slate-500">({email})</span>}</button>}
    </div>
   </nav>}
  </header>
  <main id="main" className="flex-1">{children}</main>
  <footer className="mt-16 bg-brand-900 text-brand-100">
   <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
    <div className="lg:col-span-2">
     <p className="font-display text-xl font-extrabold text-white">Webli Literate</p>
     <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-200">Digital books you can buy once and read any time from My Purchases.</p>
     <a href={waLink('Hi, I have a question about Webli Literate.')} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-spark-400 hover:text-spark-100"><Mail size={16} aria-hidden="true"/>Chat with us on WhatsApp</a>
    </div>
    <div><p className="mb-3 text-sm font-bold text-white">Shop</p><ul className="space-y-2 text-sm"><li><Link className="hover:text-white" to="/books">All books</Link></li><li><Link className="hover:text-white" to="/purchases">My Purchases</Link></li><li><Link className="hover:text-white" to="/contact">Contact Us</Link></li></ul></div>
    <div><p className="mb-3 text-sm font-bold text-white">Policies</p><ul className="space-y-2 text-sm"><li><Link className="hover:text-white" to="/policy/terms">Terms</Link></li><li><Link className="hover:text-white" to="/policy/privacy">Privacy</Link></li><li><Link className="hover:text-white" to="/policy/refund">Refunds</Link></li><li><Link className="hover:text-white" to="/policy/copyright">Copyright</Link></li></ul></div>
   </div>
   <div className="border-t border-white/10 py-4 text-center text-xs text-brand-200">© {new Date().getFullYear()} Webli Literate</div>
  </footer>
 </div>}
