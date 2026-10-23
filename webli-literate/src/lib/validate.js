export const toPaise=s=>{const n=Number(s);return Number.isFinite(n)?Math.round(n*100):NaN};
export function validateBook(f){const e=[];
 if(!f.title?.trim())e.push('Title is required');if(!f.author?.trim())e.push('Author is required');
 const o=toPaise(f.original);if(!(o>=0))e.push('Original price must be 0 or more');
 const d=Number(f.discount||0);if(!Number.isInteger(d)||d<0||d>100)e.push('Discount must be a whole number from 0 to 100');
 if(f.sale!==''&&f.sale!=null){const s=toPaise(f.sale);if(!(s>=0))e.push('Final price is invalid');else if(s>o)e.push('Final price cannot exceed the original price')}
 if(f.page_count!==''&&f.page_count!=null&&!(Number.isInteger(Number(f.page_count))&&Number(f.page_count)>0))e.push('Page count must be a positive whole number');
 if(f.published&&!f.hasPdf)e.push('Upload the full PDF before publishing');
 return e}
export const FILE_RULES={cover:{types:['image/png','image/jpeg','image/webp'],max:2e6},preview:{types:['image/png','image/jpeg','image/webp','application/pdf'],max:10e6},pdf:{types:['application/pdf'],max:50e6}};
export const checkFile=(kind,file)=>{const r=FILE_RULES[kind];if(!r.types.includes(file.type))return `${file.name}: unsupported file type`;if(file.size>r.max)return `${file.name}: larger than ${r.max/1e6} MB`;return ''};
