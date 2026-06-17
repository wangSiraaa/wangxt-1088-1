# Trae Preflight

This folder is prepared for `wangxt-1088-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18388
- API_PORT: 19388
- WEB_PORT: 20388
- DB_PORT: 21388
- REDIS_PORT: 22388

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
