-- 행복 저금통 Supabase schema
-- Supabase Dashboard > SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.happiness_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamp with time zone not null default now(),
  is_hidden boolean not null default false,
  constraint happiness_notes_content_length_check
    check (char_length(btrim(content)) between 1 and 60)
);

alter table public.happiness_notes enable row level security;

-- 같은 이름의 정책이 이미 있으면 재실행 시 충돌할 수 있어 먼저 삭제합니다.
drop policy if exists "Anyone can insert anonymous happiness notes" on public.happiness_notes;
drop policy if exists "Anyone can read visible happiness notes" on public.happiness_notes;

create policy "Anyone can insert anonymous happiness notes"
on public.happiness_notes
for insert
to anon
with check (
  is_hidden = false
  and char_length(btrim(content)) between 1 and 60
);

create policy "Anyone can read visible happiness notes"
on public.happiness_notes
for select
to anon
using (is_hidden = false);

-- 랜덤 뽑기 함수: 전체 목록을 브라우저로 가져오지 않고 DB에서 한 개만 랜덤 선택합니다.
create or replace function public.get_random_happiness_note()
returns table (
  id uuid,
  content text
)
language sql
security invoker
stable
as $$
  select happiness_notes.id, happiness_notes.content
  from public.happiness_notes
  where happiness_notes.is_hidden = false
  order by random()
  limit 1;
$$;

grant execute on function public.get_random_happiness_note() to anon;
