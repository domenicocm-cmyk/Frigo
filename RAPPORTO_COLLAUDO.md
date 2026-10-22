# Rapporto di collaudo — Matherion Fleet OS

Data: 22 ottobre 2026. Revisione locale successiva alla correzione del menu Società.

## Esito

**82 test eseguiti, 82 superati, 0 falliti, 0 annullati, 0 saltati. Compilazione di produzione riuscita.**

| Gruppo | Test | Esito |
|---|---:|---|
| API, sicurezza applicativa, persistenza, concorrenza e riavvio | 28 | Superati |
| Regressioni menu società e valori iniziali | 3 | Superati |
| Interfaccia: apertura sezioni e flussi operativi | 51 | Superati |
| Totale | 82 | Superati |

I 51 test di interfaccia comprendono l’apertura delle 38 sezioni e 13 prove di flusso: inserimento veicolo, aggiornamento dashboard, blocco campi obbligatori, creazione contratto, pneumatici, scadenze, file Excel, esportazione backup, ripristino, allegati, eliminazione con password e audit, creazione utenza e accesso in sola lettura.

## Correzioni emerse dal collaudo

- Riparata la pagina Dati & Backup, che richiamava una variabile e funzioni di sincronizzazione file mancanti. La vecchia descrizione di OneDrive come database è stata sostituita dallo stato «non configurato» coerente con il futuro account cliente.
- Pneumatici salvati nel database, recuperabili anche dopo l’uscita dal modulo e inclusi nel backup applicativo.
- Registro eliminazioni scritto dal server, legato all’identità autenticata e conservato dopo il riavvio; il client non può scrivere nel registro.
- Scadenze calcolate sulla data corrente a Roma anche nella relativa pagina, rimuovendo il riferimento fisso al 19 agosto.
- Comandi per cancellare i vecchi dati demo rimossi dalla pagina Backup per non presentarli su un database operativo.
- Modifica e caricamento allegati disabilitati nell’interfaccia per la sola lettura, oltre ai controlli API esistenti.
- Rifiutate le scritture con un tipo di dato incompatibile con l’archivio.
- Gestiti gli errori nell’esportazione manuale del backup, ripristinando lo stato del pulsante.

## Ambiente e significato delle prove

Node.js 24 nel runtime di collaudo; database SQLite temporanei isolati; server reale avviato dai test; React eseguito in JSDOM per le prove di interfaccia. Il file Excel generato è stato riaperto e controllato. Il ripristino JSON è stato eseguito tramite il selettore file dell’interfaccia simulata e verificato rileggendo i dati dal server.

I database del Mac dell’utente, Supabase e gli account OneDrive non sono stati modificati. La prova su 3.500 veicoli verifica scrittura e rilettura dell’archivio: non è una certificazione di prestazioni dell’interfaccia o del servizio online.

## Limiti: ciò che non è certificato da questo esito

Questo risultato vale per la suite elencata, non dimostra l’assenza di qualsiasi difetto in ogni combinazione d’uso. Non è un collaudo visivo su Safari, Chrome o telefoni reali. La compilazione segnala ancora un bundle JavaScript principale di dimensioni elevate; non blocca la build.

Supabase del cliente e OneDrive del cliente non sono ancora collegati. Non sono quindi verificati autenticazione cloud, caricamento documenti su Microsoft Graph, rinnovo delle autorizzazioni o ripristino da un backup cloud. Gli Excel automatici pianificati e i report selettivi richiesti dai clienti sono requisiti da implementare: non vengono dichiarati funzionanti sulla base delle esportazioni manuali.

Invii email/PEC reali, OCR esterno, condivisione fra tenant, integrazioni di terze parti e correttezza fiscale dei documenti non rientrano nelle prove eseguite. Le operazioni su più archivi non sono ancora una singola transazione aziendale. La gestione dell’elenco utenze non dispone ancora dello stesso controllo di revisione degli archivi operativi.

Il backup applicativo JSON esclude utenti, hash e sessioni. Per il ripristino dell’intera installazione occorre anche una copia consistente del database, eseguita con API SQLite di backup oppure a processo fermo. La cronologia dei documenti esterni andrà gestita dopo il collegamento OneDrive.

## Elenco dei test superati

