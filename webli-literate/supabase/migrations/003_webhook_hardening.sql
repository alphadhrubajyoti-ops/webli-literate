alter table webhook_events add column status text not null default 'processed', add column error text, add column processed_at timestamptz not null default now();
-- One atomic transaction: validate -> mark order paid -> grant entitlements -> record event.
-- Any exception rolls everything back, so the event is NOT marked processed and the gateway retry can succeed.
create function process_razorpay_event(p_event_id text,p_event text,p_rzp_order_id text,p_payment_id text,p_amount bigint,p_currency text,p_status text) returns text
language plpgsql security definer set search_path=public as $$
declare o orders;res text;err text;
begin
 if exists(select 1 from webhook_events where event_id=p_event_id) then return 'duplicate_event'; end if;
 select * into o from orders where razorpay_order_id=p_rzp_order_id for update;
 if not found then return 'unknown_order'; end if;
 if p_event='payment.failed' then
  update orders set status='failed' where id=o.id and status='pending';res:='failed_recorded';
 elsif p_event in('payment.captured','order.paid') then
  if p_status is distinct from 'captured' then res:='ignored';err:='payment not captured';
  elsif p_currency is distinct from o.currency or p_amount is distinct from o.total_paise::bigint then res:='rejected';err:='amount or currency mismatch';
  elsif o.status='refunded' then res:='rejected';err:='order was refunded';
  elsif o.status='paid' and o.razorpay_payment_id is distinct from p_payment_id then res:='rejected';err:='order already paid by a different payment';
  elsif not exists(select 1 from order_items where order_id=o.id) then res:='needs_review';err:='order has no items';
  elsif o.status='paid' then
   res:='already_paid';
   insert into entitlements(user_id,book_id,order_id) select o.user_id,book_id,o.id from order_items where order_id=o.id on conflict(user_id,book_id) do nothing;
  else
   update orders set status='paid',razorpay_payment_id=p_payment_id,paid_at=now() where id=o.id;res:='fulfilled';
   insert into entitlements(user_id,book_id,order_id) select o.user_id,book_id,o.id from order_items where order_id=o.id
    on conflict(user_id,book_id) do update set revoked=false,order_id=excluded.order_id where entitlements.revoked or entitlements.order_id is distinct from excluded.order_id;
  end if;
 else res:='ignored';err:='unhandled event type';
 end if;
 insert into webhook_events(event_id,payload,status,error) values(p_event_id,jsonb_build_object('order',p_rzp_order_id,'payment',p_payment_id,'amount',p_amount),case when res in('rejected','needs_review') then res else 'processed' end,err) on conflict(event_id) do nothing;
 return res;
end$$;
revoke execute on function process_razorpay_event(text,text,text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function process_razorpay_event(text,text,text,text,bigint,text,text) to service_role;
create or replace function admin_stats() returns json language plpgsql security definer set search_path=public as $$begin
 if not is_admin() then raise exception 'forbidden'; end if;
 return json_build_object('published',(select count(*) from books where published and not archived),'drafts',(select count(*) from books where not published and not archived),
 'orders',(select count(*) from orders),'paid',(select count(*) from orders where status='paid'),'pending',(select count(*) from orders where status='pending'),
 'failed',(select count(*) from orders where status='failed'),'refunded',(select count(*) from orders where status='refunded'),
 'needs_review',(select count(*) from webhook_events where status in('rejected','needs_review')),
 'revenue_paise',(select coalesce(sum(total_paise),0) from orders where status='paid'));end$$;
create function books_require_pdf() returns trigger language plpgsql security definer set search_path=public as $$begin
 if new.published and not exists(select 1 from book_files where book_id=new.id) then raise exception 'cannot publish a book without a full PDF'; end if;return new;end$$;
create trigger books_pdf_chk before insert or update on books for each row execute function books_require_pdf();
grant usage,select on sequence admin_audit_logs_id_seq to authenticated;
