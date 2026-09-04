# Il Cerca-Trova

Pagina web pubblica che unisce **confronto prezzi** (stile Trovaprezzi) e **monitoraggio/alert** (stile CamelCamelCamel).

## Cosa fa

- **Cerca**: modalità **generica** (es. “HDD NAS”) o **specifica** (modello esatto)
- **Limite prezzo** e filtro “solo gratis”
- **Deal Radar** con ricerca live + categorie
- **Notifiche Telegram** (UI + deep link bot; invio reale via Bot API in produzione)
- Scheda prodotto con storico, media, minimo 6 mesi e confronto merchant

## Avvio in locale

```bash
npm install
npm run dev
```

## Provalo sul NAS (Synology Container Manager)

1. Container Manager → **Progetto** → **Crea**
2. Nome: `il-cerca-trova`
3. Percorso: la cartella che hai già creato (può restare **vuota**)
4. Sorgente: **Crea docker-compose.yml**
5. Incolla questo:

```yaml
services:
  web:
    build:
      context: https://github.com/sarlokko/Cercatrova.git#cursor/deal-radar-web-43ec
      dockerfile: Dockerfile
    image: il-cerca-trova:latest
    container_name: il-cerca-trova
    ports:
      - "8787:80"
    restart: unless-stopped
```

6. Avvia il progetto (il primo avvio impiega qualche minuto: scarica e compila il sito).
7. Apri **http://IP-DEL-NAS:8787**

Se il build da GitHub fallisce, clona il repo **dentro** quella cartella e usa `build: .` al posto del `context:` GitHub.

## Stack

Vite + React + TypeScript. Dati demo in `src/data/deals.ts`.
