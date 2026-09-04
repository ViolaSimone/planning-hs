# Planning H&S

Gestione della formazione sicurezza aziendale e della sorveglianza sanitaria: un'unica dashboard per sapere, in ogni momento, chi ha i corsi in regola, chi sta per scadere e chi è già fuori norma.

<video src="docs/media/demo.mp4" autoplay loop controls muted playsinline width="100%"></video>



## Il problema che risolve

Nelle aziende soggette al D.Lgs. 81/2008, ogni dipendente deve avere corsi di sicurezza validi (Sicurezza Generale, Antincendio, Primo Soccorso, RLS, formazioni specifiche per ruolo) e, se previsto dal suo inquadramento, una sorveglianza sanitaria periodica in corso di validità.

Tenere traccia di tutto questo con un foglio Excel diventa rapidamente insostenibile quando cresce il numero di dipendenti, di ruoli e di corsi: le scadenze si perdono, gli aggiornamenti vengono fatti a mano su più copie del file, non c'è uno storico affidabile e non c'è nessun avviso automatico quando una scadenza si avvicina.

Planning H&S centralizza questi dati in un unico posto, calcola automaticamente le scadenze in base al corso, al ruolo e all'inquadramento del dipendente, segnala visivamente lo stato con colori e può inviare un'email di riepilogo quando qualcosa cambia, senza bisogno di controllare la dashboard ogni giorno.

## Come funziona

Il cuore del sistema è la relazione tra alcuni concetti collegati tra loro:

- **Ruoli di sicurezza** (es. RSPP, RLS, Preposto, Addetto Antincendio): ogni ruolo richiede uno o più corsi obbligatori.
- **Inquadramento** del dipendente (es. Operaio, Impiegato): determina se e quale piano di sorveglianza sanitaria si applica.
- **Corsi** e **piani di sorveglianza sanitaria**: hanno una periodicità di rinnovo (in anni o mesi); alcuni, come Sicurezza Generale, non scadono mai.

Quando assegni ruoli e inquadramento a un dipendente, l'app calcola da sola quali corsi gli servono e quando scadranno, in base alla data di completamento inserita. Lo stesso vale per l'idoneità medica, calcolata dal piano di sorveglianza collegato al suo inquadramento.

Ogni corso o visita medica viene classificato in una di queste categorie, in base ai giorni rimanenti prima della scadenza:

| Categoria | Significato |
|---|---|
| In regola | Nessuna scadenza imminente |
| In scadenza | Sotto la soglia configurata (default 70 giorni) |
| Critico / Scaduto | Scadenza già passata |
| Mancante | Corso o visita obbligatoria mai registrata |

### Alert e notifiche automatizzate

Una volta al giorno, a un orario configurabile, l'app esegue un controllo automatico che confronta lo stato attuale di ogni dipendente/corso con quello rilevato nel controllo precedente. Se una combinazione dipendente-corso è passata da "In regola" a "In scadenza", oppure da "In scadenza" a "Critico", oppure un corso obbligatorio è diventato "Mancante", questo viene registrato come cambiamento.

Se ci sono cambiamenti, viene inviata **una sola** email di riepilogo al destinatario configurato, con l'elenco di tutte le variazioni raggruppate per categoria. Se dal giorno precedente non cambia nulla, non arriva nessuna email: questo evita sia il rumore di notifiche ripetute sia il rischio di dimenticare una scadenza perché sepolta in troppi avvisi.

Dalla pagina Impostazioni è sempre possibile forzare un controllo immediato con "Verifica cambiamenti ora", utile per testare la configurazione email senza aspettare l'orario programmato. Se l'invio non riesce (SMTP non configurato, credenziali errate, destinatario mancante), la pagina mostra il motivo in modo esplicito, senza mai rivelare la password.

## Funzionalità principali

### Dashboard

Vista d'insieme di tutti i dipendenti, con stato colorato per ogni corso obbligatorio e per l'idoneità medica. Filtri per sede, reparto, ruolo e inquadramento. Export in Excel o CSV delle colonne selezionate.

