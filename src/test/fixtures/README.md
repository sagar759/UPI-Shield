# Fixture Naming

Store reusable synthetic fixtures at:

```text
src/test/fixtures/<domain>/<scenario>.fixture.ts
```

Export a readonly `<scenario><Domain>Fixture` value. Keep one behavior or
scenario per file, and never use real payment, identity, chat, or complaint
data.
