# aaronagai.com

Personal website for Aaron Nagai, hosted on GitHub Pages.

A minimal static site — just `index.html` and `index.css`.

## Custom domain

`CNAME` points the site at `aaronagai.com`. To make the domain live, add these
DNS records at your domain registrar:

**Apex domain (`aaronagai.com`)** — four `A` records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**`www` subdomain** — one `CNAME` record:

```
www.aaronagai.com  ->  aaronagai.github.io
```

Until DNS is configured, the site is reachable at https://aaronagai.github.io.
