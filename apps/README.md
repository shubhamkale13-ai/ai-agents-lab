# Apps Convention

Each sellable agent should get its own standalone frontend app under `/apps`.

Recommended pattern:

```text
/apps
  /crm-assistant
  /sales-assistant
  /<future-agent>
```

Each app should contain its own:

- `package.json`
- `index.html`
- `vite.config.js` or framework config
- `src/`
- agent-specific UI and branding

Shared code can later move into `/packages`, but each app must remain independently deployable.
