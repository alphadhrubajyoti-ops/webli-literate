import {useState} from 'react';import {LOGO_PATH} from '../lib/brand';
export default function BrandLogo({height=40}:{height?:number}){const [ok,setOk]=useState(true);
 return <div style={{height,minWidth:height*2,display:'inline-flex'}} aria-label="Webli Literate">{ok&&<img src={LOGO_PATH} alt="Webli Literate" height={height} style={{height,width:'auto',objectFit:'contain'}} onError={()=>setOk(false)}/>}</div>}
