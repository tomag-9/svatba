import {
  CalendarDays,
  Camera,
  Car,
  Church,
  CircleDashed,
  Disc3,
  FileText,
  Flower2,
  Gem,
  Home,
  House,
  Landmark,
  List,
  ListChecks,
  Megaphone,
  Palette,
  Shirt,
  Sparkles,
  Utensils,
  type LucideIcon
} from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  Planning: CalendarDays,
  Venue: Landmark,
  Ceremony: Church,
  Food: Utensils,
  Home,
  Jewelry: Gem,
  Flowers: Flower2,
  Beauty: Sparkles,
  Decisions: ListChecks,
  Photo: Camera,
  Program: List,
  Logistics: Car,
  Style: Shirt,
  Communication: Megaphone,
  Paperwork: FileText,
  Party: Disc3,
  Decor: Palette
};

export function CategoryIcon({ category, size = 34 }: { category?: string | null; size?: number }) {
  const Icon = category ? categoryIcons[category] ?? CircleDashed : CircleDashed;

  return (
    <span className="category-icon" style={{ width: size, height: size, borderRadius: Math.max(10, Math.round(size * 0.35)) }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}
