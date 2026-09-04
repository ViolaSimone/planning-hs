"use client";

import { FilterMenu } from "@/components/ui/FilterMenu";
import { dashboardCategoryLabel, type DashboardCategory } from "@/lib/categories";
import { COLUMN_LABELS, type ColumnKey, type CourseColumn, type SafetyRole } from "./types";

export type DashboardOpenMenu = "roles" | "status" | "courses" | "columns" | null;

interface DashboardFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;

  allSafetyRoleNames: string[];
  roles: SafetyRole[];
  selectedRoles: number[];
  onSelectedRolesChange: (ids: number[]) => void;

  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;

  allCourses: CourseColumn[];
  selectedCourseIds: number[];
  onSelectedCourseIdsChange: (ids: number[]) => void;

  selectedColumns: ColumnKey[];
  onSelectedColumnsChange: (columns: ColumnKey[]) => void;
  defaultColumnsCount: number;

  exportFormat: "csv" | "excel";
  onExportFormatChange: (format: "csv" | "excel") => void;
  onExport: () => void;
  exporting: boolean;

  onResetFilters: () => void;

  openMenu: DashboardOpenMenu;
  onOpenMenuChange: (menu: DashboardOpenMenu) => void;
}

export function DashboardFilterBar({
  search,
  onSearchChange,
  allSafetyRoleNames,
  roles,
  selectedRoles,
  onSelectedRolesChange,
  selectedCategories,
  onSelectedCategoriesChange,
  allCourses,
  selectedCourseIds,
  onSelectedCourseIdsChange,
  selectedColumns,
  onSelectedColumnsChange,
  defaultColumnsCount,
  exportFormat,
  onExportFormatChange,
  onExport,
  exporting,
  onResetFilters,
  openMenu,
  onOpenMenuChange,
}: DashboardFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col text-sm">
        <span className="font-medium text-slate-700">Cerca dipendente</span>
        <input
          type="text"
          placeholder="Nome o cognome..."
          className="input mt-1"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <FilterMenu
        label="Ruoli"
        count={selectedRoles.length}
        isOpen={openMenu === "roles"}
        onToggle={() => onOpenMenuChange(openMenu === "roles" ? null : "roles")}
      >
        {allSafetyRoleNames.map((roleName) => {
          const roleId = roles.find((r) => r.name === roleName)?.id;
          if (!roleId) return null;
          return (
            <label key={roleId} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedRoles.includes(roleId)}
                onChange={(e) => {
                  if (e.target.checked) onSelectedRolesChange([...selectedRoles, roleId]);
                  else onSelectedRolesChange(selectedRoles.filter((id) => id !== roleId));
                }}
              />
              {roleName}
            </label>
          );
        })}
      </FilterMenu>

      <FilterMenu
        label="Stato"
        count={selectedCategories.length}
        isOpen={openMenu === "status"}
        onToggle={() => onOpenMenuChange(openMenu === "status" ? null : "status")}
      >
        {(["missing", "expired", "expiring_soon", "ok"] as DashboardCategory[]).map((cat) => (
          <label key={cat} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={(e) => {
                if (e.target.checked) onSelectedCategoriesChange([...selectedCategories, cat]);
                else onSelectedCategoriesChange(selectedCategories.filter((c) => c !== cat));
              }}
            />
            {dashboardCategoryLabel(cat)}
          </label>
        ))}
      </FilterMenu>

      <FilterMenu
        label="Corsi"
        count={selectedCourseIds.length}
        isOpen={openMenu === "courses"}
        onToggle={() => onOpenMenuChange(openMenu === "courses" ? null : "courses")}
        width="w-64"
      >
        {allCourses.map((course) => (
          <label key={course.course_id} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedCourseIds.includes(course.course_id)}
              onChange={(e) => {
                if (e.target.checked) onSelectedCourseIdsChange([...selectedCourseIds, course.course_id]);
                else onSelectedCourseIdsChange(selectedCourseIds.filter((id) => id !== course.course_id));
              }}
            />
            {course.course_name} ({course.course_code})
          </label>
        ))}
      </FilterMenu>

      <FilterMenu
        label="Campi visibili"
        count={selectedColumns.length !== defaultColumnsCount ? selectedColumns.length : 0}
        isOpen={openMenu === "columns"}
        onToggle={() => onOpenMenuChange(openMenu === "columns" ? null : "columns")}
        width="w-56"
      >
        {Object.entries(COLUMN_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedColumns.includes(key as ColumnKey)}
              onChange={(e) => {
                const columnKey = key as ColumnKey;
                if (e.target.checked) onSelectedColumnsChange([...selectedColumns, columnKey]);
                else onSelectedColumnsChange(selectedColumns.filter((c) => c !== columnKey));
              }}
            />
            {label}
          </label>
        ))}
      </FilterMenu>

      <div className="flex items-center gap-2">
        <select
          className="input text-xs"
          value={exportFormat}
          onChange={(e) => onExportFormatChange(e.target.value as "csv" | "excel")}
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </select>
        <button
          onClick={onExport}
          disabled={exporting}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {exporting ? "Export in corso…" : "Esporta"}
        </button>
      </div>

      <button onClick={onResetFilters} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
        Reset filtri
      </button>
    </div>
  );
}
