# Matherion Fleet OS — revisione accessi e funzionamento

Questa è una versione di lavoro eseguibile del sorgente fornito, con server incluso. Non è stata pubblicata e non modifica il sito, il repository o il progetto Supabase esistenti. Conservare una copia dei dati della versione precedente prima della migrazione.

## Avvio locale

Richiede Node.js 24 o successivo. Dalla cartella del progetto:

```bash
npm ci
npm run build
```

Creare il primo amministratore una sola volta. Impostare `FLEET_ADMIN_USER`, `FLEET_ADMIN_PASSWORD` (almeno 12 caratteri), `FLEET_ADMIN_NAME`, `FLEET_ADMIN_EMAIL`, `FLEET_COMPANY_ID` e `FLEET_COMPANY_NAME` nell'ambiente di esecuzione, quindi:

```bash
npm run bootstrap
```

Non inserire password nel sorgente o nei file da pubblicare. Il bootstrap si rifiuta di ricreare un'installazione già inizializzata. Eliminare la variabile della password dall'ambiente dopo il bootstrap.

Per provare solo in locale, impostare `FLEET_COOKIE_SECURE=false`, poi:

```bash
npm start
```

Aprire http://localhost:3000. Le nuove utenze si creano da **Utenti & Permessi**, accedendo come amministratore. Non esistono credenziali predefinite né registrazione pubblica. Le utenze create da interfaccia appartengono alla società dell'amministratore.

Per pubblicare: usare un servizio che esegua Node e disponga di un volume persistente. Configurare HTTPS sul reverse proxy, `FLEET_ORIGIN` con l'origine esatta del sito (senza percorso o slash finale) e `FLEET_COOKIE_SECURE=true`. Il processo ascolta solo su 127.0.0.1. Il semplice caricamento di `dist` su hosting statico non attiva autenticazione o salvataggi. `FLEET_DATA_DIR` imposta la cartella privata del database; non deve essere esposta dal server web.

Il comando `npm run dev` usa Vite su porta 5173 con proxy verso Node: in questo caso il server Node va avviato con `FLEET_ORIGIN=http://localhost:5173`. Per la prova standard è più semplice usare build e start.

## Correzioni realizzate

- Nessun accesso automatico come super amministratore; nessun cambio identità senza autenticazione.
- Password verificate lato server con scrypt e sale casuale; profili restituiti senza password o hash.
- Cookie di sessione HttpOnly e SameSite Strict, Secure come impostazione predefinita. Sessioni limitate a 8 ore con scadenza dopo 20 minuti di inattività delle richieste.
- Permessi controllati sulle API di lettura e scrittura, con archivi separati per società. Le verifiche nel browser restano un supporto all'interfaccia.
- Limitazione dei tentativi di login e conferma password; controllo dell'origine per richieste che modificano dati.
- PIN dimostrativi per le cancellazioni sostituiti dalla verifica della password corrente. La vera autorizzazione alla modifica rimane sul server.
- Impossibile eliminare, disattivare o declassare il proprio amministratore dall'elenco utenze.
- Le letture fallite non vengono trasformate in archivi vuoti da inizializzare; le scritture sono serializzate.
- Controllo di revisione per gli archivi operativi: una pagina con dati obsoleti riceve un errore invece di sovrascrivere modifiche più recenti.
- Allegati persistenti per società, con filtri per i permessi del modulo. Il limite iniziale è 7 MB complessivi per l'archivio allegati; per documentali voluminosi occorre object storage.
- Correzione della conferma di commit IndexedDB e degli errori della coda per il percorso locale legacy.
- KPI cliccabili e utilizzabili da tastiera: il componente Card prima non inoltrava gli eventi.
- Cache TCO invalidata anche quando cambia un costo senza cambiare la lunghezza dell'elenco.
- Data operativa basata sul giorno corrente a Roma; scadenze della dashboard ricalcolate.
- Grafici principali della dashboard collegati ai veicoli e contratti caricati, senza i valori fissi dimostrativi. Il grafico canoni rappresenta il canone mensile intero per i contratti che intersecano il mese; non è un libro contabile o un calcolo giornaliero pro rata.
- Backup applicativi senza credenziali. Il ripristino non importa utenze e si interrompe al primo errore esplicitando eventuali aggiornamenti parziali.

