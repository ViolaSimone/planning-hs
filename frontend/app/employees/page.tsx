"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { formatDateTyping, displayToIso, isoToDisplay } from "@/lib/dates";
import { DateField } from "@/components/ui/DateField";


interface Role {
  id: number;
  name: string;
}

interface Classification {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  work_location: string | null;
  department: string | null;
  job_position: string | null;
  tax_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  classification_id: number | null;
  classification_name: string | null;
  safety_role_ids: number[];
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  hire_date: "",
  work_location: "",
  department: "",
  job_position: "",
  tax_code: "",
  birth_date: "",
  birth_place: "",
  classification_id: null as number | null,
  safety_role_ids: [] as number[],
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newClassificationName, setNewClassificationName] = useState("");
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const load = async () => {
    const [employeesRes, rolesRes, classificationsRes] = await Promise.all([
      fetch(`${API_BASE}/api/employees?limit=1000`),
      fetch(`${API_BASE}/api/safety-roles`),
      fetch(`${API_BASE}/api/classifications`),
    ]);
    setEmployees(await employeesRes.json());
    setRoles(await rolesRes.json());
    setClassifications(await classificationsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNewForm = () => {
// "Worker" preselected: every employee must complete General
// and Specific Safety Training. The user can still deselect it.
      const lavoratoreRole = roles.find((r) => r.name === "Lavoratore");
      setForm({
        ...emptyForm,
        safety_role_ids: lavoratoreRole ? [lavoratoreRole.id] : [],
      });
      setEditingId(null);
      setShow(true);
    };

  const openEditForm = (employee: Employee) => {
    setForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      hire_date: employee.hire_date ?? "",
      work_location: employee.work_location ?? "",
      department: employee.department ?? "",
      job_position: employee.job_position ?? "",
      tax_code: employee.tax_code ?? "",
      birth_date: employee.birth_date ?? "",
      birth_place: employee.birth_place ?? "",
      classification_id: employee.classification_id,
      safety_role_ids: employee.safety_role_ids,
    });
    setEditingId(employee.id);
    setShow(true);
  };

  const closeForm = () => {
    setShow(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewRoleName("");
    setNewClassificationName("");
  };

 // --- Roles: creation and deletion using the same logic as job classifications ---
  const createRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    const res = await fetch(`${API_BASE}/api/safety-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, is_active: true }),
    });
    const created: Role = await res.json();
    setRoles((current) => [...current.filter((r) => r.id !== created.id), created]);
    setForm((current) => ({ ...current, safety_role_ids: [...current.safety_role_ids, created.id] }));
    setNewRoleName("");
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`Eliminare il ruolo "${role.name}"? I dati di formazione già registrati per i dipendenti restano invariati.`)) return;
    const res = await fetch(`${API_BASE}/api/safety-roles/${role.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore durante l'eliminazione del ruolo.");
      return;
    }
    setRoles((current) => current.filter((r) => r.id !== role.id));
    setForm((current) => ({ ...current, safety_role_ids: current.safety_role_ids.filter((id) => id !== role.id) }));
    await load();
  };

// --- Job classifications: same checkbox-based UI as roles, with creation and deletion ---

const createClassification = async () => {
    const name = newClassificationName.trim();
    if (!name) return;
    const res = await fetch(`${API_BASE}/api/classifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, is_active: true }),
    });
    const created: Classification = await res.json();
    setClassifications((current) => [...current.filter((c) => c.id !== created.id), created]);
    setForm((current) => ({ ...current, classification_id: created.id }));
    setNewClassificationName("");
  };

  const deleteClassification = async (classification: Classification) => {
    if (!confirm(`Eliminare l'inquadramento "${classification.name}"? I dipendenti collegati verranno scollegati.`)) return;
    const res = await fetch(`${API_BASE}/api/classifications/${classification.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore durante l'eliminazione dell'inquadramento.");
      return;
    }
    setClassifications((current) => current.filter((c) => c.id !== classification.id));
    setForm((current) => (current.classification_id === classification.id ? { ...current, classification_id: null } : current));
    await load();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.safety_role_ids.length === 0) {
      alert("Seleziona almeno un ruolo.");
      return;
    }
    const url = editingId ? `${API_BASE}/api/employees/${editingId}` : `${API_BASE}/api/employees`;
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        hire_date: form.hire_date || null,
        work_location: form.work_location || null,
        department: form.department || null,
        job_position: form.job_position || null,
        tax_code: form.tax_code || null,
        birth_date: form.birth_date || null,
        birth_place: form.birth_place || null,
        classification_id: form.classification_id || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(`Errore salvataggio dipendente: ${err?.detail ?? res.statusText}`);
      return;
    }
    closeForm();
    await load();
  };

// --- Employee deletion: function restored ---

  const deleteEmployee = async (employee: Employee) => {
    if (!confirm(`Eliminare il dipendente "${employee.first_name} ${employee.last_name}"? L'operazione non è reversibile.`)) return;
    const res = await fetch(`${API_BASE}/api/employees/${employee.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore durante l'eliminazione del dipendente.");
      return;
    }
    await load();
  };

  if (loading) return <div className="text-sm text-slate-500">Caricamento…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Anagrafica dipendenti</h2>
          <p className="text-xs text-slate-500">Gestisci dati, inquadramento e ruoli</p>
        </div>
        {/* "New employee" button: now with a border and fill, matching the style of the form's "Create employee" button */}
        <button
          onClick={openNewForm}
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm"
        >
          + Nuovo dipendente
        </button>
      </div>

      {show && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold mb-5">{editingId ? "Modifica dipendente" : "Nuovo dipendente"}</h3>

          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">
                  Nome <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">
                  Cognome <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Email</span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Telefono</span>
                <input
                  className="input"
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>

              {/* Hire date: now typeable and displayed as dd/mm/yyyy */}
              <DateField
                label="Data assunzione"
                isoValue={form.hire_date}
                onIsoChange={(iso) => setForm({ ...form, hire_date: iso })}
              />

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Sede</span>
                <input
                  className="input"
                  type="text"
                  value={form.work_location}
                  onChange={(e) => setForm({ ...form, work_location: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Reparto</span>
                <input
                  className="input"
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Posizione lavorativa</span>
                <input
                  className="input"
                  type="text"
                  value={form.job_position}
                  onChange={(e) => setForm({ ...form, job_position: e.target.value })}
                />
              </label>

              {/* New personal details fields: Tax Code, Date of Birth, Place of Birth */}
              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Codice Fiscale</span>
                <input
                  className="input"
                  type="text"
                  maxLength={16}
                  style={{ textTransform: "uppercase" }}
                  value={form.tax_code}
                  onChange={(e) => setForm({ ...form, tax_code: e.target.value.toUpperCase() })}
                />
              </label>

              <DateField
                label="Data di nascita"
                isoValue={form.birth_date}
                onIsoChange={(iso) => setForm({ ...form, birth_date: iso })}
              />

              <label className="text-sm">
                <span className="block text-slate-700 font-medium mb-1">Luogo di nascita</span>
                <input
                  className="input"
                  type="text"
                  value={form.birth_place}
                  onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                />
              </label>
            </div>

            {/* Job classification: same checkbox-based UI as roles */}
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Inquadramento (selezione singola)</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {classifications.map((classification) => (
                  <div
                    key={classification.id}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.classification_id === classification.id}
                        onChange={() =>
                          setForm({
                            ...form,
                            classification_id: form.classification_id === classification.id ? null : classification.id,
                          })
                        }
                      />
                      {classification.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteClassification(classification)}
                      className="text-red-500 hover:text-red-700 text-xs ml-1"
                      title="Elimina inquadramento"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {classifications.length === 0 && <p className="text-xs text-slate-400">Nessun inquadramento creato.</p>}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 max-w-xs"
                  placeholder="Nuovo inquadramento..."
                  value={newClassificationName}
                  onChange={(e) => setNewClassificationName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createClassification();
                    }
                  }}
                />
                <button type="button" onClick={createClassification} className="btn-light whitespace-nowrap">
                  + Crea
                </button>
              </div>
            </div>

            {/* Roles: checkboxes + deletion */}
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Ruoli (selezione multipla) <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-sm">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.safety_role_ids.includes(role.id)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            safety_role_ids: e.target.checked
                              ? [...form.safety_role_ids, role.id]
                              : form.safety_role_ids.filter((id) => id !== role.id),
                          })
                        }
                      />
                      {role.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteRole(role)}
                      className="text-red-500 hover:text-red-700 text-xs ml-1"
                      title="Elimina ruolo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {roles.length === 0 && <p className="text-xs text-slate-400">Nessun ruolo creato.</p>}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 max-w-xs"
                  placeholder="Nuovo ruolo..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createRole();
                    }
                  }}
                />
                <button type="button" onClick={createRole} className="btn-light whitespace-nowrap">
                  + Crea ruolo
                </button>
              </div>
            </div>

            {/* Required fields note, aligned with the confirm/cancel buttons */}
            <p className="text-xs text-red-500">* Campo obbligatorio</p>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm">
                {editingId ? "Salva modifiche" : "Crea dipendente"}
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
          {/* Header standardized to match the "gray" style already used on the Courses page */}
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nome</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Inquadramento</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Ruoli</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-3">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="py-2 px-3">{employee.classification_name || "—"}</td>
                <td className="py-2 px-3">
                  {employee.safety_role_ids.map((id) => roles.find((r) => r.id === id)?.name).filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-2 px-3">
                  <button onClick={() => openEditForm(employee)} className="text-blue-600 hover:underline mr-3">
                    Modifica
                  </button>
                  <button onClick={() => deleteEmployee(employee)} className="text-red-600 hover:underline">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                  Nessun dipendente presente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
