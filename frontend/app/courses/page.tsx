"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface SafetyRole {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  renewal_years: number;
  is_active: boolean;
  display_order: number;
  required_role_ids: number[];
}

interface CourseFormState {
  name: string;
  code: string;
  description: string;
  renewal_years: string;
  is_active: boolean;
  required_role_ids: number[];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<SafetyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const emptyForm: CourseFormState = {
    name: "",
    code: "",
    description: "",
    renewal_years: "5",
    is_active: true,
    required_role_ids: [],
  };

  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [newForm, setNewForm] = useState<CourseFormState>(emptyForm);

  const fetchAll = async () => {
    const [coursesRes, rolesRes] = await Promise.all([
      fetch(`${API_BASE}/api/courses`),
      fetch(`${API_BASE}/api/safety-roles`),
    ]);
    setCourses(await coursesRes.json());
    setRoles(await rolesRes.json());
  };

  useEffect(() => {
    fetchAll().then(() => setLoading(false));
  }, []);

  const handleEdit = (c: Course) => {
    setEditingId(c.id);
    setShowNewForm(false);
    setForm({
      name: c.name,
      code: c.code,
      description: c.description ?? "",
      renewal_years: String(c.renewal_years),
      is_active: c.is_active,
      required_role_ids: c.required_role_ids,
    });
  };

  const toggleRole = (roleId: number, target: "form" | "newForm") => {
    if (target === "form") {
      setForm((prev) => ({
        ...prev,
        required_role_ids: prev.required_role_ids.includes(roleId)
          ? prev.required_role_ids.filter((id) => id !== roleId)
          : [...prev.required_role_ids, roleId],
      }));
    } else {
      setNewForm((prev) => ({
        ...prev,
        required_role_ids: prev.required_role_ids.includes(roleId)
          ? prev.required_role_ids.filter((id) => id !== roleId)
          : [...prev.required_role_ids, roleId],
      }));
    }
  };