## Grafica

Prima revisione degli elementi comuni: dashboard con azioni rapide, palette teal coerente con Matherion, superfici più leggibili, focus da tastiera evidente, campi e pulsanti più comodi su telefono. Non è una riprogettazione completa di tutti i moduli.

## Verifiche e limiti

`npm test`: test API per accessi anonimi, origine delle richieste, credenziali, cookie, sola lettura, gestione utenze, persistenza, conflitti, conferma password, allegati e logout. `npm run build`: compilazione della piattaforma. Sono stati eseguiti 83 test automatici, inclusi navigazione delle 38 sezioni, flussi UI in DOM simulato, Excel, backup e ripristino; vedere RAPPORTO_COLLAUDO.md. Il browser Chromium non era disponibile: nessuna verifica visiva completa su dispositivi reali è stata eseguita.

Questa revisione non equivale a un collaudo di tutti i processi aziendali. Il sorgente originale contiene moduli e cataloghi dimostrativi; integrazioni email, OCR, SharePoint, scambi fra società autonome e altri servizi richiedono collegamenti e prove specifiche. Nessuna email viene spedita da questo server. Le eliminazioni di record identificati da ID vengono ora registrate dal server e il registro sopravvive al riavvio.

Il server incluso usa SQLite su un unico processo e volume persistente: è una base verificabile, non il collegamento al Supabase già esistente. La migrazione di dati, utenti e autorizzazioni sul database esistente richiede schema e configurazione attuali; qui non sono state create o modificate tabelle remote. Non usare due amministratori contemporaneamente per modificare l'elenco utenze: il controllo di revisione riguarda gli archivi operativi, non l'elenco identità. Le modifiche multiarchivio (per esempio trasferimento veicolo più contratto) non sono ancora transazioni atomiche.

I backup JSON non includono password, sessioni o hash degli utenti. Per recuperare l'intera installazione serve un backup consistente del database privato: con SQLite in WAL usare l'API di backup SQLite o arrestare il processo prima della copia. Tenere i backup fuori dal volume applicativo.

Le società nel modello possono rappresentare controparti e proprietari dei veicoli; il confine di sicurezza del server è il tenant associato all'utente. L'interfaccia non consente di cambiare tenant. La creazione di un secondo tenant e la condivisione autorizzata di record fra tenant richiedono un flusso amministrativo dedicato.

Per l'uso reale restano da verificare con dati di prova: creazione/modifica veicolo, contratti e subnoleggi, allegati, fatturazione, importazioni, trasferimenti e ripristino. Non importare direttamente un backup operativo senza una prova su una copia del database.


## Aggiornare una copia già installata sul Mac

Arrestare il server con Control+C e fare prima una copia dell’intera cartella `fleet-os`, a server fermo. Dal nuovo pacchetto copiare nella cartella esistente `FleetPlatform.jsx`, `server.mjs`, `package.json`, `package-lock.json` e la cartella `tests`. Non sostituire o cancellare `private-data`. Quindi eseguire:

```bash
npm ci
npm test
npm run build
FLEET_COOKIE_SECURE=false npm start
```

`FLEET_COOKIE_SECURE=false` serve soltanto al collaudo locale via HTTP. Non rieseguire il bootstrap: utenti e dati esistenti restano nel database. Il server aggiunge automaticamente la tabella di audit se manca. La nuova revisione salva anche i pneumatici e rimuove i vecchi comandi di azzeramento dell’archivio dimostrativo dalla pagina Backup.

Supabase e OneDrive saranno quelli del cliente finale e non vengono configurati da questo pacchetto. L’esportazione Excel manuale è collaudata; la pianificazione automatica, l’esportazione selettiva richiesta dai clienti e il collegamento documentale OneDrive non sono ancora implementati o verificati in un ambiente cliente.


## Pubblicazione online

Vedere `PUBBLICAZIONE_RENDER.md` e `render.yaml`. Il pacchetto è predisposto per un Web Service Render con disco persistente a pagamento. Nessun servizio è stato creato o pubblicato automaticamente.
