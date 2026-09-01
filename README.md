# rorz.io

This is the repository for my personal site.

It's a Bun monorepo, comprising two core parts:

1. `apps/web` (a.k.a. "the website") -- The UI of the site, as well as some models and schema for how I think about the content that's loaded into it.
2. `packages/obsid` -- A work-in-progress package called `obsid` whose goal is to make it as easy as possible to take _content_ from an Obsidian vault and turn it into static pages / a content system.

My aim is to de-monorepo-isise (new contender for the next OED) this project and _just_ make it the `apps/web` project, and to eventually create a proper standalone package for `obsid` once it's ready for public release.
