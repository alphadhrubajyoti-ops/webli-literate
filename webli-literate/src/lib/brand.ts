export const LOGO_PATH='/images/webli-literate-logo.png';
export const WHATSAPP='919609022523';
export const waLink=(t:string)=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
export const inr=(paise:number)=>'₹'+(paise/100).toLocaleString('en-IN',{minimumFractionDigits:paise%100?2:0,maximumFractionDigits:2});
export const finalPaise=(o:number,d:number,override?:number|null)=>override??Math.floor((o*(100-d)+50)/100);
