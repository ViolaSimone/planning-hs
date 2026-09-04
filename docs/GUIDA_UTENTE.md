# Guida utente — Planning H&S

Planning H&S aiuta a gestire formazione obbligatoria e sorveglianza sanitaria dei dipendenti. Questa guida è pensata per HR, RSPP, responsabili formazione, amministrazione e per chi deve mantenere aggiornate le scadenze aziendali.

> Questa è una guida operativa. Per installazione, Docker, configurazione tecnica e sviluppo, consulta il [README principale](../README.md) e la [guida Docker](DOCKER.md).

## Prima configurazione

Al primo avvio l'app include un set di esempio con ruoli, corsi, inquadramenti e piani sanitari comuni. Prima di inserire i dipendenti, controlla che questa configurazione rispecchi la tua organizzazione.

L'ordine consigliato è:

1. Verificare o creare gli inquadramenti aziendali.
2. Verificare o creare i ruoli di sicurezza.
3. Verificare o creare i corsi e collegarli ai ruoli che li richiedono.
4. Verificare o creare i piani di sorveglianza sanitaria e collegarli agli inquadramenti interessati.
5. Inserire i dipendenti, assegnando ruoli e inquadramento.
6. Registrare le date dei corsi e delle visite già svolte.
7. Configurare soglie e notifiche email nella pagina Impostazioni.

## Concetti principali

### Ruoli di sicurezza

I ruoli di sicurezza descrivono responsabilità o attività che richiedono una formazione specifica: ad esempio RSPP, RLS, Preposto, Addetto Antincendio, Addetto Primo Soccorso o Operatore Alimentare.

Un dipendente può avere più ruoli contemporaneamente. Ogni ruolo può avere uno o più corsi obbligatori associati. Quando assegni un ruolo a un dipendente, la dashboard calcola automaticamente i corsi necessari per quel dipendente.

### Inquadramenti e piani sanitari

L'inquadramento identifica il profilo lavorativo del dipendente, ad esempio Impiegato o Operaio. Ogni dipendente ha un solo inquadramento attivo.

Un piano di sorveglianza sanitaria definisce la periodicità del rinnovo dell'idoneità medica e può essere collegato a uno o più inquadramenti. Per esempio:

- Un piano “Videoterminalisti” può essere associato agli impiegati e avere rinnovo ogni 24 mesi.
- Un piano “Movimentazione carichi” può essere associato agli operai e avere rinnovo ogni 12 mesi.

Quando registri una visita medica, l'app usa il piano associato all'inquadramento corrente per calcolare automaticamente la prossima scadenza.

### Stati e colori

Ogni corso obbligatorio e ogni idoneità medica può trovarsi in uno dei seguenti stati:

| Stato | Significato | Azione consigliata |
|---|---|---|
| In regola | La formazione o l'idoneità è valida e non è prossima alla scadenza | Nessuna azione immediata |
| In scadenza | La scadenza è entro la soglia configurata | Pianificare rinnovo, corso o visita |
| Critico / Scaduto | La scadenza è raggiunta o già passata | Intervenire con priorità |
| Mancante | Il requisito è obbligatorio ma non è stata inserita alcuna data | Verificare la situazione e pianificare l'attività |

La soglia “In scadenza” è configurabile dalla pagina Impostazioni. Il valore iniziale è 70 giorni.

## Gestire i dipendenti

Apri la sezione **Dipendenti** per creare, cercare, modificare o rimuovere le anagrafiche.

Per creare un dipendente:

1. Seleziona l'azione per aggiungere un nuovo dipendente.
2. Inserisci almeno nome e cognome.
3. Compila, se disponibili, email, telefono, reparto, sede, posizione lavorativa e dati anagrafici.
4. Seleziona uno o più ruoli di sicurezza.
5. Seleziona l'inquadramento applicabile.
6. Salva.

Dopo il salvataggio, l'app determina automaticamente i corsi obbligatori in base ai ruoli assegnati e verifica se l'inquadramento richiede una sorveglianza sanitaria.

Quando cambi l'inquadramento di un dipendente, il backend conserva lo storico degli inquadramenti. Verifica comunque che il nuovo inquadramento sia coerente con le mansioni effettive e con il piano sanitario applicabile.

## Gestire corsi e formazione

Nella sezione **Corsi** puoi amministrare il catalogo formativo.

Per ogni corso puoi definire:

- nome e codice identificativo;
- descrizione;
- anni di validità/rinnovo;
- stato attivo;
- ruoli per i quali il corso è obbligatorio.

Imposta la validità a `0` per i corsi che non prevedono rinnovo. Un esempio tipico è la Sicurezza Generale: dopo aver registrato la data, il corso resta in regola e non riceve una scadenza automatica.

Per registrare un corso completato per un dipendente, apri la relativa gestione della formazione, scegli il corso e inserisci la data di completamento. L'app calcola la data di rinnovo usando la periodicità configurata nel catalogo corsi.

Se modifichi gli anni di rinnovo di un corso, controlla le date di scadenza: l'app ricalcola i rinnovi dei record esistenti in base alla nuova regola.

## Gestire sorveglianza sanitaria

Nella sezione **Sorveglianza** puoi configurare i piani sanitari e registrare le idoneità mediche.

Per creare un piano:

1. Inserisci nome e descrizione.
2. Imposta il valore del rinnovo.
3. Scegli l'unità di misura: mesi oppure anni.
4. Collega uno o più inquadramenti.
5. Salva il piano.

