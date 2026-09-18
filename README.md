# API Watcher 🚨

**Monitor API changes before they break your app.**

API Watcher watches developer-facing changelog pages, detects content changes, stores change history, and can alert a Telegram chat.

## MVP

- OpenAI, Stripe, GitHub and Twilio sources
- Content hashing and change detection
- SQLite history
- REST API
- CLI scanner
- Optional Telegram alerts
- GitHub Actions scheduled checks every 30 minutes

## Local development

```bash
npm install
npm start
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Manual scan:

```bash
npm run check
```

For Telegram alerts, copy `.env.example` to `.env` and provide a bot token and chat ID.

## Roadmap

1. Reliable structured changelog extraction
2. Change summaries and breaking-change classification
3. Developer subscriptions
4. Android app and push notifications
5. Hosted monitoring
6. Play Store release

## Security

Never commit API tokens, Telegram credentials, VAPID private keys, or other secrets. Use environment variables or hosted secrets.

## License

MIT
