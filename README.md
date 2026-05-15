# MJ Couples PWA

MJ is a Next.js couples app backed by Supabase. It includes daily questions, shared content prompts, generated content-library seed data, and helper SQL for repeat-safe content rotation.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run seed:library
npm run seed:library:json
```

## Supabase Setup

Run the main schema in Supabase first, then run `supabase_content_helpers.sql`. After that, seed the content table with:

```bash
npm run seed:library
```

Use `.env.example` as the template for local environment variables.
