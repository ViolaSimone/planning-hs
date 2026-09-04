"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface Classification {
  id: number;
  name: string;
}

interface SurveillancePlan {
  id: number;
  name: string;
  description: string | null;
  renewal_value: number;
  renewal_unit: "years" | "months";
  is_active: boolean;
  classification_ids: number[];
}


interface SurveillancePlanFormState {
  name: string;
  description: string;
  renewal_value: string;
  renewal_unit: "years" | "months";
  classification_ids: number[];
  is_active: boolean;
}

const emptyForm: SurveillancePlanFormState = {
  name: "",
  description: "",
  renewal_value: "1",
  renewal_unit: "years",
  classification_ids: [],
  is_active: true,
};

function renewalLabel(value: number, unit: "years" | "months"): string {
  if (unit === "years") return value === 1 ? "1 anno" : `${value} anni`;
  return value === 1 ? "1 mese" : `${value} mesi`;
}

export default function SurveillancePage() {
  const [plans, setPlans] = useState<SurveillancePlan[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SurveillancePlanFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [plansRes, classificationsRes] = await Promise.all([
      fetch(`${API_BASE}/api/surveillance-plans`),
      fetch(`${API_BASE}/api/classifications`),
    ]);
    setPlans(await plansRes.json());
    setClassifications(await classificationsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);


  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShow(true);
  };

  const openEditForm = (plan: SurveillancePlan) => {
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      renewal_value: String(plan.renewal_value),
      renewal_unit: plan.renewal_unit,
      classification_ids: plan.classification_ids,
      is_active: plan.is_active,
    });
    setEditingId(plan.id);
    setShow(true);
  };

  const closeForm = () => {
    setShow(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      alert("Il nome del piano è obbligatorio.");
      return;
    }

    const parsedRenewalValue = parseInt(form.renewal_value, 10);
    if (Number.isNaN(parsedRenewalValue) || parsedRenewalValue < 1 || parsedRenewalValue > 120) {
      alert("Il valore di rinnovo deve essere un numero intero tra 1 e 120.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `${API_BASE}/api/surveillance-plans/${editingId}`
        : `${API_BASE}/api/surveillance-plans`;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: form.description.trim() || null,
          renewal_value: parsedRenewalValue,
          renewal_unit: form.renewal_unit,
          classification_ids: form.classification_ids,
          is_active: form.is_active,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(`Errore salvataggio piano sanitario: ${err?.detail ?? res.statusText}`);
        return;
      }

      closeForm();
      await load();
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (plan: SurveillancePlan) => {
    if (!confirm(`Eliminare il piano "${plan.name}"? I dipendenti collegati perderanno il riferimento a questo piano.`)) return;
    const res = await fetch(`${API_BASE}/api/surveillance-plans/${plan.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore durante l'eliminazione del piano.");
      return;
    }
    await load();
  };

  if (loading) return <div className="text-sm text-slate-500">Caricamento…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sorveglianza sanitaria</h2>
          <p className="text-xs text-slate-500">Gestisci periodicità e inquadramenti associati</p>
        </div>
        {/* New button */}
        <button
          onClick={openNewForm}
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm"
        >
          + Nuovo piano
        </button>
      </div>

      {show && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold mb-5">
            {editingId ? "Modifica piano sanitario" : "Nuovo piano sanitario"}
          </h3>

          <form onSubmit={save} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">
                  Nome piano <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">
                  Rinnovo <span className="text-red-500">*</span>
                </span>
                <div className="flex gap-2">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={form.renewal_value}
                    onChange={(e) => setForm({ ...form, renewal_value: e.target.value })}
                  />
                  <select
                    className="input"
                    value={form.renewal_unit}
                    onChange={(e) => setForm({ ...form, renewal_unit: e.target.value as "years" | "months" })}
                  >
                    <option value="years">Anni</option>
                    <option value="months">Mesi</option>
                  </select>
                </div>
              </label>

              <label className="text-sm md:col-span-2">
                <span className="block text-slate-700 font-medium mb-1">Descrizione</span>
                <input
                  className="input"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Inquadramenti associati</p>
              <div className="flex flex-wrap gap-2">
                {classifications.map((classification) => (
                  <label
                    key={classification.id}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.classification_ids.includes(classification.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          classification_ids: e.target.checked
                            ? [...form.classification_ids, classification.id]
                            : form.classification_ids.filter((id) => id !== classification.id),
                        })
                      }
                    />
                    {classification.name}
                  </label>
                ))}
                {classifications.length === 0 && (
                  <p className="text-xs text-slate-400">Nessun inquadramento creato. Vai alla pagina Dipendenti per crearne uno.</p>
                )}
              </div>
            </div>

            <p className="text-xs text-red-500">* Campo obbligatorio</p>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm disabled:opacity-50"
              >
                {saving ? "Salvataggio…" : editingId ? "Salva modifiche" : "Crea piano"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nome</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Rinnovo</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Inquadramenti</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-800">{plan.name}</p>
                  {plan.description && <p className="text-xs text-slate-400">{plan.description}</p>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{renewalLabel(plan.renewal_value, plan.renewal_unit)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {plan.classification_ids.length === 0 && <span className="text-slate-400">—</span>}
                    {plan.classification_ids.map((id) => {
                      const classification = classifications.find((c) => c.id === id);
                      if (!classification) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                        >
                          {classification.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button onClick={() => openEditForm(plan)} className="text-blue-600 hover:underline mr-3">
                    Modifica
                  </button>
                  <button onClick={() => deletePlan(plan)} className="text-red-600 hover:underline">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">
                  Nessun piano sanitario presente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
