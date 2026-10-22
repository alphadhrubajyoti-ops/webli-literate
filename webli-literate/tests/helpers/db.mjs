import fs from 'node:fs';import {PGlite} from '@electric-sql/pglite';
export const ID={U1:'11111111-1111-1111-1111-111111111111',U2:'22222222-2222-2222-2222-222222222222',AD:'33333333-3333-3333-3333-333333333333',B1:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',B2:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',B3:'cccccccc-cccc-cccc-cccc-cccccccccccc',
 O1:'a0000000-0000-0000-0000-000000000001',O2:'a0000000-0000-0000-0000-000000000002',O3:'a0000000-0000-0000-0000-000000000003',O4:'a0000000-0000-0000-0000-000000000004'};
export const su=async(db,sql,p)=>{await db.exec('reset role');return db.query(sql,p)};
export const as=async(db,u,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.sub',$1,false)",[u||'']);await db.exec('set role '+role)};
/** In-memory Postgres with stubbed Supabase auth/storage, Supabase-like default grants, all migrations and seed data. */
export async function makeDb(){const db=new PGlite();
 await db.exec(`create schema auth;create schema storage;create role authenticated;create role anon;create role service_role;
 create table auth.users(id uuid primary key default gen_random_uuid(),email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public bool);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to authenticated,anon,service_role;grant all on storage.objects to authenticated,service_role;grant select on auth.users to authenticated,service_role;
 alter default privileges in schema public grant all on tables to authenticated,anon,service_role;alter default privileges in schema public grant execute on functions to authenticated,anon,service_role;`);
 for(const f of['001_init','002_admin','003_webhook_hardening'])await db.exec(fs.readFileSync(`supabase/migrations/${f}.sql`,'utf8').replace('create extension if not exists pgcrypto;',''));
 const {U1,U2,AD,B1,B2,B3,O1,O2,O3,O4}=ID;
 await db.exec(`insert into auth.users(id,email) values('${U1}','a@x.com'),('${U2}','b@x.com'),('${AD}','admin@x.com');insert into user_roles values('${AD}','admin');
 insert into books(id,title,author,original_price_paise) values('${B1}','Pub','A',10000),('${B2}','Two','A',20000),('${B3}','Draft','A',5000);
 insert into book_files(book_id,pdf_path) values('${B1}','b1/x.pdf'),('${B2}','b2/y.pdf');update books set published=true where id in('${B1}','${B2}');
 insert into orders(id,reference,user_id,total_paise,razorpay_order_id) values('${O1}','R1','${U1}',10000,'order_1'),('${O2}','R2','${U2}',20000,'order_2'),('${O3}','R3','${U1}',10000,'order_3'),('${O4}','R4','${U1}',20000,'order_4');
 insert into order_items(order_id,book_id,price_paise) values('${O1}','${B1}',10000),('${O2}','${B2}',20000),('${O4}','${B2}',20000);`);
 return db}