Per registrare o aggiornare una visita medica di un dipendente, inserisci la data dell'ultima visita. L'app associa la visita al piano applicabile e calcola la prossima scadenza. Lo storico delle visite è conservato lato backend, anche se nella dashboard viene mostrata soltanto l'idoneità corrente.

## Usare la dashboard

La **Dashboard** è il punto di controllo quotidiano dell'app. Mostra i dipendenti e lo stato dei loro requisiti formativi e sanitari.

Usa i filtri per restringere l'analisi, ad esempio per:

- una sede specifica;
- un reparto;
- un ruolo di sicurezza;
- un inquadramento;
- i soli dipendenti con requisiti mancanti, in scadenza o scaduti.

Puoi esportare la visualizzazione filtrata in Excel o CSV e scegliere le colonne da includere. Questo è utile per condividere rapidamente una situazione con HR, responsabili di reparto o consulenti esterni.

## Pianificare corsi e visite

La sezione **Pianifica** aiuta a trasformare le scadenze in attività concrete.

Scegli un corso o un piano sanitario: l'app raccoglie automaticamente i dipendenti per i quali l'attività è necessaria, includendo i casi mancanti, scaduti, critici e in scadenza. I risultati sono ordinati per priorità, così puoi partire dalle situazioni più urgenti.

Questa funzione è utile, ad esempio, per organizzare un'aula di aggiornamento Antincendio, un corso HACCP o una sessione di visite mediche per una sede.

### Preparare elenco aula e attestati

Prima dell'export, scegli i campi visibili necessari per il tuo obiettivo. Per un elenco aula o un modello di attestato potresti selezionare:

- Nome e Cognome;
- Codice Fiscale;
- Data di nascita;
- Luogo di nascita;
- Email e telefono;
- Reparto, sede e posizione lavorativa;
- Ruoli assegnati;
- Corso o piano sanitario interessato.

Dopo aver applicato gli eventuali filtri, esporta in Excel o CSV. Il file sarà già limitato ai dipendenti selezionati e conterrà soltanto le colonne richieste, riducendo la necessità di ricopiare dati per registri d'aula, convocazioni o attestati.

Prima di condividere un export, verifica sempre che includa solo i dati personali strettamente necessari al destinatario.

## Report e fabbisogno

La sezione **Report** aggrega i dati per corso e per piano sanitario. Per ogni elemento mostra il numero di dipendenti interessati, le situazioni mancanti, in scadenza e scadute, oltre alla percentuale di conformità.

La soglia temporale del report può essere impostata liberamente. Per esempio:

- 90 giorni per pianificare le attività urgenti del trimestre;
- 180 giorni per programmare corsi e visite del semestre;
- 365 giorni per stimare il fabbisogno annuale, le aule necessarie e il budget.

Usa filtri ed export per inviare i dati a chi pianifica formazione, budget o convocazioni.

## Impostazioni e notifiche

Nella sezione **Impostazioni** puoi configurare:

- soglia di giorni per lo stato “In scadenza”;
- soglia per lo stato critico;
- finestra predefinita dei report;
- server SMTP, porta, username, mittente e nome mittente;
- destinatario dell'email aggregata;
- orario del controllo automatico giornaliero.

Le impostazioni non sensibili restano salvate nel database e vengono mantenute dopo il riavvio dell'app.

### Configurare l'email

Per ricevere le notifiche automatiche, compila almeno:

- SMTP Host;
- SMTP Port;
- SMTP Username;
- SMTP Password;
- Email destinatario report.

Per Gmail, Outlook, iCloud e servizi equivalenti, usa una password per le app o una credenziale SMTP dedicata. Non usare la password principale del tuo account.

La password SMTP viene cifrata prima di essere salvata nel database e non viene mai mostrata o restituita dall'app. Se una password è già configurata, il campo resta vuoto e l'app ne indica lo stato. Lascia il campo vuoto per mantenere la password esistente; usa l'opzione di rimozione se vuoi cancellarla.

### Come funzionano gli alert

All'orario configurato, il controllo automatico confronta lo stato attuale di ogni requisito con il risultato del controllo precedente. L'app rileva, ad esempio:

- un corso obbligatorio ancora non registrato;
- un corso passato da in regola a in scadenza;
- un corso passato in stato critico o scaduto;
- un'idoneità medica mancante, in scadenza o scaduta.

Se trova variazioni, invia una sola email aggregata al destinatario configurato. L'email raggruppa i cambiamenti per stato e non viene inviata se non è cambiato nulla: in questo modo evita notifiche duplicate ogni giorno.

Il pulsante **Verifica cambiamenti ora** esegue lo stesso controllo immediatamente. È utile dopo aver configurato SMTP o dopo aver inserito dati di test. Se non riesce a inviare l'email, la pagina mostra una spiegazione senza esporre credenziali.

## Buone pratiche

- Mantieni aggiornati ruoli, inquadramenti e associazioni prima di inserire molti dipendenti.
- Inserisci le date dei corsi e delle visite appena l'attività è conclusa.
- Controlla la dashboard con regolarità, anche se le notifiche sono attive.
- Usa Pianifica per creare liste operative e Report per pianificare il fabbisogno futuro.
- Limita gli export ai dati necessari e conserva i file in aree aziendali protette.
- Usa credenziali SMTP dedicate e revocabili.
- Non condividere mai il file `backend/.env`, la chiave `SETTINGS_ENCRYPTION_KEY` o il database di produzione.
