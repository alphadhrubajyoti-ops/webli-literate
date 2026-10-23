import test from 'node:test';import assert from 'node:assert';import {validateBook,toPaise,checkFile} from '../src/lib/validate.js';
const ok={title:'T',author:'A',original:'499',discount:'20',sale:'',page_count:'',published:false,hasPdf:false};
test('valid',()=>assert.deepEqual(validateBook(ok),[]));
test('rejects bad discount',()=>assert.ok(validateBook({...ok,discount:'120'}).length));
test('rejects negative price',()=>assert.ok(validateBook({...ok,original:'-1'}).length));
test('sale above original',()=>assert.ok(validateBook({...ok,sale:'600'}).length));
test('publish needs pdf',()=>assert.ok(validateBook({...ok,published:true}).length));
test('paise',()=>assert.equal(toPaise('399.2'),39920));
test('file rules',()=>{assert.ok(checkFile('pdf',{name:'a.exe',type:'application/x-msdownload',size:1}));assert.equal(checkFile('pdf',{name:'a.pdf',type:'application/pdf',size:1e6}),'')});
