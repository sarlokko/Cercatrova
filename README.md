# Il Cerca-Trova

Pagina web pubblica: confronto prezzi + alert.

## Provalo subito (senza NAS)

https://sarlokko.github.io/Cercatrova/

## NAS UGOS Pro — non incollare YAML col telefono

L’editor spezza le righe e il file diventa invalido.

1. File Manager → apri `docker/cercatrova`
2. Carica questo file (salvalo così, nome esatto):

https://raw.githubusercontent.com/sarlokko/Cercatrova/cursor/deal-radar-web-43ec/compose.yaml

3. Docker → Progetto → **elimina** il progetto rotto se c’è
4. Crea progetto
   - Nome: `cercatrova`
   - Cartella: `docker/cercatrova`
   - Carica il `compose.yaml` già presente (non riscriverlo a mano)
5. Distribuisci
6. http://192.168.31.20:8787

Se proprio devi incollare, usa **una sola riga** JSON:

```json
{"services":{"web":{"image":"ghcr.io/sarlokko/cercatrova:latest","ports":["8787:80"],"restart":"unless-stopped"}}}
```

## Locale

```bash
npm install
npm run dev
```
