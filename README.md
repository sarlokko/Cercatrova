# Il Cerca-Trova

Pagina web pubblica che unisce **confronto prezzi** (stile Trovaprezzi) e **monitoraggio/alert** (stile CamelCamelCamel).

## Cosa fa

- **Cerca**: modalità **generica** (es. “HDD NAS”) o **specifica** (modello esatto)
- **Limite prezzo** e filtro “solo gratis”
- **Deal Radar** con ricerca live + categorie
- **Notifiche Telegram** (UI + deep link bot; invio reale via Bot API in produzione)
- Scheda prodotto con storico, media, minimo 6 mesi e confronto merchant

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

Vite + React + TypeScript. Dati demo in `src/data/deals.ts`.
