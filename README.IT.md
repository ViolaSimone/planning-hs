# Planning H&S

[English version](README.md)

Gestione della formazione sulla sicurezza aziendale e della sorveglianza sanitaria: un'unica dashboard per sapere, in ogni momento, chi ha i corsi in regola, chi sta per scadere e chi è già fuori norma.

<video src="https://github.com/user-attachments/assets/dccd54c6-87e9-44f0-8b86-331f6cee3e57" controls muted playsinline width="100%"></video>

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

Il progetto non è legato a un settore specifico. Oltre ai corsi e ai ruoli precaricati all'avvio, è possibile creare liberamente nuovi corsi, ruoli di sicurezza, inquadramenti aziendali, piani di sorveglianza sanitaria e collegamenti tra essi.

Questo rende l'app adattabile a tipologie di azienda molto diverse tra loro, ad esempio:

- **Azienda manifatturiera**: ruoli come Operaio, Addetto Muletto e Preposto di reparto; corsi specifici per macchine e attrezzature; piano sanitario per movimentazione manuale dei carichi.
- **Studio professionale o ufficio**: ruoli come Impiegato e Videoterminalista, con piano sanitario dedicato.
- **Azienda alimentare**: Operatore Alimentare con corso HACCP obbligatorio, oltre alla formazione generale.

## Sicurezza delle credenziali

Le impostazioni SMTP (host, porta, username, mittente e destinatario del report) sono salvate nel database dell'app e restano disponibili dopo un riavvio del backend, in modo che gli alert automatici continuino a funzionare.

La password SMTP viene cifrata prima di essere salvata nel database e non viene mai restituita dall'API. Il campo password resta vuoto nell'interfaccia anche quando una password è già configurata; l'app mostra solo lo stato di configurazione.

La chiave `SETTINGS_ENCRYPTION_KEY` vive soltanto in `backend/.env`, mai nel database e mai su GitHub. Per generarla alla prima installazione:

```bash
cd backend
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copia il valore in `backend/.env`:

```env
SETTINGS_ENCRYPTION_KEY=<valore-generato>
```

Se la chiave non viene impostata, l'app continua a funzionare, ma la password SMTP salvata dalla UI non viene conservata dopo il riavvio. Gli altri campi vengono comunque salvati.

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | Next.js 16.3.3 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), SQLAlchemy 2.0 async, Alembic, APScheduler |
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

Su Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend / documentazione API: [http://localhost:8000/docs](http://localhost:8000/docs)

Per la guida Docker completa, vedi [`docs/DOCKER.md`](docs/DOCKER.md).

### Senza Docker

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python start_backend.py
```

Su Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

#### Frontend: sviluppo

In un secondo terminale:

```bash
cd frontend
npm install
npm run dev
```

#### Frontend: test production standalone

Il progetto usa `output: "standalone"`. Per testare localmente la build production:

```bash
cd frontend
npm run build
npm run start
```

`npm run build` genera l'output standalone e prepara gli asset statici; `npm run start` avvia `.next/standalone/server.js`. Questa modalità non offre hot reload.

Backend e frontend devono essere entrambi attivi. Requisiti: Python 3.11 o 3.12, Node.js 18+ e npm.

> Ogni modifica ai modelli deve essere accompagnata da una migrazione Alembic: `alembic revision --autogenerate -m "descrizione"`, poi `alembic upgrade head`.

## Configurazione

Copia `backend/.env.example` in `backend/.env`. Il file `.env` reale non deve essere pubblicato. Le impostazioni SMTP, le soglie e lo scheduler sono modificabili anche dalla pagina Impostazioni.

## Dati e persistenza

Il database conserva dipendenti, corsi, storico e configurazione tra i riavvii. Per azzerare i dati Docker:

```bash
docker compose down -v --remove-orphans
```

In locale, elimina `planning_hs.db` e rilancia `alembic upgrade head`.

## Verifica manuale

Prima di una nuova versione, verifica avvio, migrazioni, creazione/modifica dipendenti, corsi, visite mediche, dashboard, Pianifica, report, impostazioni SMTP, alert, export Excel e CSV, build standalone e Docker in modalità dev e production-style.

## Struttura del progetto

planning-hs/
├── README.md
├── README.IT.md
├── LICENSE
├── docker-compose.yml
├── docker-compose.prod.yml
├── .dockerignore
├── docs/
│   ├── DOCKER.md
│   ├── GUIDA_UTENTE.md
│   └── USER_GUIDE.md
│
├── backend/
│   ├── .dockerignore
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/versions/
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── repositories.py
│   ├── services.py
│   ├── settings_service.py
│   ├── excel_utils.py
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
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    ├── scripts/
    │   └── copy-standalone-assets.js
    ├── lib/
    ├── components/
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── employees/
        ├── courses/
        ├── surveillance/
        ├── planning/
        ├── reports/
        └── settings/

## Guida utente

La guida operativa per HR, RSPP e responsabili formazione è disponibile in [`docs/GUIDA_UTENTE.md`](docs/GUIDA_UTENTE.md).

## Privacy e roadmap

Planning H&S è attualmente pensato per sviluppo, demo e valutazione tecnica. Prima di un uso produttivo con dati personali reali saranno necessarie ulteriori misure, tra cui autenticazione con utenti distinti, autorizzazioni per ruolo, registro di audit, cifratura del database e dei backup, HTTPS e procedure di sicurezza.

La conformità GDPR dipende anche dal contesto, dall'infrastruttura e dalle procedure dell'organizzazione.

## Licenza

Distribuito con licenza [MIT](LICENSE).
