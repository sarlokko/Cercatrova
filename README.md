# Il Cerca-Trova

**È questo il momento giusto per comprarlo?**

## NAS UGOS — se il container non parte

Il compose deve essere **corto**. Niente `${TELEGRAM_BOT_TOKEN}`, niente `./data:/data`: su UGOS fanno diventare il progetto rosso o crashano SQLite.

1. Elimina il progetto rosso
2. File Manager → `docker/cercatrova`
3. Metti **solo** `compose.yaml` (scaricalo, non incollare dal telefono):

https://raw.githubusercontent.com/sarlokko/Cercatrova/cursor/deal-radar-web-43ec/compose.yaml

4. Docker → Progetto → Crea → cartella `docker/cercatrova` → Distribuisci
5. http://192.168.31.20:8787

Se obbliga a incollare, **una riga**:

```json
{"services":{"web":{"image":"ghcr.io/sarlokko/cercatrova:latest","ports":["8787:80"],"restart":"unless-stopped"}}}
```

Poi pull:

```
docker compose pull && docker compose up -d
```

Il database sta dentro il container (`/app/data`). I watch restano finché non cancelli il container.

Telegram (dopo che gira): in UGOS → progetto → ambiente → `TELEGRAM_BOT_TOKEN` = token del bot. Poi riavvia.

## Locale

```bash
npm install
npm test
npm run dev
```
