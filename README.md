# API Watcher 🚨

**Monitor API changes before they break your app — and publish independently verified uptime badges.**

API Watcher watches developer-facing changelog pages, detects content changes, stores change history, alerts a Telegram chat, and monitors public API endpoints to publish live uptime/latency badges.

## Verified uptime badges

Add a public API monitor:

```bash
curl -X POST http://127.0.0.1:8000/api/monitors \
  -H 'content-type: application/json' \
  -d '{"slug":"my-api","name":"My API","url":"https://example.com/health","expectedStatus":200}'
```

Run a check:

```bash
npm run uptime:check
```

Public status page:

```
http://127.0.0.1:8000/status/my-api
```

README badge:

```markdown
[![API Uptime](https://YOUR-DOMAIN/badge/my-api/uptime)](https://YOUR-DOMAIN/status/my-api)
```

Latency badge:

```markdown
[![API Latency](https://YOUR-DOMAIN/badge/my-api/latency)](https://YOUR-DOMAIN/status/my-api)
```

Badges are generated from checks stored by API Watcher rather than user-supplied uptime numbers. The public status page links back to the monitor, creating the intended build-in-public distribution loop.

### API

- `GET /health`
- `GET /api/monitors`
- `POST /api/monitors`
- `GET /api/monitors/:slug`
- `POST /api/uptime/check`
- `GET /badge/:slug/uptime`
- `GET /badge/:slug/latency`
- `GET /status/:slug`

### Security

The monitor URL validator only accepts HTTP(S), rejects embedded credentials, and rejects localhost, local domains, and hosts resolving to private IP ranges. This is an MVP SSRF defense; production multi-tenant hosting should run probes in isolated workers with network egress controls.

## Existing changelog monitoring

- OpenAI, Stripe, GitHub and Twilio sources
- Content hashing and change detection
- SQLite history
- REST API
- CLI scanner
- Optional Telegram alerts

## Local development

```bash
npm install
npm start
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Manual changelog scan:

```bash
npm run check
```

For Telegram alerts, copy `.env.example` to `.env` and provide a bot token and chat ID.

## Roadmap

1. Multi-region uptime probes
2. Public incident history and downtime windows
3. Authenticated dashboard and API ownership
4. Developer subscriptions
5. Alerts (email, Slack, Discord, Telegram)
6. Custom status pages/domains
7. Hosted monitoring

## Security

Never commit API tokens or other secrets. Use environment variables or hosted secrets.

## License

MIT
