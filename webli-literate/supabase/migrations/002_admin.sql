alter table books add column language text default 'English', add column page_count int check(page_count is null or page_count>0), add column preview_urls text[] not null default '{}';
alter table books add constraint sale_le_orig check(sale_price_paise is null or sale_price_paise<=original_price_paise);
create policy roles_self on user_roles for select to authenticated using(user_id=auth.uid());
create policy audit_ins on admin_audit_logs for insert to authenticated with check(is_admin() and admin_id=auth.uid());
create table contact_messages(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,name text not null check(length(name) between 1 and 100),message text not null check(length(message) between 5 and 2000),created_at timestamptz default now());
alter table contact_messages enable row level security;
create policy cm_own on contact_messages for select to authenticated using(user_id=auth.uid() or is_admin());
create policy cm_ins on contact_messages for insert to authenticated with check(user_id=auth.uid() and (select count(*) from contact_messages c where c.user_id=auth.uid() and c.created_at>now()-interval '1 hour')<5);
insert into storage.buckets(id,name,public) values('previews','previews',true) on conflict do nothing;
create policy admin_storage on storage.objects for all to authenticated using(bucket_id in('covers','previews','book-files') and is_admin()) with check(bucket_id in('covers','previews','book-files') and is_admin());
create function admin_stats() returns json language plpgsql security definer set search_path=public as $$begin
 if not is_admin() then raise exception 'forbidden'; end if;
 return json_build_object('published',(select count(*) from books where published and not archived),'drafts',(select count(*) from books where not published and not archived),
 'orders',(select count(*) from orders),'paid',(select count(*) from orders where status='paid'),'pending',(select count(*) from orders where status='pending'),
 'failed',(select count(*) from orders where status='failed'),'refunded',(select count(*) from orders where status='refunded'),
 'revenue_paise',(select coalesce(sum(total_paise),0) from orders where status='paid'));end$$;
create function admin_refund_order(oid uuid) returns void language plpgsql security definer set search_path=public as $$begin
 if not is_admin() then raise exception 'forbidden'; end if;
 update orders set status='refunded' where id=oid and status='paid';if not found then raise exception 'order is not paid'; end if;
 update entitlements set revoked=true where order_id=oid;
 insert into admin_audit_logs(admin_id,action,detail) values(auth.uid(),'refund_recorded',json_build_object('order_id',oid));end$$;
revoke execute on function admin_stats(),admin_refund_order(uuid) from public,anon;
grant execute on function admin_stats(),admin_refund_order(uuid) to authenticated;
