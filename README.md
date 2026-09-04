# Cercatrova

Pagina web pubblica che unisce **confronto prezzi** (stile Trovaprezzi) e **monitoraggio/alert** (stile CamelCamelCamel).

## Cosa fa

- **Deal Radar**: feed filtrato di segnali (gratis, −80%+, minimo storico, errore prezzo, coupon, scade oggi)
- **Nicchie**: Software / SaaS / AI free, NAS + HDD + SSD + RAM, Gaming free (≥20 €)
- **Scheda prodotto**: storico prezzi, media, minimo 6 mesi, confronto merchant
- **Monitora**: imposta prezzo target e salva alert in locale (demo)

## Avvio

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Stack

Vite + React + TypeScript. Dati demo in `src/data/deals.ts` (pronti da sostituire con API affiliate / scrapers / bot Telegram).
