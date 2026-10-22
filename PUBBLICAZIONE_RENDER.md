# Pubblicazione della versione di collaudo su Render

Questa configurazione pubblica il server Node con il database SQLite sul disco persistente. Non collega Supabase o OneDrive del cliente finale. La pubblicazione non è stata eseguita da ChatGPT.

## 1. Prepara GitHub

Crea un repository privato dedicato, ad esempio `matherion-fleet-os`. Alla radice del repository devono trovarsi `package.json`, `package-lock.json`, `server.mjs`, `render.yaml`, `FleetPlatform.jsx`, `main.jsx`, `index.html`, `style.css`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js` e la cartella `tests`.

Non caricare `node_modules`, `private-data`, credenziali o file `.env`. Il pacchetto consegnato non contiene database del collaudo. `.gitignore` è incluso: durante il caricamento tramite Finder puoi mostrare i file nascosti con Command+Shift+punto. Caricare lo ZIP come singolo file su GitHub non equivale a caricare il progetto.

## 2. Crea il servizio

Apri https://dashboard.render.com e collega GitHub. Crea un **Blueprint** dal repository: Render leggerà `render.yaml`. Controlla piano, disco e preventivo prima di confermare la creazione: il modello indica un servizio Starter a pagamento con disco da 1 GB, in Europa (Francoforte).

Per la creazione manuale di un **Web Service**, usa:

| Campo | Valore |
|---|---|
| Runtime | Node |
| Build Command | `npm ci --include=dev && npm test && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| Regione | Frankfurt |
| Disco persistente | mount `/var/data`, 1 GB |

Imposta anche le variabili presenti in `render.yaml`. Non usare un servizio senza disco per questa versione: il database andrebbe perso alla ricreazione dell’istanza. Il disco è accessibile al processo avviato, non alla compilazione o al pre-deploy.

Se il repository contiene una cartella superiore `fleet-os` invece dei file alla radice, per la configurazione manuale imposta Root Directory su `fleet-os`. Il blueprint fornito presuppone invece i file alla radice.

## 3. Crea l’amministratore online

Dopo il primo avvio riuscito, apri **Shell** nel servizio Render. Non usare il pre-deploy: il disco persistente non è disponibile in quella fase.

In Shell (Bash), esegui:

```bash
export FLEET_ADMIN_USER="domenico"
export FLEET_ADMIN_NAME="Domenico Ciccimarra"
export FLEET_COMPANY_ID="matherion"
export FLEET_COMPANY_NAME="Matherion S.r.l."
read -s -p "Password amministratore, almeno 12 caratteri: " FLEET_ADMIN_PASSWORD
export FLEET_ADMIN_PASSWORD
npm run bootstrap
unset FLEET_ADMIN_PASSWORD
```

Non inviare la password in chat, non inserirla nel repository e non abilitarne la stampa nei log. Se compare «Installazione già inizializzata», non cancellare il database: esiste già un’installazione.

La copia online parte vuota: l’amministratore del Mac non viene trasferito automaticamente. Per questa prima prova conviene creare pochi dati fittizi online. Per una migrazione reale serve una procedura dedicata e una copia consistente del database.

## 4. Apri la piattaforma

Render assegna un indirizzo HTTPS `https://<nome-generato>.onrender.com`. Il server lo legge da `RENDER_EXTERNAL_URL`: non occorre copiare manualmente l’URL nelle variabili per il primo dominio Render.

Apri quell’indirizzo e accedi con l’utenza appena creata. Le prove da completare sul servizio reale sono: login, salvataggio veicolo, caricamento allegato, riavvio del servizio, verifica della persistenza e logout. Non è ancora stato eseguito un collaudo remoto in questo ambiente.

## 5. Dominio personalizzato

Aggiungi il dominio dal pannello Render e applica al DNS soltanto i record che Render indica per quel servizio. Quando il dominio è pronto, imposta `FLEET_ORIGIN=https://<dominio-effettivo>` senza percorsi e usa quel dominio per accedere. Lascia `FLEET_COOKIE_SECURE=true`.

Il nome dell’host e l’URL generato dipendono dall’account Render: non usare esempi come se fossero indirizzi già assegnati. Render terminerà HTTPS davanti al server; il processo applicativo ascolterà su `0.0.0.0` e sulla porta assegnata tramite `PORT`.

## Backup e limiti

Il disco persistente impedisce la perdita dei dati al redeploy, ma non sostituisce una politica di backup. Il JSON esportato dalla piattaforma non contiene le credenziali o le sessioni e non è una copia integrale dell’installazione. Per SQLite usare un backup consistente del database.

La versione con SQLite è prevista su una sola istanza. Le connessioni al Supabase e al OneDrive del cliente, gli Excel pianificati e i report selettivi restano da implementare. Il rapporto di collaudo locale non certifica tali integrazioni o l’uso produttivo di tutti i flussi.
