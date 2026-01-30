// src/constants.js - Shared constants for Perspectivas
const ANALYSIS_CATEGORIES = [
  { key: 'opinion-editorial', label: 'Opinión Editorial', color: '#7c3aed' },
  { key: 'macro', label: 'Macroeconomía', color: '#3b82f6' },
  { key: 'politica', label: 'Política Económica', color: '#f97316' },
  { key: 'regional', label: 'Análisis Regional', color: '#06b6d4' },
  { key: 'internacional', label: 'Internacional', color: '#10b981' },
  { key: 'columnistas', label: 'Columnistas', color: '#ec4899' }
];

// Exposure for modules or global scope
if (typeof window !== 'undefined') {
    window.ANALYSIS_CATEGORIES = ANALYSIS_CATEGORIES;
}
