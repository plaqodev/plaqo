// Each pinned slug is interpolated straight into an api.github.com request
// path, so a value like "../rate_limit" or one containing a query string
// could redirect the (scopeless, but still real) shared token's request to a
// different endpoint — fetch() resolves dot segments. Only accept the
// "owner/repo" shape GitHub itself uses: owners are alphanumeric/hyphen, and
// "." / ".." are never valid repo names.
//
// Its own module (no server imports) so the dashboard's picker can validate
// with the exact rule the server enforces.
export const REPO_SLUG_RE = /^[A-Za-z0-9-]+\/(?!\.\.?$)[\w.-]+$/;
