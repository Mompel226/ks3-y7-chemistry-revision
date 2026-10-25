/* ============================================================
   ks3-glossary.js — the ONE list of KS3 science words: each word once, with Korean, Chinese and ONE definition at Key
   Stage 3 level (Daniel, 15 Oct 2026: "create a kind of a document that contains all of those definitions. So if I need
   to provide those definitions in a later lab … it uses that as reference, and we are not recreating multiple
   definitions of the same words over and over again").
   - Where Daniel's Year 7 lessons already define a word, his words are used (src: 'Y7 L2'; his slides
     KS3/KS3 Lessons/Y7/2.Chemistry/L2.Atoms-Compounds/1.Atoms_elements_compounds.pptx), corrected only where a slide is
     not accurate (particle: an element is a substance, not a particle).
   - Particles follow the model the pupils draw (memory particle-model-in-diagrams).
   - A word of another entry inside a definition becomes a link to that entry (the page and tools/ks3-glossary.mjs share
     the rule in forms() below); link: false keeps a word with two meanings from linking ("separate" particles).
   NEVER edit a page's copy (js/glossary.js): edit this file, then run node tools/practicals-sync.mjs (it copies it into
   every KS3 practical) and node tools/ks3-glossary.mjs (it checks the list and writes KS3-GLOSSARY.md, the readable copy).
   ko: the word used in Korean school science; zh: Simplified Chinese as in mainland school chemistry.
   25 Oct 2026: 38 words added for the Year 7 Chemistry revision page (atoms, elements, states and changes, suspensions,
   concentration, variables), from Daniel's knowledge organisers KO_Atoms and KO_States of Matter and his Year 7 syllabus;
   Korean and Chinese checked by an independent reviewer the same day. Later that day: conduct, ratio and recover added, and
   phrasal verbs taken out of the definitions ("takes up", "broken down", "turns into", "stays behind"), as on the page.
   ============================================================ */
