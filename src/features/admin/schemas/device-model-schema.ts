import { z } from 'zod';

import type { DeviceModel } from '../../../shared/api/types';

// Same comparison the backend uses for duplicates: trimmed, case-insensitive.
export function modelKey(brand: string, model: string): string {
  return `${brand.trim().toLocaleLowerCase('es')}\u0000${model.trim().toLocaleLowerCase('es')}`;
}

// FE-11: mirrors CreateDeviceModelDto, plus the duplicate check against the
// loaded catalog so the admin learns it before submitting. The backend still
// answers 409 if another admin added it meanwhile.
export function deviceModelSchema(catalog: readonly DeviceModel[]) {
  const taken = new Set(catalog.map((entry) => modelKey(entry.brand, entry.model)));
  return z
    .object({
      brand: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
      model: z.string().trim().min(1, 'Ingrese el modelo').max(80, 'Máximo 80 caracteres'),
    })
    .refine((values) => !taken.has(modelKey(values.brand, values.model)), {
      path: ['model'],
      message: 'Este modelo ya está registrado para esa marca',
    });
}

export type DeviceModelFormValues = z.output<ReturnType<typeof deviceModelSchema>>;

export interface BrandGroup {
  brand: string;
  models: DeviceModel[];
}

// Groups by brand ignoring case ("apple" joins "Apple"), sorted by brand and
// model; the first spelling seen names the group.
export function groupByBrand(models: readonly DeviceModel[]): BrandGroup[] {
  const groups = new Map<string, BrandGroup>();
  for (const entry of models) {
    const key = entry.brand.trim().toLocaleLowerCase('es');
    const group = groups.get(key) ?? { brand: entry.brand.trim(), models: [] };
    group.models.push(entry);
    groups.set(key, group);
  }
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
  return [...groups.values()]
    .map((group) => ({ ...group, models: [...group.models].sort((a, b) => collator.compare(a.model, b.model)) }))
    .sort((a, b) => collator.compare(a.brand, b.brand));
}

// Reuses the catalog's spelling of a known brand ("apple" -> "Apple"), so the
// same brand is never stored twice with different case.
export function canonicalBrand(brand: string, catalog: readonly DeviceModel[]): string {
  const key = brand.trim().toLocaleLowerCase('es');
  return catalog.find((entry) => entry.brand.trim().toLocaleLowerCase('es') === key)?.brand.trim() ?? brand.trim();
}

// Every word must appear in "brand model": "apple 13" finds "Apple iPhone 13".
export function matchesModelSearch(entry: DeviceModel, search: string): boolean {
  const words = search.toLocaleLowerCase('es').split(/\s+/).filter(Boolean);
  const haystack = `${entry.brand} ${entry.model}`.toLocaleLowerCase('es');
  return words.every((word) => haystack.includes(word));
}
