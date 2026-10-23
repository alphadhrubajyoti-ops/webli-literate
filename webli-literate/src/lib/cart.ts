import {useEffect,useState} from 'react';
const K='wl_cart';const read=():string[]=>{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return[]}};
export const cartIds=read;
export function setCart(ids:string[]){localStorage.setItem(K,JSON.stringify([...new Set(ids)]));window.dispatchEvent(new Event('wl_cart'))}
export function useCart(){const [ids,set]=useState(read);useEffect(()=>{const f=()=>set(read());window.addEventListener('wl_cart',f);return()=>window.removeEventListener('wl_cart',f)},[]);return ids}
