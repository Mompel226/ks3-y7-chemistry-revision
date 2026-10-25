/* ============================================================
   words.js — this page's word bank: WHICH words of the KS3 glossary it shows, and in which groups (25 Oct 2026).
   The words themselves, their Korean and Chinese, and their ONE definition each live in labs-shared/ks3-glossary.js,
   copied here as js/glossary.js by tools/practicals-sync.mjs (memory ks3-glossary: one set of KS3 definitions for every
   page). Never write a definition here: add the word to the glossary first. Tapping a word in the word bank opens its
   definition; a glossary word inside a definition is a link to its own definition (js/core.js, initWordBank).
   ============================================================ */
window.WORD_KEYS = [
  { g: 'Particles and atoms', w: ['matter', 'substance', 'particle', 'atom', 'nucleus', 'proton', 'neutron', 'electron', 'charge', 'element', 'chemical-symbol', 'periodic-table', 'metal', 'non-metal', 'conduct', 'bond', 'molecule', 'diatomic', 'compound', 'ratio', 'chemical-formula', 'ion', 'lattice', 'property'] },
  { g: 'States and changes', w: ['state', 'solid', 'liquid', 'gas', 'hydrogen-bond', 'energy', 'temperature', 'room-temperature', 'vibrate', 'compress', 'expand', 'contract', 'mass', 'volume', 'melt', 'freeze', 'melting-point', 'freezing-point', 'boil', 'boiling-point', 'evaporate', 'condense', 'sublimation', 'deposition', 'physical-change', 'chemical-change', 'reversible', 'precipitation'] },
  { g: 'Mixtures and solutions', w: ['mixture', 'pure', 'alloy', 'phase', 'homogeneous', 'heterogeneous', 'solution', 'suspension', 'colloid', 'tyndall', 'transparent', 'solute', 'solvent', 'dissolve', 'soluble', 'insoluble', 'saturated', 'concentration', 'concentrated', 'dilute', 'solubility', 'immiscible', 'density', 'float', 'settle'] },
  { g: 'Separating mixtures', w: ['separate', 'recover', 'sieve', 'filtration', 'decanting', 'funnel-sep', 'magnet', 'magnetism', 'size', 'evaporation', 'crystallisation', 'distillation', 'chromatography', 'filter-paper', 'funnel', 'conical-flask', 'flask', 'basin', 'bunsen', 'condenser', 'thermometer', 'residue', 'filtrate', 'crystal', 'distillate', 'vapour', 'chromatogram', 'baseline', 'solvent-front', 'dye'] },
  { g: 'Investigations', w: ['independent-variable', 'dependent-variable', 'control-variable'] }
];
/* the bank as the page reads it: each group's words, from the glossary */
window.WORDS = window.WORD_KEYS.map(g => ({ g: g.g, w: g.w.map(k => window.KS3_GLOSSARY && window.KS3_GLOSSARY.by[k]).filter(Boolean) }));
