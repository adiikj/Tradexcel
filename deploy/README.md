# Deploying the backend

The backend runs on a single Azure VM (2 burstable vCPUs, 1 GB RAM) as one
Node process: the Express API, the Socket.IO price feed and all six cron jobs
(contest settlement, price alerts, the weekly reset, queued orders, daily
snapshots and predictions).

That last part is why the host is a long-running VM and not a serverless
function — a function would sleep between requests and the cron jobs would
never run.

## Layout on the VM

```
/srv/tradexcel                  the git checkout
  apps/backend/                 the service's working directory
    dist/                       the built output (node dist/index.js)
    public/temp/                avatar uploads, briefly, before Cloudinary
    .cache/chat/                the chat model, downloaded once
/etc/tradexcel/api.env          the environment (secrets; not in the repo)
```

## First-time setup

```bash
# 1. A user for the service, and the checkout
sudo adduser --system --group --home /srv/tradexcel tradexcel
sudo -u tradexcel git clone <repo> /srv/tradexcel

# 2. The environment
sudo mkdir -p /etc/tradexcel
sudo cp /srv/tradexcel/apps/backend/.env.example /etc/tradexcel/api.env
sudo chmod 600 /etc/tradexcel/api.env
sudo chown tradexcel:tradexcel /etc/tradexcel/api.env
sudo nano /etc/tradexcel/api.env      # fill it in - see below

# 3. The service
sudo cp /srv/tradexcel/deploy/tradexcel-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tradexcel-api
```

`/etc/tradexcel/api.env` is a plain KEY=VALUE file, the same keys as
`apps/backend/.env.example`. It needs at least:

| Key | Notes |
|---|---|
| `DATABASE_URL` | Neon. Prefer the **pooled** endpoint (`-pooler.<region>.aws.neon.tech`) — see below. |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | Long random strings. Rotating them signs everyone out. |
| `CORS_ORIGIN` | Comma-separated list of the frontend's origins. |
| `SITE_URL` | The site's public origin — the links in the weekly recap email. Defaults to `https://www.tradexcel.site`. |
| `NODE_ENV` | `production` — it also marks the auth cookies `Secure`. |
| `PORT` | Defaults to 8000. |
| `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLOUDINARY_*`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET` | Only if you use those features. |

Optional: `CHAT_ENABLED=false` turns the chat assistant off, `CHAT_CACHE_DIR`
moves the model cache, `LOG_LEVEL` sets the pino level.

## Deploying

```bash
cd /srv/tradexcel
./deploy/deploy.sh
```

It pulls, installs, applies the migrations, builds and restarts the service —
in that order, so the schema is never behind the code talking to it. If the
migration fails, the old build keeps running and the deploy stops there.

## Nginx

The service listens on `127.0.0.1:8000` and is not exposed to the internet.
Put nginx in front of it:

```nginx
server {
    listen 443 ssl http2;
    server_name api.tradexcel.site;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # The Socket.IO price feed.
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

`trust proxy` is set to `1` in `src/app.ts`, which assumes exactly one
proxy hop. If you put a CDN or Azure Application Gateway in front of nginx as
well, raise that number to match — otherwise `req.ip` is the proxy's address
and the rate limiter stops working per IP.

## Migrations and Neon

Neon is serverless Postgres: the compute suspends when idle and has a
per-branch connection cap. The backend sets `connection_limit=5` and
`pool_timeout=20` on the connection URL, and retries the first connection
five times with backoff so a boot that lands during a resume doesn't kill
the process.

`db:deploy` applies the migrations. The migration history is replayable from
scratch, which CI checks on every run: it builds a database from the
migrations and compares the result with `schema.prisma`. If they disagree,
CI fails.

## If something breaks

```bash
systemctl status tradexcel-api
journalctl -u tradexcel-api -f        # live logs
journalctl -u tradexcel-api -n 100    # the last 100 lines
```

The service restarts itself five times in a minute before systemd gives up
and leaves it dead — check the logs for the reason.