### Anagrafica dipendenti

Dati personali, ruoli di sicurezza multipli, inquadramento singolo, storico degli inquadramenti nel tempo.

### Corsi

Catalogo dei corsi con periodicità di rinnovo personalizzabile (in anni), corsi che non scadono mai (es. Sicurezza Generale), e collegamento tra corso e ruoli che lo richiedono come obbligatorio.

### Sorveglianza sanitaria

Piani sanitari configurabili (es. "Videoterminalisti", "Movimentazione carichi"), con periodicità in anni o mesi, associati a uno o più inquadramenti. Ogni dipendente ha una sola idoneità medica corrente, con storico completo delle visite passate conservato lato backend.

### Pianifica

Questa sezione non serve solo a vedere chi sta per scadere: è pensata per raccogliere rapidamente i dati necessari a organizzare un'aula di formazione o a preparare gli attestati di partecipazione. Selezioni un corso o un piano sanitario, l'app ti mostra automaticamente tutti i dipendenti candidati (mancanti, scaduti, critici o in scadenza), ordinati per urgenza.

Da qui puoi scegliere quali campi rendere visibili nell'export, ad esempio Nome, Cognome, Codice Fiscale, Data di nascita, Luogo di nascita, Reparto e Ruoli: esattamente i dati richiesti per compilare un registro d'aula o generare gli attestati di un corso, senza dover ricopiare i dati a mano da un'altra sezione dell'app. L'export filtrato può essere scaricato in Excel o CSV, già pronto per essere usato come base per la modulistica del corso.

### Report

I report per corso e per piano sanitario non si limitano a mostrare la situazione attuale: permettono di impostare una soglia di giorni a piacere (es. 90, 180, 365 giorni) per capire quante persone avranno bisogno di un rinnovo in un dato periodo futuro. Questo rende la sezione Report uno strumento utile per il calcolo del fabbisogno formativo e per pianificare in anticipo il budget o le sessioni d'aula dei prossimi mesi.

### Configurabilità e adattabilità

Il progetto non è legato a un settore specifico. Oltre ai corsi e ai ruoli precaricati all'avvio (pensati come punto di partenza generico), è possibile creare liberamente:

- nuovi corsi, con propria periodicità di rinnovo;
- nuovi ruoli di sicurezza;
- nuovi inquadramenti aziendali;
- nuovi piani di sorveglianza sanitaria;
- nuovi collegamenti tra ruoli e corsi obbligatori, e tra inquadramenti e piani sanitari.

Questo rende l'app adattabile a tipologie di azienda molto diverse tra loro. Ad esempio:

- **Azienda manifatturiera**: ruoli come Operaio, Addetto Muletto, Preposto di reparto; corsi specifici per macchine e attrezzature; piano sanitario per movimentazione manuale dei carichi.
- **Studio professionale o ufficio**: ruoli come Impiegato, Videoterminalista.
- **Azienda alimentare**: ruolo Operatore Alimentare con corso HACCP obbligatorio.

In tutti i casi, la logica di calcolo delle scadenze e degli alert resta identica: cambia solo la configurazione, non il codice.

## Sicurezza delle credenziali

Le impostazioni SMTP (host, porta, username, mittente, destinatario del report) sono salvate nel database dell'app e restano disponibili dopo un riavvio del backend, in modo che gli alert automatici continuino a funzionare senza dover reinserire la configurazione ogni volta.

La password SMTP è trattata diversamente: viene **cifrata** prima di essere salvata nel database e non viene mai restituita da nessuna chiamata API, nemmeno dopo il salvataggio. Il campo password nella pagina Impostazioni parte sempre vuoto: se una password è già configurata, la pagina lo segnala esplicitamente, senza mostrarla.

Per poter cifrare e decifrare questa password, l'app usa una chiave dedicata, `SETTINGS_ENCRYPTION_KEY`, che vive solo in `backend/.env` (mai nel database, mai su GitHub). Alla prima installazione, genera questa chiave una sola volta, con il virtual environment del backend attivo:

