export const WEDDING_TEMPLATES = [
  { id: 'classic-elegance', name: 'Classic Elegance', description: 'A timeless design with sophisticated typography.' },
  { id: 'modern-romance', name: 'Modern Romance', description: 'Chic and contemporary, for a modern couple.' },
  { id: 'rustic-charm', name: 'Rustic Charm', description: 'Warm and inviting, for a countryside or barn wedding.' },
] as const;

export type WeddingTemplateId = (typeof WEDDING_TEMPLATES)[number]['id'];

/** HSL components stored on the wedding and applied as `--primary`. */
export const ACCENT_PRESETS = [
  { id: 'blush', label: 'Blush', value: '340 60% 75%' },
  { id: 'sage', label: 'Sage', value: '150 22% 38%' },
  { id: 'navy', label: 'Navy', value: '220 40% 32%' },
  { id: 'gold', label: 'Gold', value: '38 45% 42%' },
  { id: 'lavender', label: 'Lavender', value: '270 30% 58%' },
] as const;

export const SAMPLE_SLUG = 'sample';
