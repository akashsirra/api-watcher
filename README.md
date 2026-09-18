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


## Android / Play Store

The Android app lives in `android/` and targets Android 16 (API 36). GitHub Actions builds both a debug APK and release AAB.

The hosted MVP uses a Supabase Edge Function and Postgres database. The public app endpoints are:

- `GET /functions/v1/api-watcher/sources`
- `GET /functions/v1/api-watcher/changes`
- `POST /functions/v1/api-watcher/check`

The monitor workflow triggers a check every 30 minutes.

### Release plan

1. Build and test the Android AAB.
2. Create the Play Console app and complete developer verification.
3. Upload the AAB to internal testing.
4. Complete the required closed test if the Play developer account is a new personal account.
5. Prepare store listing, privacy policy and Data safety declarations.
6. Apply for production access and roll out the production release.

Privacy policy: [PRIVACY.md](./PRIVACY.md)