```bash
cd backend
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copia il valore restituito in `backend/.env`:

```env
SETTINGS_ENCRYPTION_KEY=<valore-generato>
```

Se questa chiave non viene impostata, l'app funziona comunque normalmente: semplicemente, qualsiasi password SMTP salvata dalla pagina Impostazioni non verrà conservata in modo permanente e andrà persa al riavvio del backend. Gli altri campi (host, username, mittente, soglie) vengono invece sempre salvati, chiave o non chiave.

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | Next.js 16.3.3 (App Router), React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), SQLAlchemy 2.0 (async), Alembic, APScheduler |
| Database | SQLite in locale, PostgreSQL in cloud |
| Notifiche | FastAPI-Mail (SMTP), password cifrata con `cryptography` |

## Avvio rapido

### Con Docker (consigliato)

```bash
git clone <url-del-repository>
cd planning-hs

cp backend/.env.example backend/.env
docker compose up --build
```

Su Windows PowerShell, usa:

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend / documentazione API: [http://localhost:8000/docs](http://localhost:8000/docs)

La configurazione Docker predefinita avvia l'ambiente di sviluppo, con hot reload del frontend. Per la guida Docker completa, il reset dei dati, la modalità production-style e il troubleshooting, vedi [`docs/DOCKER.md`](docs/DOCKER.md).

### Senza Docker

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
alembic upgrade head
python start_backend.py
```

Su Windows PowerShell, l'attivazione dell'ambiente virtuale e la copia del file sono:

```powershell
.\venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

#### Frontend: sviluppo quotidiano

In un secondo terminale:

```bash
cd frontend
npm install
npm run dev
```

Questo avvia Next.js in modalità sviluppo, con hot reload: è il comando da usare mentre modifichi il codice.

#### Frontend: test della build production

Il progetto usa `output: "standalone"` in Next.js. Per verificare localmente la build di produzione, in un secondo terminale esegui:

```bash
cd frontend
npm run build
npm run start
```

`npm run build` genera l'output standalone e copia automaticamente gli asset statici necessari; `npm run start` avvia il server standalone generato in `.next/standalone/server.js`. Questa modalità non offre hot reload ed è pensata per un test locale simile alla produzione.

Backend su `http://localhost:8000`, frontend su `http://localhost:3000`. Devono essere entrambi attivi: il frontend da solo si limita a chiamare le API del backend, che gestisce database, calcolo scadenze, alert ed export.

**Requisiti:** Python 3.11 o 3.12 (raccomandato), Node.js 18+ e npm.

> Ogni volta che aggiungi o modifichi un modello in `backend/models.py`, genera una nuova migrazione con `alembic revision --autogenerate -m "descrizione"` e applicala con `alembic upgrade head`. Lo schema del database è gestito da Alembic, non da una creazione automatica delle tabelle all'avvio.


## Configurazione

Tutta la configurazione parte da `backend/.env.example`. Copialo in `backend/.env` e personalizza solo la tua copia locale: quel file non deve mai essere pubblicato su GitHub.

Le impostazioni SMTP, le soglie di alert e l'orario del controllo automatico possono anche essere modificate a runtime dalla pagina **Impostazioni** dell'app, senza toccare il file `.env`.

## Dati e persistenza

Il database (SQLite in locale, PostgreSQL in cloud) conserva dipendenti, corsi, storico e configurazione dell'app tra un riavvio e l'altro. Per azzerare completamente i dati di test prima di una demo o di una pubblicazione:

```bash
docker compose down -v --remove-orphans
```

oppure, in locale, elimina il file `planning_hs.db` e rilancia `alembic upgrade head`.

## Verifica manuale

Prima di distribuire una nuova versione, esegui una verifica manuale essenziale in ambiente locale o Docker.

