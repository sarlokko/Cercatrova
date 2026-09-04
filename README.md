# Il Cerca-Trova

Pagina web pubblica: confronto prezzi + alert.

## NAS UGOS Pro — non incollare YAML col telefono

L’editor spezza le righe e il file diventa invalido.

1. Se il progetto è già creato e rosso, **eliminalo**
2. File Manager → cartella `docker/cercatrova`
3. Metti lì il file `compose.yaml` (nome esatto), scaricandolo da:

https://raw.githubusercontent.com/sarlokko/Cercatrova/cursor/deal-radar-web-43ec/compose.yaml

4. Docker → Progetto → Crea
   - Nome: `cercatrova`
   - Cartella: `docker/cercatrova`
   - Usa il file già presente, non riscriverlo
5. Distribuisci → http://192.168.31.20:8787

Se l’interfaccia obbliga a incollare, una sola riga JSON:

```json
{"services":{"web":{"image":"ghcr.io/sarlokko/cercatrova:latest","ports":["8787:80"],"restart":"unless-stopped"}}}
```

## Locale

```bash
npm install
npm run dev
```
