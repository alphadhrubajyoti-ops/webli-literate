create extension if not exists pgcrypto;
create table profiles(id uuid primary key references auth.users on delete cascade,email text,full_name text,avatar_url text,created_at timestamptz default now());
create table user_roles(user_id uuid references auth.users on delete cascade,role text check(role in('admin')),primary key(user_id,role));
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from user_roles where user_id=auth.uid() and role='admin')$$;
create table categories(id uuid primary key default gen_random_uuid(),name text unique not null);
create table books(id uuid primary key default gen_random_uuid(),title text not null,author text not null,description text,category_id uuid references categories,cover_url text,
 original_price_paise int not null check(original_price_paise>=0),discount_percent int not null default 0 check(discount_percent between 0 and 100),
 sale_price_paise int check(sale_price_paise>=0),published bool not null default false,purchasable bool not null default true,featured bool default false,archived bool default false,created_at timestamptz default now());
create table book_files(book_id uuid primary key references books on delete cascade,pdf_path text not null,preview_path text);
create table orders(id uuid primary key default gen_random_uuid(),reference text unique not null,user_id uuid not null references auth.users,total_paise int not null check(total_paise>0),currency text not null default 'INR',
 status text not null default 'pending' check(status in('pending','paid','failed','refunded')),razorpay_order_id text unique,razorpay_payment_id text,paid_at timestamptz,created_at timestamptz default now());
create table order_items(id uuid primary key default gen_random_uuid(),order_id uuid references orders on delete cascade,book_id uuid references books,price_paise int not null);
create table entitlements(user_id uuid references auth.users,book_id uuid references books,order_id uuid references orders,revoked bool default false,created_at timestamptz default now(),primary key(user_id,book_id));
create table webhook_events(event_id text primary key,payload jsonb,created_at timestamptz default now());
create table store_settings(key text primary key,value text);
create table admin_audit_logs(id bigserial primary key,admin_id uuid,action text,detail jsonb,created_at timestamptz default now());
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin
 insert into profiles(id,email,full_name,avatar_url) values(new.id,new.email,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'avatar_url') on conflict(id) do update set full_name=excluded.full_name,avatar_url=excluded.avatar_url;return new;end$$;
create trigger on_auth_user after insert or update on auth.users for each row execute function handle_new_user();
alter table profiles enable row level security;alter table user_roles enable row level security;alter table categories enable row level security;alter table books enable row level security;
alter table book_files enable row level security;alter table orders enable row level security;alter table order_items enable row level security;alter table entitlements enable row level security;
alter table webhook_events enable row level security;alter table store_settings enable row level security;alter table admin_audit_logs enable row level security;
create policy p_self on profiles for select to authenticated using(id=auth.uid() or is_admin());
create policy cat_read on categories for select to authenticated using(true);create policy cat_admin on categories for all to authenticated using(is_admin()) with check(is_admin());
create policy book_read on books for select to authenticated using((published and not archived) or is_admin());create policy book_admin on books for all to authenticated using(is_admin()) with check(is_admin());
create policy files_admin on book_files for all to authenticated using(is_admin()) with check(is_admin());
create policy ord_own on orders for select to authenticated using(user_id=auth.uid() or is_admin());
create policy oi_own on order_items for select to authenticated using(exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or is_admin())));
create policy ent_own on entitlements for select to authenticated using(user_id=auth.uid() or is_admin());
create policy set_read on store_settings for select to authenticated using(true);create policy set_admin on store_settings for all to authenticated using(is_admin()) with check(is_admin());
create policy audit_admin on admin_audit_logs for select to authenticated using(is_admin());
-- No insert/update policies on orders, entitlements, user_roles, webhook_events: only the service role (Cloudflare Functions) writes them.
insert into storage.buckets(id,name,public) values('book-files','book-files',false),('covers','covers',true) on conflict do nothing;
-- book-files has no policies => only service role can read; admin uploads go through the Supabase dashboard or a future admin function.
