# API Watcher 🚨

Monitor the API changelogs you depend on before changes break your app.

## MVP

- OpenAI, Stripe, GitHub and Twilio changelog monitoring
- Content hashing and change detection
- SQLite history
- JSON API
- CLI check command

## Run locally

```bash
npm install
npm start
```

Then open `http://127.0.0.1:8000/health`.

Run a scan with:

```bash
npm run check
```

## Roadmap

Android app → push notifications → subscriptions → hosted monitoring → Play Store release.

## License

MIT
