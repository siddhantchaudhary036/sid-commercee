# Convex Development Workflow

## CRITICAL: Always Run Convex Dev

**Before making any changes to Convex files (schema, mutations, queries), you MUST run:**

```bash
npx convex dev
```

This command:
- Syncs your local schema changes to the Convex backend
- Watches for file changes and auto-deploys
- Generates TypeScript types in `convex/_generated/`
- Validates your schema and functions

## When to Run It

Run `npx convex dev` whenever you:
- Modify `convex/schema.ts`
- Add or update mutations/queries
- Create new Convex functions
- Start working on the project

## Deployment

After testing locally with `npx convex dev`, deploy to production with:

```bash
npx convex deploy
```

## Running Migrations

To run migration functions (like removing fields):

```bash
npx convex run migrations:removeFavoriteCategory
```

Replace `migrations:removeFavoriteCategory` with your specific migration function name.
