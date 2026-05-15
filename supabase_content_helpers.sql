-- ============================================================
-- MJ Couples PWA — Content Library Helpers
-- Run after the main schema if you use the generated seed library.
-- ============================================================

-- Makes regenerated seed inserts repeat-safe when metadata.seed_key is present.
-- The generated column lets PostgREST use on_conflict=seed_key for bulk upserts.
alter table public.content
  add column if not exists seed_key text generated always as (metadata->>'seed_key') stored;

create unique index if not exists idx_content_generated_seed_key
  on public.content (seed_key)
  where seed_key is not null;

-- Pick unused content for any content type, optionally scoped by category/tone.
-- If the couple has exhausted the matching pool, usage for that pool is reset.
create or replace function public.select_unused_content(
  p_couple_id uuid,
  p_type text,
  p_category text default null,
  p_tone text default null
)
returns uuid as $$
declare
  v_content_id uuid;
begin
  select c.id into v_content_id
  from public.content c
  where c.type = p_type
    and c.is_active = true
    and (p_category is null or c.category = p_category)
    and (p_tone is null or c.tone = p_tone)
    and c.id not in (
      select cu.content_id
      from public.content_usage cu
      where cu.couple_id = p_couple_id
    )
  order by random()
  limit 1;

  if v_content_id is not null then
    insert into public.content_usage (couple_id, content_id)
    values (p_couple_id, v_content_id)
    on conflict do nothing;

    return v_content_id;
  end if;

  delete from public.content_usage cu
  using public.content c
  where cu.content_id = c.id
    and cu.couple_id = p_couple_id
    and c.type = p_type
    and (p_category is null or c.category = p_category)
    and (p_tone is null or c.tone = p_tone);

  select c.id into v_content_id
  from public.content c
  where c.type = p_type
    and c.is_active = true
    and (p_category is null or c.category = p_category)
    and (p_tone is null or c.tone = p_tone)
  order by random()
  limit 1;

  if v_content_id is not null then
    insert into public.content_usage (couple_id, content_id)
    values (p_couple_id, v_content_id)
    on conflict do nothing;
  end if;

  return v_content_id;
end;
$$ language plpgsql security definer;

-- Count what remains before a reset would happen.
create or replace function public.remaining_unused_content_count(
  p_couple_id uuid,
  p_type text,
  p_category text default null,
  p_tone text default null
)
returns int as $$
begin
  return (
    select count(*)::int
    from public.content c
    where c.type = p_type
      and c.is_active = true
      and (p_category is null or c.category = p_category)
      and (p_tone is null or c.tone = p_tone)
      and c.id not in (
        select cu.content_id
        from public.content_usage cu
        where cu.couple_id = p_couple_id
      )
  );
end;
$$ language plpgsql security definer;