  const handleSave = async () => {
    if (!editingId) return;

    const parsedRenewalYears = parseInt(form.renewal_years, 10);
    if (Number.isNaN(parsedRenewalYears) || parsedRenewalYears < 0 || parsedRenewalYears > 10) {
      alert("Gli anni di validità devono essere un numero intero tra 0 e 10.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/courses/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        renewal_years: parsedRenewalYears,
        is_active: form.is_active,
        required_role_ids: form.required_role_ids,
      }),
    });
    if (!res.ok) {
      alert("Errore aggiornamento corso");
      return;
    }
    await fetchAll();
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedRenewalYears = parseInt(newForm.renewal_years, 10);
    if (Number.isNaN(parsedRenewalYears) || parsedRenewalYears < 0 || parsedRenewalYears > 10) {
      alert("Gli anni di validità devono essere un numero intero tra 0 e 10.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newForm.name,
        code: newForm.code.toUpperCase().replace(/\s+/g, "_"),
        description: newForm.description || null,
        renewal_years: parsedRenewalYears,
        is_active: true,
        required_role_ids: newForm.required_role_ids,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(`Errore creazione corso: ${err?.detail ?? res.statusText}`);
      return;
    }
    await fetchAll();
    setNewForm(emptyForm);
    setShowNewForm(false);
  };

  const moveCourse = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= courses.length) return;
    const reordered = [...courses];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setCourses(reordered);

    setSavingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/api/courses/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_ids: reordered.map((c) => c.id) }),
      });
      if (!res.ok) {
        alert("Errore nel salvataggio dell'ordine");
        await fetchAll();
      }
    } catch {
      alert("Errore di rete durante il riordino");
      await fetchAll();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = confirm(
      `⚠️ Stai per eliminare il corso "${name}".\n\nAttenzione: questa operazione cancellera' anche TUTTI i dati di formazione dei dipendenti relativi a questo corso (date di effettuazione, scadenze, note). L'operazione non e' reversibile.\n\nSei sicuro di voler procedere?`
    );
    if (!confirmed) return;
    const res = await fetch(`${API_BASE}/api/courses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore eliminazione corso");
      return;
    }
    await fetchAll();
  };

  if (loading) return <div className="text-sm text-slate-500">Caricamento corsi…</div>;

  const RoleCheckboxes = ({ selected, target }: { selected: number[]; target: "form" | "newForm" }) => (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <label
          key={r.id}
          className="flex items-center gap-1.5 text-xs border border-slate-200 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-50"
        >
          <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleRole(r.id, target)} />
          {r.name}
        </label>
      ))}
      {roles.length === 0 && <p className="text-xs text-slate-400">Nessun ruolo configurato.</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configurazione corsi</h2>
          <p className="text-xs text-slate-500">
            Gestisci i corsi, le tempistiche di rinnovo, i ruoli che li richiedono e l'ordine delle colonne in
            dashboard
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewForm(true);
            setEditingId(null);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nuovo corso
        </button>
      </div>

      {showNewForm && (
        <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold mb-4">Nuovo corso</h3>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-700">Nome corso *</span>
              <input
                className="input mt-1"
                placeholder="es. Formazione Carrelli Elevatori"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">Codice univoco *</span>
              <input
                className="input mt-1"
                placeholder="es. CARRELLI"
                value={newForm.code}
                onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              {/* FIX: rimosso il simbolo "±", sostituito con "o" per chiarezza */}
              <span className="text-slate-700">Anni di validità o rinnovo *</span>
              <input
                type="number"
                min={0}
                max={10}
                className="input mt-1"
                value={newForm.renewal_years}
                onChange={(e) => setNewForm({ ...newForm, renewal_years: e.target.value })}
                required
              />
              <span className="text-[11px] text-slate-400">
                0 = il corso non prevede rinnovo (es. Sicurezza Generale)
              </span>
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="text-slate-700">Descrizione (opzionale)</span>
              <input
                className="input mt-1"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              />
            </label>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-700 mb-2">Ruoli per cui questo corso è obbligatorio</p>
              <RoleCheckboxes selected={newForm.required_role_ids} target="newForm" />
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Crea corso
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNewForm(emptyForm);
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-400 mb-2">
          Usa le frecce ↑ ↓ per decidere l'ordine delle colonne dei corsi nella dashboard
          {savingOrder && <span className="ml-2 text-slate-500">(salvataggio ordine…)</span>}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Ordine</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nome</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Codice</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Rinnovo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Ruoli associati</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, index) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCourse(index, -1)}
                        disabled={index === 0 || savingOrder}
                        className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-30"
                        title="Sposta su"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCourse(index, 1)}
                        disabled={index === courses.length - 1 || savingOrder}
                        className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-30"
                        title="Sposta giù"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                  <td className="px-3 py-2">
                    {c.renewal_years === 0 ? (
                      <span className="text-slate-500">Nessun rinnovo</span>
                    ) : (
                      `${c.renewal_years} anni`
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.required_role_ids.length > 0 ? (
                      roles
                        .filter((r) => c.required_role_ids.includes(r.id))
                        .map((r) => r.name)
                        .join(", ")
                    ) : (
                      <span className="text-slate-400">Nessuno (obbligatorio per tutti se generale/specifica)</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(c)} className="text-blue-600 hover:underline text-xs">
                        Modifica
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="text-red-600 hover:underline text-xs">
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold mb-4">Modifica corso</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-700">Nome</span>
              <input
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">Anni rinnovo</span>
              <input
                type="number"
                min={0}
                max={10}
                className="input mt-1"
                value={form.renewal_years}
                onChange={(e) => setForm({ ...form, renewal_years: e.target.value })}
              />
              <span className="text-[11px] text-slate-400">
                0 = nessun rinnovo. Cambiando questo valore le scadenze esistenti verranno ricalcolate.
              </span>
            </label>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-700 mb-2">Ruoli per cui questo corso è obbligatorio</p>
              <RoleCheckboxes selected={form.required_role_ids} target="form" />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleSave}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Salva
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
