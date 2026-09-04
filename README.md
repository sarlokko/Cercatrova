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

## Provalo sul NAS

Da questo ambiente cloud non si può raggiungere la tua LAN. Sul NAS:

### Opzione A — Docker (consigliata, Synology Container Manager / QNAP)

SSH sul NAS oppure Task Scheduler:

```bash
git clone https://github.com/sarlokko/Cercatrova.git
cd Cercatrova
git checkout cursor/deal-radar-web-43ec
docker compose up -d --build
```

Poi apri **http://IP-DEL-NAS:8787**  
(es. `http://192.168.1.20:8787`)

Per aggiornare:

```bash
cd Cercatrova && git pull && docker compose up -d --build
```

Su **Synology**: Container Manager → Progetto → Crea → percorso della cartella del repo (c’è già `docker-compose.yml`). Porta host `8787`.

### Opzione B — Web Station (solo file statici)

```bash
npm run pack:nas
```

Copia `il-cerca-trova-nas.zip` in una cartella web del NAS, scompatta, abilita il virtual host. C’è già un `.htaccess` per Apache.

## Stack

Vite + React + TypeScript. Dati demo in `src/data/deals.ts`.