(function () {
  'use strict';
  const G = [
    { g: 'Particles and substances', w: [
      { k: 'matter',          en: 'matter',          ko: '물질',              zh: '物质',        src: 'Y7 L2', d: 'Anything that has mass and fills space.' },
      { k: 'substance',       en: 'substance',       ko: '물질',              zh: '物质',        src: 'Y7 L2', d: 'One kind of matter with its own properties, such as water, salt or oxygen.' },
      { k: 'particle',        en: 'particle',        ko: '입자',              zh: '粒子',        src: 'Y7 L2', d: 'A very small piece of matter, such as an atom, a molecule or an ion. Every substance is made of particles.' },
      { k: 'atom',            en: 'atom',            ko: '원자',              zh: '原子',        src: 'Y7 L2', d: 'The smallest particle of an element. Atoms are the building blocks of all matter.' },
      { k: 'element',         en: 'element',         ko: '원소',              zh: '元素（单质）', src: 'Y7 L2', d: 'A pure substance made of only one type of atom. It cannot be split into simpler substances. Each element has a chemical symbol, such as O for oxygen.' },
      { k: 'chemical-symbol', en: 'chemical symbol', ko: '원소 기호',         zh: '元素符号',    src: 'Y7 L2', d: 'One or two letters that stand for an element, such as O for oxygen or Na for sodium.' },
      { k: 'bond',            en: 'bond',            ko: '결합',              zh: '化学键',      src: 'Y7 L2', d: 'A force that holds atoms or ions together.' },
      { k: 'molecule',        en: 'molecule',        ko: '분자',              zh: '分子',        src: 'Y7 L2', d: 'A particle made of two or more atoms joined by bonds, such as water (H₂O) or oxygen (O₂).' },
      { k: 'compound',        en: 'compound',        ko: '화합물',            zh: '化合物',      src: 'Y7 L2', d: 'A substance made of two or more different elements chemically joined together, always in the same ratio, such as water (H₂O) or salt (NaCl). Water is made of molecules; salt is an ionic compound, made of ions in a lattice.' },
      { k: 'ion',             en: 'ion',             ko: '이온',              zh: '离子',        src: 'Y7 L2', d: 'A particle with an electric charge, + or −. Salt is made of sodium ions (+) and chloride ions (−).' },
      { k: 'lattice',         en: 'lattice',         ko: '격자 (결정 격자)',  zh: '晶格',        src: 'Y7 L2', d: 'Particles held in a regular pattern that repeats, as in a crystal of salt.' },
      { k: 'state',           en: 'state of matter', ko: '물질의 상태',       zh: '物质的状态',  also: ['states of matter', 'state'], d: 'The form a substance is in: solid, liquid or gas.' },
      { k: 'solid',           en: 'solid',           ko: '고체',              zh: '固体',        d: 'A state of matter. Its particles are held close together in a regular pattern: they vibrate but stay in place.' },
      { k: 'liquid',          en: 'liquid',          ko: '액체',              zh: '液体',        d: 'A state of matter. Its particles touch and slide past each other, so it flows and takes the shape of its container.' },
      { k: 'gas',             en: 'gas',             ko: '기체',              zh: '气体',        d: 'A state of matter. Its particles are far apart and move fast in all directions; the pull between them is very weak.' },
      { k: 'hydrogen-bond',   en: 'hydrogen bond',   ko: '수소 결합',         zh: '氢键',        d: 'A weak pull between molecules, such as between a hydrogen atom of one water molecule and the oxygen atom of the next. It is much weaker than the bonds inside a molecule. In liquid water it keeps the molecules close while they slide past each other.' }
    ]},
    { g: 'Inside atoms', w: [
      { k: 'nucleus',           en: 'nucleus',             ko: '원자핵',                 zh: '原子核',         d: 'The tiny centre of an atom. It holds the protons and the neutrons.' },
      { k: 'proton',            en: 'proton',              ko: '양성자',                 zh: '质子',          d: 'A particle in the nucleus of an atom. It has a positive charge (+).' },
      { k: 'neutron',           en: 'neutron',             ko: '중성자',                 zh: '中子',          d: 'A particle in the nucleus of an atom. It has no charge: it is neutral.' },
      { k: 'electron',          en: 'electron',            ko: '전자',                  zh: '电子',          d: 'A very small particle that moves around the nucleus of an atom. It has a negative charge (−).' },
      { k: 'charge',            en: 'charge',              ko: '전하',                  zh: '电荷',          d: 'An electrical property of a particle: it can be positive (+) or negative (−). Protons are positive and electrons are negative; a particle with no charge is neutral. Opposite charges attract each other. An atom has the same number of protons and electrons, so it has no overall charge.' }
    ]},
    { g: 'Elements and compounds', w: [
      { k: 'metal',             en: 'metal',               ko: '금속',                  zh: '金属',          d: 'An element that is shiny and conducts heat and electricity well, such as iron, copper and aluminium. Most metals are solid at room temperature; mercury is a liquid.' },
      { k: 'non-metal',         en: 'non-metal',           ko: '비금속',                 zh: '非金属',         d: 'An element that is not a metal, such as carbon, sulfur, oxygen and nitrogen. Most non-metals are dull and do not conduct electricity. At room temperature, some are solids, many are gases and one is a liquid.' },
      { k: 'conduct',           en: 'conduct',             ko: '전도하다',                zh: '传导（导电、导热）',  d: 'To let heat or electricity pass through easily. Metals conduct heat and electricity well.' },
      { k: 'periodic-table',    en: 'periodic table',      ko: '주기율표',                zh: '元素周期表',       d: 'A table of all the elements, in order of the number of protons in their atoms. The metals are to the left of a zigzag line and the non-metals to its right; hydrogen is a non-metal at the top left.' },
      { k: 'chemical-formula',  en: 'chemical formula',    ko: '화학식',                 zh: '化学式',        also: ['formula', 'formulae'], d: 'Symbols and small numbers that show the atoms in a substance. H₂O means two hydrogen atoms joined to one oxygen atom.' },
      { k: 'ratio',             en: 'ratio',               ko: '비율',                   zh: '比例',          d: 'How many there are of one thing for each of another. In water, H₂O, the ratio of hydrogen atoms to oxygen atoms is 2 : 1.' },
      { k: 'diatomic',          en: 'diatomic',            ko: '이원자 (두 원자로 된)',       zh: '双原子的',        d: 'Made of two atoms joined together. Hydrogen (H₂), oxygen (O₂), nitrogen (N₂) and chlorine (Cl₂) are diatomic elements: each molecule has two atoms of the same element.' }
    ]},
    { g: 'States and changes', w: [
      { k: 'energy',            en: 'energy',              ko: '에너지',                 zh: '能量',          d: 'What is needed for things to change or move. Heating gives the particles of a substance more energy, so they move faster.' },
      { k: 'temperature',       en: 'temperature',         ko: '온도',                  zh: '温度',          d: 'How hot or cold something is, measured in degrees Celsius (°C). The higher the temperature, the faster the particles move.' },
      { k: 'room-temperature',  en: 'room temperature',    ko: '상온 (실온)',                  zh: '室温',          d: 'About 20 to 25 °C: how warm a normal classroom is.' },
      { k: 'vibrate',           en: 'vibrate',             ko: '진동하다',                zh: '振动',         also: ['vibration'], d: 'To move quickly backwards and forwards around one place. The particles in a solid vibrate.' },
      { k: 'compress',          en: 'compress',            ko: '압축하다',                zh: '压缩',         also: ['compressible'], d: 'To squash something into a smaller volume. You can compress a gas, because its particles are far apart; you cannot compress a solid or a liquid, because their particles already touch.' },
      { k: 'expand',            en: 'expand',              ko: '팽창하다',                zh: '膨胀',         also: ['expansion'], d: 'To get bigger: to fill more space. A substance expands when it is heated, because its particles move more and the gaps between them get bigger. The particles themselves do not get bigger.' },
      { k: 'contract',          en: 'contract',            ko: '수축하다',                zh: '收缩',         also: ['contraction'], d: 'To get smaller: to fill less space. A substance contracts when it cools, because its particles move less and the gaps between them get smaller.' },
      { k: 'melt',              en: 'melt',                ko: '녹다 (융해)',             zh: '熔化',          d: 'To change from a solid into a liquid when it is heated. This happens at its melting point.' },
      { k: 'freeze',            en: 'freeze',              ko: '얼다 (응고)',             zh: '凝固',         also: ['froze', 'frozen'], d: 'To change from a liquid into a solid when it is cooled. This happens at its freezing point.' },
      { k: 'melting-point',     en: 'melting point',       ko: '녹는점',                 zh: '熔点',          d: 'The temperature at which a solid changes into a liquid. Ice melts at 0 °C. A pure substance melts and freezes at the same temperature.' },
      { k: 'freezing-point',    en: 'freezing point',      ko: '어는점',                 zh: '凝固点',         d: 'The temperature at which a liquid changes into a solid. It is the same temperature as the melting point: water freezes at 0 °C, and ice melts at 0 °C.' },
      { k: 'sublimation',       en: 'sublimation',         ko: '승화 (고체 → 기체)',        zh: '升华',          d: 'A change of state straight from a solid into a gas, with no liquid in between. Dry ice (solid carbon dioxide) does this.' },
      { k: 'deposition',        en: 'deposition',          ko: '승화 (기체 → 고체)',        zh: '凝华',          d: 'A change of state straight from a gas into a solid, with no liquid in between. Frost forms like this on a very cold night.' },
      { k: 'physical-change',   en: 'physical change',     ko: '물리 변화',               zh: '物理变化',        d: 'A change in which no new substance forms, such as melting, dissolving or bending. It is usually reversible.' },
      { k: 'chemical-change',   en: 'chemical change',     ko: '화학 변화',               zh: '化学变化',       also: ['chemical reaction', 'chemical reactions'], d: 'A change in which a new substance forms, such as burning, rusting, or iron and sulfur making iron sulfide. It is a chemical reaction.' },
      { k: 'reversible',        en: 'reversible',          ko: '가역적인 (되돌릴 수 있는)',     zh: '可逆的',         d: 'Able to happen in the opposite direction too: ice melts into water, and the water can freeze into ice again.' },
      { k: 'precipitation',     en: 'precipitation',       ko: '강수',                  zh: '降水',          d: 'Water that falls from clouds to the ground as rain, snow or hail: one stage of the water cycle.' },
      { k: 'mass',              en: 'mass',                ko: '질량',                  zh: '质量',          d: 'How much matter something has, measured in grams (g) or kilograms (kg).' },
      { k: 'volume',            en: 'volume',              ko: '부피',                  zh: '体积',          d: 'How much space something fills, measured in cm³ (cubic centimetres) or litres.' }
    ]},
    { g: 'Mixtures', w: [
      { k: 'mixture',         en: 'mixture',         ko: '혼합물',            zh: '混合物',      d: 'Two or more substances that are not chemically joined together. Each keeps its own properties, so you can separate them by physical methods.' },
      { k: 'pure',            en: 'pure substance',  ko: '순물질',            zh: '纯净物',      d: 'Only one substance, with no other substance mixed with it: one element or one compound.' },
      { k: 'solution',        en: 'solution',        ko: '용액',              zh: '溶液',        d: 'A mixture made when a solute dissolves in a solvent. It looks the same all through: one phase.' },
      { k: 'solute',          en: 'solute',          ko: '용질',              zh: '溶质',        d: 'The substance that dissolves in a solvent.' },
      { k: 'solvent',         en: 'solvent',         ko: '용매',              zh: '溶剂',        d: 'The liquid that a solute dissolves in.' },
      { k: 'dissolve',        en: 'dissolve',        ko: '용해되다 (녹다)',    zh: '溶解',        d: 'To separate into particles that spread between the particles of a solvent, so you can no longer see the solid.' },
      { k: 'soluble',         en: 'soluble',         ko: '녹는 (가용성)',      zh: '可溶的',      d: 'Able to dissolve in a solvent.' },
      { k: 'insoluble',       en: 'insoluble',       ko: '녹지 않는 (불용성)', zh: '不溶的',      d: 'Not able to dissolve in a solvent.' },
      { k: 'saturated',       en: 'saturated solution', ko: '포화 용액',      zh: '饱和溶液',    also: ['saturated'], d: 'A solution in which no more solute can dissolve at that temperature.' },
      { k: 'phase',           en: 'phase',           ko: '상',                zh: '相',          d: 'One part of a mixture that looks the same all through, such as the sand or the water in muddy water.' },
      { k: 'homogeneous',     en: 'homogeneous',     ko: '균일한',            zh: '均一的',      d: 'The same all through: you see only one phase.' },
      { k: 'heterogeneous',   en: 'heterogeneous',   ko: '불균일한',          zh: '不均一的',    d: 'Not the same all through: you see more than one phase.' },
      { k: 'mechanical',      en: 'mechanical mixture', ko: '불균일 혼합물',  zh: '不均一混合物', d: 'A mixture in which you can see more than one phase, such as sand in water.' },
      { k: 'miscible',        en: 'miscible',        ko: '서로 섞이는',       zh: '互溶的',      d: 'Able to mix completely and make one liquid, such as ethanol and water.' },
      { k: 'immiscible',      en: 'immiscible',      ko: '서로 섞이지 않는',  zh: '不互溶的',    d: 'Not able to mix: the liquids form layers, such as oil and water.' },
      { k: 'alloy',           en: 'alloy',           ko: '합금',              zh: '合金',        d: 'A mixture of a metal with other elements, such as brass (copper and zinc). It looks the same all through.' },
      { k: 'colloid',         en: 'colloid',         ko: '콜로이드',          zh: '胶体',        d: 'A mixture with very small droplets or solid pieces spread through a liquid. They do not sink or rise. Milk is a colloid.' },
      { k: 'droplet',         en: 'droplet',         ko: '작은 방울',         zh: '小液滴',      d: 'A very small drop of a liquid.' },
      { k: 'fat',             en: 'fat',             ko: '지방',              zh: '脂肪',        d: 'An oily substance in food, such as butter or olive oil. Milk has tiny droplets of fat.' },
      { k: 'protein',         en: 'protein',         ko: '단백질',            zh: '蛋白质',      d: 'A substance in food that the body uses to grow and repair itself. Egg white, meat and milk contain protein.' },
      { k: 'tyndall',         en: 'Tyndall effect',  ko: '틴들 현상',         zh: '丁达尔效应',  d: 'A beam of light shows as it passes through a colloid, because its tiny droplets or pieces scatter the light.' },
      { k: 'suspension',        en: 'suspension',          ko: '현탁액',                 zh: '悬浊液',         d: 'A mixture with small pieces of an insoluble solid spread through a liquid, such as chalk powder stirred into water. It is cloudy, and the pieces settle to the bottom when you leave it to stand (keep it still, with no stirring).' },
      { k: 'concentration',     en: 'concentration',       ko: '농도',                  zh: '浓度',          d: 'The mass of solute dissolved in a certain volume of solution, for example 5 g in 100 cm³.' },
      { k: 'concentrated',      en: 'concentrated',        ko: '진한 (농도가 높은)',         zh: '浓的',          d: 'Having a large mass of solute dissolved in a small volume: many solute particles in each part of the solution.' },
      { k: 'dilute',            en: 'dilute',              ko: '묽은 (농도가 낮은)',         zh: '稀的',          d: 'Having only a small mass of solute dissolved in a large volume: few solute particles in each part of the solution. Adding more solvent makes a solution more dilute.' },
      { k: 'transparent',       en: 'transparent',         ko: '투명한',                 zh: '透明的',         d: 'See-through: light passes through it. A solution is transparent, even when it has a colour.' }
    ]},
    { g: 'Separation methods', w: [
      { k: 'recover',         en: 'recover',         ko: '회수하다 (되찾다)',  zh: '回收',        d: 'To collect a substance again from a mixture, separate from the other substances.' },
      { k: 'filtration',      en: 'filtration',      ko: '거르기 (여과)',     zh: '过滤',        d: 'Separating an insoluble solid from a liquid with filter paper. The solid stays on the paper; the liquid passes through.' },
      { k: 'evaporation',     en: 'evaporation',     ko: '증발',              zh: '蒸发',        d: 'Heating a solution so the solvent changes to a gas and leaves; the dissolved solid remains.' },
      { k: 'crystallisation', en: 'crystallisation', ko: '결정화',            zh: '结晶',        d: 'Making crystals of a dissolved solid: heat the solution until it is saturated, then leave it to cool.' },
      { k: 'distillation',    en: 'simple distillation', ko: '단순 증류',     zh: '蒸馏',        also: ['distillation'], d: 'Boiling a solution and cooling the vapour in a condenser, to collect the pure solvent.' },
      { k: 'fractional',      en: 'fractional distillation', ko: '분별 증류', zh: '分馏',        d: 'Separating miscible liquids with different boiling points. A fractionating column above the flask lets the liquid with the lowest boiling point reach the condenser first.' },
      { k: 'chromatography',  en: 'chromatography',  ko: '크로마토그래피',    zh: '色谱法（层析法）', d: 'Separating the dissolved substances in a mixture, such as the dyes in an ink, as a solvent moves up paper.' },
      { k: 'decanting',       en: 'decanting',       ko: '기울여 따르기',     zh: '倾析',        d: 'Pouring the top liquid slowly into another container, leaving the solid or the lower liquid behind.' },
      { k: 'funnel-sep',      en: 'separating funnel', ko: '분별 깔때기',     zh: '分液漏斗',    d: 'Glassware with a tap at the bottom, for separating immiscible liquids.' },
      { k: 'sieve',           en: 'sieve',           ko: '체',                zh: '筛子',        d: 'A mesh that lets small pieces fall through and keeps big pieces.' },
      { k: 'magnet',          en: 'magnet',          ko: '자석',              zh: '磁铁',        d: 'An object that attracts iron, steel, nickel and cobalt.' }
    ]},
    { g: 'Apparatus', w: [
      { k: 'filter-paper',    en: 'filter paper',    ko: '거름종이',          zh: '滤纸',        d: 'Paper with tiny holes. A liquid passes through; bigger solid pieces stay on it.' },
      { k: 'funnel',          en: 'funnel',          ko: '깔때기',            zh: '漏斗',        d: 'A cone of glass or plastic that guides a liquid into a narrow opening.' },
      { k: 'beaker',          en: 'beaker',          ko: '비커',              zh: '烧杯',        d: 'A glass container with straight sides and a lip for pouring.' },
      { k: 'flask',           en: 'round-bottomed flask', ko: '둥근바닥 플라스크', zh: '圆底烧瓶', d: 'A glass flask with a round bottom and a narrow neck, heated evenly in distillation.' },
      { k: 'conical-flask',   en: 'conical flask',   ko: '삼각 플라스크',     zh: '锥形瓶',      d: 'A glass flask shaped like a cone, with a narrow neck.' },
      { k: 'basin',           en: 'evaporating basin', ko: '증발 접시',       zh: '蒸发皿',      d: 'A shallow dish that can be heated, for evaporating a liquid.' },
      { k: 'bunsen',          en: 'Bunsen burner',   ko: '분젠 버너',         zh: '本生灯',      d: 'A gas burner that heats things in the laboratory.' },
      { k: 'glass-rod',       en: 'glass rod',       ko: '유리 막대',         zh: '玻璃棒',      d: 'A thin glass stick, for stirring or for guiding a liquid as you pour.' },
      { k: 'condenser',       en: 'condenser',       ko: '냉각기',            zh: '冷凝管',      d: 'A glass tube cooled by cold water around it. It turns a vapour back into a liquid.' },
      { k: 'thermometer',     en: 'thermometer',     ko: '온도계',            zh: '温度计',      d: 'An instrument that measures temperature.' }
    ]},
    { g: 'Results', w: [
      { k: 'residue',         en: 'residue',         ko: '거르고 남은 것 (잔류물)', zh: '滤渣',   d: 'The solid left on the filter paper.' },
      { k: 'filtrate',        en: 'filtrate',        ko: '거른 액체 (여과액)', zh: '滤液',       d: 'The liquid that passes through the filter paper.' },
      { k: 'crystal',         en: 'crystal',         ko: '결정',              zh: '晶体',        d: 'A solid with flat faces and straight edges. Its particles are held in a lattice.' },
      { k: 'distillate',      en: 'distillate',      ko: '증류액',            zh: '馏出液',      d: 'The pure liquid collected after distillation.' },
      { k: 'vapour',          en: 'vapour',          ko: '증기',              zh: '蒸气',        d: 'The gas of a substance that is usually a liquid at room temperature. Steam is water vapour.' },
      { k: 'chromatogram',    en: 'chromatogram',    ko: '크로마토그램',      zh: '色谱图',      d: 'The pattern of spots on the paper after chromatography.' },
      { k: 'baseline',        en: 'start line',      ko: '출발선 (기준선)',   zh: '起始线',      d: 'The pencil line near the bottom of the paper, where the spots are put.' },
      { k: 'solvent-front',   en: 'solvent front',   ko: '용매 전선',         zh: '溶剂前沿',    d: 'The line the solvent has reached at the top of its path up the paper.' },
      { k: 'stationary',      en: 'stationary phase', ko: '고정상',           zh: '固定相',      d: 'The part that does not move: in paper chromatography, the paper.' },
      { k: 'mobile',          en: 'mobile phase',    ko: '이동상',            zh: '流动相',      d: 'The part that moves: in paper chromatography, the solvent.' },
      { k: 'rf',              en: 'Rf value',        ko: 'Rf 값',             zh: '比移值（Rf值）', d: 'Distance moved by a dye ÷ distance moved by the solvent, both from the start line. It has no unit.' },
      { k: 'dye',             en: 'dye',             ko: '염료 (색소)',       zh: '染料',        d: 'A coloured substance. An ink is often a mixture of dyes.' }
    ]},
    { g: 'Properties', w: [
      { k: 'size',            en: 'size',            ko: '크기',              zh: '大小',        d: 'How big the particles or pieces are.' },
      { k: 'solubility',      en: 'solubility',      ko: '용해도',            zh: '溶解度',      d: 'The mass of a substance that can dissolve in a given volume of a solvent.' },
      { k: 'volatility',      en: 'volatility',      ko: '휘발성',            zh: '挥发性',      d: 'How easily a substance changes to a gas.' },
      { k: 'boiling-point',   en: 'boiling point',   ko: '끓는점',            zh: '沸点',        d: 'The temperature at which a liquid boils.' },
      { k: 'density',         en: 'density',         ko: '밀도',              zh: '密度',        d: 'How much mass there is in a certain volume. A less dense liquid floats on a denser one.' },
      { k: 'magnetism',       en: 'magnetism',       ko: '자성',              zh: '磁性',        d: 'Being attracted by a magnet. Iron, steel, nickel and cobalt are magnetic.' },
      { k: 'affinity',        en: 'affinity',        ko: '친화력',            zh: '亲和力',      d: 'How strongly a substance is attracted to something: to the paper or to the solvent.' },
      { k: 'property',          en: 'property',            ko: '성질',                  zh: '性质',          d: 'What a substance is like or how it behaves, such as its colour, its melting point, or whether it is magnetic.' }
    ]},
    { g: 'Doing words', w: [
      { k: 'boil',            en: 'boil',            ko: '끓다',              zh: '沸腾',        d: 'To change to a gas all through the liquid, with bubbles, at the boiling point.' },
      { k: 'evaporate',       en: 'evaporate',       ko: '증발하다',          zh: '蒸发',        d: 'To change from a liquid into a gas. It happens at the surface; heating makes it faster.' },
      { k: 'condense',        en: 'condense',        ko: '액화하다 (응결하다)', zh: '冷凝（液化）', also: ['condensation'], d: 'To change from a gas into a liquid when cooled.' },
      { k: 'heat',            en: 'heat',            ko: '가열하다',          zh: '加热',        d: 'To make something hotter.' },
      { k: 'cool',            en: 'cool',            ko: '식히다 (냉각하다)', zh: '冷却',        d: 'To make something colder, or to become colder.' },
      { k: 'separate',        en: 'separate',        ko: '분리하다',          zh: '分离',        link: false, d: 'To take the parts of a mixture away from each other.' },
      { k: 'attract',         en: 'attract',         ko: '끌어당기다',        zh: '吸引',        d: 'To pull something towards itself, as a magnet pulls iron.' },
      { k: 'float',           en: 'float',           ko: '뜨다',              zh: '漂浮',        d: 'To stay on the top of a liquid.' },
      { k: 'settle',          en: 'settle',          ko: '가라앉다',          zh: '沉降',        d: 'To sink slowly to the bottom of a liquid and stay there.' }
    ]},
    { g: 'Investigations', w: [
      { k: 'independent-variable', en: 'independent variable', ko: '조작 변인 (독립 변인)',       zh: '自变量',         d: 'The thing you change in an experiment, to see what effect it has. On a graph, you plot it on the x-axis (across).' },
      { k: 'dependent-variable', en: 'dependent variable',  ko: '종속 변인',               zh: '因变量',         d: 'The thing you measure in an experiment, to see how the independent variable affects it. On a graph, you plot it on the y-axis (up).' },
      { k: 'control-variable',  en: 'control variable',    ko: '통제 변인',               zh: '控制变量',       also: ['control variables', 'controlled variable', 'controlled variables'], d: 'Something you keep the same in an experiment, so that the test is fair.' }
    ]}
  ];
  const BY = {};
  G.forEach(g => g.w.forEach(w => { w.g = g.g; BY[w.k] = w; }));
  /* the forms of a word that link to it inside a definition: the word, its plural, and for a doing word its other forms
     (a phrase changes only its last word: "boiling points", "chemical symbols"), and any other form it lists in also */
  function forms(w) {
    const parts = w.en.split(' '), last = parts.pop(), head = parts.length ? parts.join(' ') + ' ' : '';
    const ends = new Set([last, last + 's', last + 'es', last.replace(/y$/, 'ies'), last + 'd', last + 'ed', last.replace(/e$/, '') + 'ing', last + 'ing', last.replace(/e$/, '') + 'ed']);
    return Array.from(ends).map(e => head + e).concat(w.also || []).sort((a, b) => b.length - a.length);
  }
  /* a definition cut into words and links: [text, key or null], each key at most once; longest names first */
  function links(d, has, self) {
    const cands = [];
    Object.keys(BY).forEach(k => { const w = BY[k]; if (k === self || w.link === false || (has && !has(k))) return; forms(w).forEach(f => cands.push([f, k])); });
    cands.sort((a, b) => b[0].length - a[0].length);
    const out = [], used = new Set();
    let rest = d;
    for (;;) {
      let best = null;
      for (const [f, k] of cands) {
        if (used.has(k)) continue;
        const m = new RegExp('(^|[^A-Za-z])(' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])', 'i').exec(rest);
        if (m && (!best || m.index + m[1].length < best.at || (m.index + m[1].length === best.at && m[2].length > best.len))) best = { at: m.index + m[1].length, len: m[2].length, k };
      }
      if (!best) { if (rest) out.push([rest, null]); return out; }
      if (best.at) out.push([rest.slice(0, best.at), null]);
      out.push([rest.substr(best.at, best.len), best.k]); used.add(best.k);
      rest = rest.slice(best.at + best.len);
    }
  }
  const api = { groups: G, by: BY, forms, links };
  if (typeof window !== 'undefined') window.KS3_GLOSSARY = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
