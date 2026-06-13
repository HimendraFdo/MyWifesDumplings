# My Wife's Dumplings

## Local development

Install the website dependencies from the repository root:

```powershell
npm.cmd install
```

Install the Sanity Studio dependencies:

```powershell
npm.cmd --prefix studio install
```

Run the website from the repository root:

```powershell
npm.cmd run dev
```

In a second terminal, run Sanity Studio from the same repository root:

```powershell
npm.cmd run studio:dev
```

The website runs on `http://localhost:3000` and Sanity Studio normally runs on
`http://localhost:3333`.

Both applications use Sanity project `q5y27r5n` and the `production` dataset.
Website content is fetched through `src/lib/sanity/queries.ts`. Edit and publish
menu items, pricing tiers, extras, gallery images, and site settings in Studio
to update the website.

Local credentials belong in `.env.local` and `studio/.env`; these files are
ignored by Git.
