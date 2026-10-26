<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- External HTTP lookups (e.g. the India Post pincode area lookup) run through `createServerFn` in `src/lib/*.functions.ts` with a pure parser in a client-safe `src/lib/*.ts` module — never fetch external APIs directly from the browser (CORS/reliability) and never import `.functions.ts` from `src/server/`.

