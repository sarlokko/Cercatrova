# Il Cerca-Trova

Pagina web pubblica che unisce **confronto prezzi** e **monitoraggio/alert**.

## Provalo sul NAS (UGOS Pro)

Docker → **Progetto** → **Crea**

1. **Nome** (obbligatorio, senno esce “ingresso non può essere vuoto”): `cercatrova`
2. Cartella: `Cartella condivisa/docker/cercatrova`
3. Cancella tutto l’YAML rotto e incolla **esattamente** questo (una riga = una riga, niente a capo in mezzo):

```yaml
services:
  web:
    image: ghcr.io/sarlokko/cercatrova:latest
    container_name: il-cerca-trova
    ports:
      - "8787:80"
    restart: unless-stopped
```

4. Spunta “Esegui immediatamente dopo la creazione” → **Distribuisci**
5. Apri http://192.168.31.20:8787

Se l’immagine non si scarica, su GitHub → Packages rendi pubblico `cercatrova`.

## Avvio in locale

```bash
npm install
npm run dev
```
