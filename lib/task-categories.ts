export const taskCategoryOptions = [
  { value: 'Planning', label: 'Plánovanie' },
  { value: 'Venue', label: 'Miesto' },
  { value: 'Ceremony', label: 'Obrad' },
  { value: 'Food', label: 'Jedlo' },
  { value: 'Home', label: 'Byt a domov' },
  { value: 'Jewelry', label: 'Obrúčky' },
  { value: 'Flowers', label: 'Kvety' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Decisions', label: 'Rozhodnutia' },
  { value: 'Photo', label: 'Foto' },
  { value: 'Program', label: 'Program' },
  { value: 'Logistics', label: 'Logistika' },
  { value: 'Style', label: 'Outfit' },
  { value: 'Communication', label: 'Komunikácia' },
  { value: 'Paperwork', label: 'Úrady' },
  { value: 'Party', label: 'Párty' },
  { value: 'Decor', label: 'Výzdoba' }
] as const;

export type TaskCategoryValue = (typeof taskCategoryOptions)[number]['value'];

export const taskCategoryLabels = Object.fromEntries(taskCategoryOptions.map((category) => [category.value, category.label])) as Record<TaskCategoryValue, string>;

export function getTaskCategoryLabel(category?: string | null) {
  return category && category in taskCategoryLabels ? taskCategoryLabels[category as TaskCategoryValue] : 'Nezaradené';
}
