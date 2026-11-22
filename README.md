# Commonwealth of Laich Island
TanStack Start + Tailwind v4 + Neon Postgres (in-memory fallback), Vercel preset.

    npm install && npm run dev        # no DATABASE_URL needed locally
    # Vercel: set DATABASE_URL (Neon), deploy. Tables are created + seeded on first call.

Admin: the FIRST person to register claims the seeded CLI-0001 (Founder & Managing Minister) and becomes admin.
Everyone after that submits an application; the admin approves it on /passport.
Note: if `nitro` nightly import fails, check the current TanStack Start "hosting → Nitro" docs for the package name.
