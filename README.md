# Il Cerca-Trova

**È questo il momento giusto per comprarlo?**

Non un Trovaprezzi. Cerchi un prodotto (anche a listino), Cercatrova legge i negozi, costruisce lo storico e ti avvisa su Telegram solo quando conviene.

## NAS UGOS Pro — non incollare YAML col telefono

L’editor spezza le righe e il file diventa invalido.

1. Se il progetto è già creato e rosso, **eliminalo**
2. File Manager → cartella `docker/cercatrova`
3. Metti lì il file `compose.yaml` (nome esatto), scaricandolo da:

https://raw.githubusercontent.com/sarlokko/Cercatrova/cursor/deal-radar-web-43ec/compose.yaml

4. (Facoltativo) nella stessa cartella un file `.env` con `TELEGRAM_BOT_TOKEN=...` e `PLUS_KEY=...`
5. Docker → Progetto → Crea
   - Nome: `cercatrova`
   - Cartella: `docker/cercatrova`
   - Usa il file già presente, non riscriverlo
6. Distribuisci → http://192.168.31.20:8787

Se l’interfaccia obbliga a incollare, una sola riga JSON:

```json
{"services":{"web":{"image":"ghcr.io/sarlokko/cercatrova:latest","ports":["8787:80"],"restart":"unless-stopped","volumes":["./data:/data"]}}}
```

Poi: `docker compose pull && docker compose up -d`

Il volume `./data` tiene SQLite (prodotti, storico, watch). Senza volume, al recreate perdi i monitoraggi.

## Telegram vero

1. Token del bot in `TELEGRAM_BOT_TOKEN`
2. Nel sito: Monitora → Collega bot → Avvia su Telegram
3. Gli alert partono dal server quando il prezzo è ≤ target o eccezionale (circa −15% vs media/listino)

## Piani

- Cerca: sempre gratis
- Monitoraggi: 3 gratis, 20 con Plus (2,99 €/mese — sblocco attuale: `PLUS_KEY` nel compose)

## Locale

```bash
npm install
npm test
npm run dev
```

API su `:8788`, UI Vite con proxy `/api`.

## Motore

Collector iniziali: **Steam** (API ufficiale) e **Amazon.it** (pagina prodotto, solo segnali affidabili). Sito ufficiale UGREEN quando l’URL è noto. Se il prezzo non si legge: *non disponibile*, mai inventato.
