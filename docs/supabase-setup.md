# Supabase Sync Setup (Optional)

Pensieve is **local-first**. Supabase is an optional sync backend. Without these credentials the vault runs entirely in IndexedDB on the device.

## 1. Create a project

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the **Project URL** and **anon (publishable) key** from Project Settings → API

## 2. Create the key-value table

Run in the SQL editor:

```sql
create table if not exists public.pensieve_kv (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.pensieve_kv enable row level security;

-- Dev-friendly policies for the anon key (tighten for production)
create policy "pensieve_kv_select" on public.pensieve_kv
  for select using (true);
create policy "pensieve_kv_upsert" on public.pensieve_kv
  for insert with check (true);
create policy "pensieve_kv_update" on public.pensieve_kv
  for update using (true);
```

Each user’s vault is stored as one row: `key = items_<userId>`, `value = JSON array of MindItem`.

## 3. Connect in Pensieve

1. Open **Settings → Databases**
2. Choose **Supabase**
3. Paste Project URL + anon key
4. Reload if prompted

If URL/key are missing or the network is down, Pensieve keeps working offline and queues sync jobs in the local outbox.

## Offline behavior

| Situation | Behavior |
|---|---|
| No credentials | Local IndexedDB only |
| Offline with credentials | Writes local + outbox; flushes when online |
| Empty remote + local data | Local vault is pushed up (never wiped) |
| Conflicting edits | Last-write-wins via `updatedAt` |
