# User guide — Planning H&S

Planning H&S helps manage mandatory workplace safety training and occupational health surveillance. This guide is intended for HR teams, safety managers, training coordinators, administrators, and anyone responsible for keeping employee requirements up to date.

> This is an operational guide. For installation, Docker, technical configuration, and development, see the [main README](../README.en.md) and the [Docker guide](DOCKER.md).

## Initial setup

The first startup includes sample roles, courses, job classifications, and medical plans. Before adding employees, review the initial configuration and adapt it to the organization.

Recommended order:

1. Review or create job classifications.
2. Review or create safety roles.
3. Review or create courses and link them to the roles that require them.
4. Review or create occupational health plans and link them to the relevant classifications.
5. Add employees and assign roles and classification.
6. Register existing course and medical-visit dates.
7. Configure thresholds and email notifications in Settings.

## Main concepts

### Safety roles

Safety roles describe responsibilities or activities requiring specific training, such as RSPP, RLS, Supervisor, Fire Safety Officer, First Aid Officer, or Food Operator.

An employee can have several roles at the same time. Each role can require one or more mandatory courses. When a role is assigned, the dashboard automatically calculates the employee's required training.

### Classifications and medical plans

A job classification identifies the employee's work profile, such as Office Employee or Production Worker. Each employee has one active classification.

An occupational health plan defines the renewal period for medical fitness and can be linked to one or more classifications. For example:

- A “Display-screen workers” plan can be linked to office employees and renewed every 24 months.
- A “Manual handling” plan can be linked to production workers and renewed every 12 months.

When a medical visit is registered, the application uses the plan linked to the current classification to calculate the next expiry date.

### Statuses and colors

Each mandatory course and medical record can have one of these statuses:

| Status | Meaning | Recommended action |
|---|---|---|
| Compliant | Training or medical fitness is valid and not close to expiry | No immediate action |
| Expiring soon | The expiry date is within the configured threshold | Plan renewal, training, or visit |
| Critical / Expired | The expiry date has been reached or passed | Take action as a priority |
| Missing | A mandatory requirement has no registered date | Verify the situation and plan the activity |

The “Expiring soon” threshold can be configured in Settings. The initial value is 70 days.

## Managing employees

Open **Employees** to create, search, edit, or remove employee records.

To create an employee:

1. Select the action to add a new employee.
2. Enter at least first name and last name.
3. Add email, phone, department, location, job position, and personal data when available.
4. Select one or more safety roles.
5. Select the applicable classification.
6. Save.

After saving, the application calculates mandatory courses from the assigned roles and checks whether the classification requires occupational health surveillance.

When an employee's classification changes, the backend keeps a classification history. Always verify that the new classification matches the actual job duties and applicable medical plan.

## Managing courses and training

Use **Courses** to manage the training catalogue.

For each course you can define:

- name and identifying code;
- description;
- renewal period in years;
- active/inactive status;
- roles for which the course is mandatory.

Set the renewal value to `0` for courses that do not expire. A typical example is General Safety Training: after the completion date is registered, no automatic expiry date is calculated.

To register completed training, open the employee's training area, select the course, and enter the completion date. The application calculates the renewal date using the course's configured renewal period.

If the renewal period is changed, check the resulting expiry dates: existing training records are recalculated using the new rule.

## Managing occupational health surveillance

Use **Surveillance** to configure medical plans and register medical fitness records.

To create a plan:

1. Enter the name and description.
2. Set the renewal value.
3. Select months or years as the unit.
4. Link one or more classifications.
5. Save the plan.

To register or update an employee's medical visit, enter the date of the latest visit. The application applies the relevant plan and calculates the next expiry date. Previous visits are kept in the backend history, while the dashboard shows the current record.

## Using the dashboard

The **Dashboard** is the daily control point. It shows employees and the status of their training and medical requirements.

Use filters for:

- location;
- department;
- safety role;
- job classification;
- employees with missing, expiring, or expired requirements.

You can export the filtered view to Excel or CSV and select the columns to include. This is useful for sharing a focused situation with HR, department managers, or external consultants.

## Planning courses and visits

The **Planning** section turns expiry data into concrete actions.

Select a course or medical plan: the application automatically collects employees who need the activity, including missing, expired, critical, and expiring cases. Results are ordered by priority so the most urgent situations appear first.

This is useful for organizing a Fire Safety refresher course, HACCP training, or a medical-visit session for a specific location.

### Preparing classroom lists and certificates

Before exporting, choose the visible fields required for the task. For a classroom list or certificate template, you might select:

- first name and last name;
- tax code;
- date of birth;
- place of birth;
- email and phone;
- department, location, and job position;
- assigned roles;
- the selected course or medical plan.

After applying filters, export to Excel or CSV. The file is limited to the selected employees and contains only the requested columns, reducing manual copying for attendance registers, invitations, and certificate templates.

Before sharing an export, always verify that it contains only the personal data necessary for its recipient.

## Reports and planning demand

The **Reports** section aggregates data by course and medical plan. It shows the number of affected employees, missing, expiring, and expired requirements, and the compliance percentage.

The report time window can be changed freely. For example:

- 90 days for urgent quarterly activities;
- 180 days for semester planning;
- 365 days for annual training demand, classroom capacity, and budget estimates.

Use filters and exports to provide data to the people responsible for training, budget, and scheduling.

## Settings and notifications

In **Settings**, you can configure:

- the threshold for “Expiring soon”;
- the critical threshold;
- the default report window;
- SMTP host, port, username, sender, and sender name;
- the aggregated report recipient;
- the automatic daily-check time.

Non-sensitive settings remain in the database after restarting the application.

### Configuring email

To receive automated notifications, configure at least:

- SMTP host;
- SMTP port;
- SMTP username;
- SMTP password;
- report recipient email.

For Gmail, Outlook, iCloud, and similar services, use an app password or dedicated SMTP credential. Do not use the main account password.

The SMTP password is encrypted before being stored in the database and is never displayed or returned by the application. If a password is already configured, the field remains empty and the application shows only its status. Leave the field blank to keep the current password; use the removal option to delete it.

### How alerts work

At the configured time, the automated check compares the current state of each requirement with the previous check. It can detect, for example:

- a mandatory course that is still missing;
- a course changing from compliant to expiring soon;
- a course becoming critical or expired;
- a medical record becoming missing, expiring, or expired.

When changes are found, one aggregated email is sent to the configured recipient. The email groups changes by status and is not sent when nothing changed, avoiding duplicate daily notifications.

The **Check changes now** button runs the same check immediately. Use it after configuring SMTP or entering test data. If delivery fails, the page displays an explanation without exposing credentials.

## Good practices

- Keep roles, classifications, and relationships up to date before entering many employees.
- Register course and visit dates as soon as activities are completed.
- Check the dashboard regularly even when email notifications are enabled.
- Use Planning to create operational lists and Reports to plan future demand.
- Limit exports to the required data and keep files in protected company locations.
- Use dedicated, revocable SMTP credentials.
- Never share `backend/.env`, `SETTINGS_ENCRYPTION_KEY`, or the production database.