- API rejects anonymous requests and wrong origin (167.742247ms)
- real credentials, HTTP-only session, safe user DTO (131.604855ms)
- writes survive reads; unknown storage keys blocked (24.871961ms)
- cannot delete own administrator (4.090742ms)
- reader cannot mutate data, escalate role, or read hidden modules (141.077115ms)
- stale writes cannot overwrite newer data (22.298754ms)
- deletion confirmation requires current account password (130.780947ms)
- attachments persist and are hidden from unrelated modules (102.07447ms)
- different tenant cannot read or overwrite the first company (68.182213ms)
- administrator cannot modify an identity belonging to another tenant (8.917322ms)
- business archive contracts supports create, update, deletion and audit (43.799423ms)
- business archive deadlines supports create, update, deletion and audit (53.724175ms)
- business archive maintenance supports create, update, deletion and audit (48.051386ms)
- business archive claims supports create, update, deletion and audit (42.315324ms)
- business archive fines supports create, update, deletion and audit (33.65335ms)
- business archive subRentals supports create, update, deletion and audit (78.71479ms)
- business archive fuelTransactions supports create, update, deletion and audit (147.048687ms)
- business archive calendarEvents supports create, update, deletion and audit (38.841851ms)
- business archive budgets supports create, update, deletion and audit (60.545486ms)
- business archive tires supports create, update, deletion and audit (89.267239ms)
- malformed archive cannot replace a valid record list (18.747106ms)
- document requirements and cookie settings retain correct object shapes (41.334938ms)
- audit endpoint cannot be altered by any client (9.7249ms)
- concurrent updates of the same revision accept exactly one writer (11.544948ms)
- a fleet of 3500 vehicles survives storage round trip (55.057213ms)
- records, sessions and deletion audit survive server restart (279.055901ms)
- idle session expires and requires authenticating again (93.348316ms)
- logout invalidates session (7.917438ms)
- company choices follow hydrated company registry instead of demo snapshot (3.131834ms)
- new vehicle selects the sole actual company; existing invalid company needs explicit selection (1.760757ms)
- company choices update when a company is added without restarting app (1.632776ms)
- UI opens dashboard: Dashboard (2657.614236ms)
- UI opens flotta: Anagrafica Flotta (165.403996ms)
- UI opens societa: Anagrafica Società (164.841874ms)
- UI opens capacita: Capacità Finanziaria (168.013779ms)
- UI opens partner: Clienti & Fornitori (167.636352ms)
- UI opens prese: Prese in Carico (163.483965ms)
- UI opens chat: Chat Interna (168.487089ms)
- UI opens email: Posta Elettronica (165.274726ms)
- UI opens trasferimenti: Assegnazioni & Trasferimenti (163.017133ms)
- UI opens trasferimenti_massivi: Trasferimenti Massivi (166.514933ms)
- UI opens contratti: Contratti (167.099826ms)
- UI opens subnoleggio: Subnoleggio (162.994666ms)
- UI opens rinnovi: Rinnovi Subnoleggio (162.433888ms)
- UI opens fatturazione: Fatturazione (163.206581ms)
- UI opens scadenze: Scadenze & Compliance (163.264685ms)
- UI opens manutenzione: Manutenzione (165.680532ms)
- UI opens pneumatici: Pneumatici (164.506153ms)
- UI opens magazzino: Magazzino Ricambi (166.000986ms)
- UI opens cisterne: Cisterne Carburante & AdBlue (163.652836ms)
- UI opens carburante: Carburante & Fuel Card (164.581591ms)
- UI opens pedaggi: Telepass & Pedaggi (165.048646ms)
- UI opens dotazioni: Dotazioni di Bordo (164.796011ms)
- UI opens rifornimenti: Rifornimenti Veicoli (164.514802ms)
- UI opens sinistri: Sinistri (163.27036ms)
- UI opens verbali: Verbali & Multe (163.69759ms)
- UI opens costi: Costi & Redditività (164.90245ms)
- UI opens analisi: Analisi Economica (162.426762ms)
- UI opens budget: Budget Centri di Costo (164.583963ms)
- UI opens accise: Rimborso Accise (165.058352ms)
- UI opens importazione: Importazione Dati (163.814096ms)
- UI opens importdocs: Importazione Documenti (163.810913ms)
- UI opens conformita_doc: Conformità Documentale (163.897843ms)
- UI opens esportazioni: Esportazione Guidata (163.472797ms)
- UI opens compliance: Privacy & Cookie (163.790797ms)
- UI opens backup: Dati & Backup (163.919238ms)
- UI opens calendario: Calendario Condiviso (164.400096ms)
- UI opens audit: Registro Eliminazioni (163.158594ms)
- UI opens utenti: Utenti & Permessi (163.575686ms)
- UI creates a vehicle and preserves company, engine details and driver after server save (1020.513503ms)
- UI dashboard count reflects saved vehicle rather than demo data (164.32588ms)
- UI required fields prevent saving an empty vehicle (230.296774ms)
- UI creates a contract linked to the saved vehicle (963.459456ms)
- UI tire records survive leaving and reopening the module (1255.380891ms)
- UI deadline remaining days uses the current Rome date (922.504258ms)
- UI exports a genuine Excel workbook with saved vehicle and company (827.956624ms)
- UI backup contains persisted vehicle, contract and tires without identities or credentials (869.240613ms)
- UI backup restore reads the file and restores selected application records (2612.500473ms)
- UI attachment upload preserves content in server and offers download after reopening (951.685797ms)
- UI deletion requires password and remains in server audit (1127.237131ms)
- UI administrator creates a real read-only account (988.24718ms)
- UI logout and read-only login hide mutation controls including attachments (1332.679285ms)
