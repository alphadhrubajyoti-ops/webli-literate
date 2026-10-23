import {useState} from 'react';import {LOGO_PATH} from '../lib/brand';
export default function BrandLogo({height=40}:{height?:number}){const [ok,setOk]=useState(true);
 return <span className="inline-flex items-center" style={{height}} aria-label="Webli Literate">{ok?<img src={LOGO_PATH} alt="Webli Literate" height={height} style={{height,width:'auto'}} className="object-contain" onError={()=>setOk(false)}/>:<span className="font-display text-lg font-extrabold text-brand-600">Webli Literate</span>}</span>}
