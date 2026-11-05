# aaronagai.com

Personal website for Aaron Nagai, hosted on GitHub Pages.

A minimal static site with no build step.

## Writing

Posts live at `writing/<slug>/index.html` and share `writing.css` and
`writing.js`. To add one, copy the latest post's folder, edit the title, date,
description and body, then add a row to the Writing list in the root
`index.html`. The contents rail is built from the post's `h2`s.

## Custom domain

`CNAME` points the site at `aaronagai.com`. The domain is registered with
Namecheap, so DNS lives under **Domain List → aaronagai.com → Advanced DNS**
(with the nameservers set to Namecheap BasicDNS).

Delete Namecheap's default parking records first — the `CNAME` on `www`
pointing at `parkingpage.namecheap.com` and any `URL Redirect` on `@` — then
add:

**Apex domain (`aaronagai.com`)** — four `A` records, host `@`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**`www` subdomain** — one `CNAME` record:

```
www  ->  aaronagai.github.io.
```

Namecheap's minimum TTL is 1 min; Automatic (30 min) is fine.

After DNS propagates, enable **Enforce HTTPS** in the repo's
Settings → Pages. GitHub needs to issue a Let's Encrypt certificate first,
which can take up to an hour after the records resolve.

Until DNS is configured, the site stays reachable at https://aaronagai.github.io.
