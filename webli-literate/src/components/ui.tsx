import {ReactNode} from 'react';import {BookOpen,AlertCircle,CheckCircle2,Info,Loader2} from 'lucide-react';import {inr,finalPaise} from '../lib/brand';

export function BookCover({url,title,className=''}:{url?:string|null;title:string;className?:string}){
 return <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-brand-50 ${className}`}>{url?<img src={url} alt={title} loading="lazy" className="h-full w-full object-cover"/>:<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-brand-100 to-teal-100 p-4 text-center text-brand-700"><BookOpen size={32} aria-hidden="true"/><span className="font-display text-sm font-bold leading-snug">{title}</span></div>}</div>}

export function Price({o,d,s,large=false}:{o:number;d:number;s?:number|null;large?:boolean}){
 const f=finalPaise(o,d,s);
 return <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1"><strong className={`font-display font-extrabold text-ink ${large?'text-3xl':'text-lg'}`}>{inr(f)}</strong>{f<o&&<s className="text-sm text-slate-500">{inr(o)}</s>}{d>0&&<span className="badge badge-sale">{d}% off</span>}</span>}

export function Loading({text='Loading…'}:{text?:string}){return <div role="status" className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-600"><Loader2 className="animate-spin" size={18} aria-hidden="true"/>{text}</div>}

export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center"><BookOpen className="mx-auto mb-3 text-brand-300" size={36} aria-hidden="true"/><p className="font-display text-lg font-bold">{title}</p>{children&&<div className="mt-2 text-sm text-slate-600">{children}</div>}</div>}

export function Alert({kind='error',children}:{kind?:'error'|'ok'|'info';children:ReactNode}){
 const Icon=kind==='error'?AlertCircle:kind==='ok'?CheckCircle2:Info;
 return <div role={kind==='error'?'alert':'status'} className={`alert alert-${kind}`}><Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true"/><div className="min-w-0 flex-1 break-words">{children}</div></div>}

export function PageHead({title,children}:{title:string;children?:ReactNode}){return <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="page-title">{title}</h1>{children}</div>}

export const statusBadge=(s:string)=>({paid:'badge-ok',pending:'badge-warn',failed:'badge-bad',refunded:'badge-muted'} as Record<string,string>)[s]||'badge-muted';
