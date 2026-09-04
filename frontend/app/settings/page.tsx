"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface AppSettings {
  alert_expiring_soon_days: number;
  alert_critical_days: number;
  report_days_threshold: number;
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string;
  report_recipient_email: string | null;
  daily_check_hour: number;
  daily_check_minute: number;
  smtp_password_configured: boolean;
}

interface CheckResult {
  changes_detected: number;
  email_sent: boolean;
  email_error?: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [clearStoredPassword, setClearStoredPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Unable to load settings");
        }

        const json = await res.json();
        setSettings(json);
      } catch {
        alert("Errore caricamento impostazioni");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    try {
      const payload = {
        ...settings,
        ...(smtpPassword
          ? { smtp_password: smtpPassword }
          : {}),
        ...(clearStoredPassword
          ? { smtp_password: "" }
          : {}),
      };

      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Unable to save settings");
      }

      const savedSettings = await res.json();
      setSettings(savedSettings);
      setSmtpPassword("");
      setClearStoredPassword(false);
      alert("Impostazioni salvate con successo");
    } catch {
      alert("Errore salvataggio impostazioni");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/notifications/run-daily-check`,
        { method: "POST" },
      );

      if (!res.ok) {
        throw new Error("Unable to run alert check");
      }

      const json = await res.json();

      setCheckResult({
        changes_detected: json.changes_detected ?? 0,
        email_sent: json.email_sent ?? false,
        email_error: json.email_error ?? null,
      });
    } catch {
      alert("Errore durante il controllo");
    } finally {
      setChecking(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="text-sm text-slate-500">
        Caricamento impostazioni…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Soglie di allerta</h3>
        <p className="mb-4 text-xs text-slate-500">
          Determina entro quanti giorni un corso o una visita medica in
          scadenza viene segnalato come "In scadenza". La stessa soglia è
          usata anche per decidere quando inviare un alert via email.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            label="Giorni per 'In scadenza'"
            value={settings.alert_expiring_soon_days}
            onChange={(v) =>
              setSettings({
                ...settings,
                alert_expiring_soon_days: v,
              })
            }
            min={0}
          />
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Notifiche email</h3>
        <p className="mb-4 text-xs text-slate-500">
          Ti notificheremo le nuove scadenze con un breve riepilogo via mail.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="SMTP Host"
            value={settings.smtp_host ?? ""}
            onChange={(v) => setSettings({ ...settings, smtp_host: v })}
            placeholder="smtp.gmail.com"
          />
          <NumberField
            label="SMTP Porta"
            value={settings.smtp_port}
            onChange={(v) => setSettings({ ...settings, smtp_port: v })}
            min={1}
          />
          <TextField
            label="SMTP Username"
            value={settings.smtp_user ?? ""}
            onChange={(v) => setSettings({ ...settings, smtp_user: v })}
            placeholder="tu@esempio.com"
            autoComplete="off"
          />
          <TextField
            label="SMTP Password"
            value={smtpPassword}
            onChange={setSmtpPassword}
            placeholder={
              settings.smtp_password_configured
                ? "Stored securely — leave blank to keep it"
                : "Password or dedicated app password"
            }
            type="password"
            autoComplete="new-password"
          />
          {settings.smtp_password_configured && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={clearStoredPassword}
                onChange={(event) =>
                  setClearStoredPassword(event.target.checked)
                }
              />
              Remove the stored SMTP password
            </label>
          )}
          <TextField
            label="Email mittente"
            value={settings.smtp_from_email ?? ""}
            onChange={(v) =>
              setSettings({ ...settings, smtp_from_email: v })
            }
            placeholder="noreply@esempio.com"
            autoComplete="off"
          />
          <TextField
            label="Nome mittente"
            value={settings.smtp_from_name}
            onChange={(v) =>
              setSettings({ ...settings, smtp_from_name: v })
            }
            placeholder="Planning H&S"
            autoComplete="off"
          />
          <TextField
            label="Email destinatario report"
            value={settings.report_recipient_email ?? ""}
            onChange={(v) =>
              setSettings({
                ...settings,
                report_recipient_email: v,
              })
            }
            placeholder="hr@esempio.com"
            autoComplete="off"
          />
        </div>
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] text-amber-800">
            <strong>Consiglio di sicurezza:</strong> non usare la password principale dell&apos;account. Usa una password per le app o una credenziale SMTP dedicata e revocabile.
          </p>
          <p className="mt-1 text-[11px] text-amber-800">
            La password viene salvata cifrata dal backend e non viene mai
            restituita al frontend. Lascia il campo vuoto per mantenere la
            password esistente.
          </p>
          <p className="mt-1 text-[11px] text-amber-800">
            Stato password: {settings.smtp_password_configured
              ? "memorizzata in modo sicuro"
              : "non configurata"}.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Controllo automatico</h3>
        <p className="mb-4 text-xs text-slate-500">
          L&apos;app controlla automaticamente ogni giorno se qualcosa è
          cambiato e invia un&apos;unica email di riepilogo solo se c&apos;è un
          cambiamento.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Ora controllo (0-23)"
            value={settings.daily_check_hour}
            onChange={(v) =>
              setSettings({ ...settings, daily_check_hour: v })
            }
            min={0}
            max={23}
          />
          <NumberField
            label="Minuto controllo (0-59)"
            value={settings.daily_check_minute}
            onChange={(v) =>
              setSettings({ ...settings, daily_check_minute: v })
            }
            min={0}
            max={59}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {checking ? "Verifica in corso…" : "Verifica cambiamenti ora"}
          </button>
          {checkResult && (
            <div className="text-xs text-slate-500">
              <p>
                Cambiamenti rilevati: {" "}
                <span className="font-medium text-slate-700">
                  {checkResult.changes_detected}
                </span>{" "}
                · Email inviata:{" "}
                <span
                  className={`font-medium ${checkResult.email_sent
                    ? "text-emerald-600"
                    : "text-slate-400"}`}
                >
                  {checkResult.email_sent ? "Sì" : "No"}
                </span>
              </p>
              {checkResult.email_error && (
                <p className="mt-1 text-amber-700">
                  {checkResult.email_error}
                </p>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          "Verifica cambiamenti ora" esegue un controllo immediato,
          indipendentemente dal controllo automatico giornaliero.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Salvataggio…" : "Salva impostazioni"}
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type="number"
        className="input mt-1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        className="input mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </label>
  );
}