| Area | Verifica |
|---|---|
| Avvio | Backend, frontend e documentazione API sono raggiungibili senza errori |
| Database | Le migrazioni Alembic vengono applicate e l'app parte con un database vuoto |
| Dipendenti | Creazione, modifica e cancellazione di un dipendente |
| Formazione | Inserimento, modifica e rimozione di una data corso; calcolo corretto della scadenza |
| Sorveglianza | Inserimento e aggiornamento dell'idoneità medica; calcolo della scadenza dal piano associato |
| Dashboard | Filtri, stati colorati e dati coerenti con ruoli e inquadramenti assegnati |
| Pianifica | Selezione corso/piano, filtri, scelta campi visibili ed export Excel/CSV |
| Report | Filtri temporali, calcolo delle situazioni mancanti/in scadenza/scadute ed export |
| Impostazioni | Salvataggio di soglie, orario e dati SMTP non sensibili dopo refresh e riavvio backend |
| Password SMTP | La password non viene restituita dall'API; lo stato `smtp_password_configured` viene aggiornato correttamente |
| Notifiche | Il controllo immediato rileva cambiamenti e segnala chiaramente invio riuscito o errore SMTP |
| Export Excel | Le colonne sono adattate al contenuto e risultano leggibili senza ridimensionamento manuale |
| Build frontend | `npm run build` e `npm run start` funzionano senza errori 404 per asset JS o CSS |
| Docker | Test riuscito sia con `docker compose up --build` sia con `docker compose -f docker-compose.prod.yml up --build` |

Per una verifica ripetibile prima del push, usa un database e credenziali SMTP di test. Non inserire dati personali reali, password reali o chiavi private nel repository.


## Struttura del progetto

```text
planning-hs/
├── README.md
├── LICENSE                         # MIT License
├── docker-compose.yml              # Ambiente Docker di sviluppo
├── docker-compose.prod.yml         # Test Docker production-style
├── .dockerignore                   # Opzionale: utile solo con build context root
├── docs/
│   ├── DOCKER.md
│   └── GUIDA_UTENTE.md
│   └── media/
│
├── backend/
│   ├── .dockerignore
│   ├── .env.example                   # Template pubblico della configurazione
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── repositories.py
│   ├── services.py
│   ├── settings_service.py            # Impostazioni persistenti e cifratura SMTP
│   ├── excel_utils.py                 # Adattamento colonne degli export Excel
│   ├── alert_engine.py
│   ├── notifications.py
│   ├── scheduler.py
│   ├── schemas/
│   ├── routers/
│   ├── start_backend.py
│   ├── start_backend.ps1
│   ├── start_backend.sh
│   └── main.py
│
└── frontend/
    ├── .dockerignore
    ├── Dockerfile                     # Stage dev, builder e runner
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    ├── scripts/
    │   └── copy-standalone-assets.js  # Prepara gli asset per npm run start
    ├── lib/
    ├── components/
    └── app/
        ├── layout.tsx
        ├── page.tsx                   # Dashboard
        ├── employees/
        ├── courses/
        ├── surveillance/
        ├── planning/
        ├── reports/
        └── settings/
```

## Guida utente

Una guida operativa pensata per chi usa l'app quotidianamente (HR, RSPP, responsabili formazione), separata dalla documentazione tecnica, sarà disponibile in `docs/GUIDA_UTENTE.md`.

## Privacy e roadmap

 Non deve essere considerato automaticamente idoneo all'uso in produzione con dati personali reali o conforme al GDPR senza una valutazione specifica del contesto, dell'infrastruttura e delle procedure organizzative adottate.

Prima di un utilizzo produttivo, le principali evoluzioni previste sono:

- autenticazione con utenti distinti e password gestite in modo sicuro;
- ruoli e autorizzazioni per limitare l'accesso ai soli dati necessari;
- registro di audit delle operazioni rilevanti, incluse modifiche, esportazioni e attività amministrative;
- cifratura del database e dei backup, con gestione sicura delle chiavi;
- protezione del traffico tramite HTTPS e procedure di backup, ripristino e aggiornamento della sicurezza.

La conformità al GDPR non dipende soltanto dall'applicazione: richiede anche configurazione sicura, procedure aziendali, formazione degli utenti e valutazione del rischio nel caso concreto.

## Licenza

MIT
