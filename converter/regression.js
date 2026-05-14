#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { convertIfcTextToVRIFC } = require('./ifc-to-vrifc.js');

const root = path.resolve(__dirname, '..', '..');
const fixtures = [
  'TEST IFCer/Ifc4_SampleHouse.ifc',
  'TEST IFCer/Ifc4_Revit_MEP.ifc',
  'TEST IFCer/V157-V-test.ifc',
  'TEST IFCer/W150-V-test.ifc'
];

function main() {
  const args = process.argv.slice(2);
  const maxElements = readNumberOption(args, '--max-elements', 100000);
  const overviewMode = readStringOption(args, '--overview', 'auto');
  const json = args.includes('--json');
  const selected = positionalArgs(args);
  const files = selected.length ? selected : fixtures;
  const rows = files.map((file) => runOne(resolveInput(file), { maxElements, overviewMode }));

  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  console.log('VR-IFC converter regression');
  console.log(`Max elements: ${maxElements}`);
  console.log(`Overview mode: ${overviewMode}`);
  console.log('');
  printTable(rows);
}

function runOne(input, options) {
  const started = Date.now();
  const text = fs.readFileSync(input, 'utf8');
  const sourceName = path.basename(input);
  const result = convertIfcTextToVRIFC(text, {
    sourceName,
    projectName: sourceName.replace(/\.[^.]+$/, ''),
    maxElements: options.maxElements,
    overviewMode: options.overviewMode
  });
  const q = result.doc.qualityReport;

  return {
    file: path.relative(root, input).replace(/\\/g, '/'),
    seconds: round((Date.now() - started) / 1000, 2),
    entities: result.stats.entityCount,
    products: result.stats.productCount,
    elements: q.summary.elements,
    representationElements: q.summary.representationElements,
    overviewFallbackElements: q.summary.overviewFallbackElements,
    visualOverlayElements: q.summary.visualOverlayElements || 0,
    typeProxyElements: q.summary.typeProxyElements,
    geometryCoverage: q.summary.geometryCoverage,
    styledMaterialCoverage: q.summary.styledMaterialCoverage,
    visualMaterialCoverage: q.summary.visualMaterialCoverage,
    geometrySources: result.stats.geometrySources,
    fallbackReasons: result.stats.fallbackReasons,
    bounds: result.stats.runtimeBounds.size,
    outliers: q.bounds.outlierElements,
    score: q.summary.score,
    level: q.summary.level,
    warnings: q.warnings.map((warning) => `${warning.severity}:${warning.code}:${warning.count}`)
  };
}

function printTable(rows) {
  const columns = [
    ['file', 34],
    ['score', 7],
    ['level', 10],
    ['products', 9],
    ['elements', 9],
    ['rep', 8],
    ['overview', 9],
    ['overlay', 8],
    ['proxy', 8],
    ['geom%', 8],
    ['ifcMat%', 8],
    ['visMat%', 8],
    ['outliers', 9],
    ['seconds', 8]
  ];
  console.log(columns.map(([name, width]) => pad(name, width)).join(' '));
  console.log(columns.map(([, width]) => '-'.repeat(width)).join(' '));
  for (const row of rows) {
    const values = {
      file: row.file,
      score: String(row.score),
      level: row.level,
      products: String(row.products),
      elements: String(row.elements),
      rep: String(row.representationElements),
      overview: String(row.overviewFallbackElements),
      overlay: String(row.visualOverlayElements),
      proxy: String(row.typeProxyElements),
      'geom%': percent(row.geometryCoverage),
      'ifcMat%': percent(row.styledMaterialCoverage),
      'visMat%': percent(row.visualMaterialCoverage),
      outliers: String(row.outliers),
      seconds: String(row.seconds)
    };
    console.log(columns.map(([name, width]) => pad(values[name], width)).join(' '));
    console.log(`  sources: ${formatCounts(row.geometrySources)}`);
    console.log(`  fallback: ${formatCounts(row.fallbackReasons)}`);
    console.log(`  bounds: ${row.bounds.join(' x ')} m`);
    console.log(`  warnings: ${row.warnings.join(', ') || '-'}`);
  }
}

function resolveInput(file) {
  return path.isAbsolute(file) ? file : path.resolve(root, file);
}

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => `${key}:${value}`)
    .join(', ') || '-';
}

function readNumberOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) return fallback;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readStringOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) return fallback;
  return args[index + 1] || fallback;
}

function positionalArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (['--max-elements', '--overview'].includes(arg)) i++;
      continue;
    }
    out.push(arg);
  }
  return out;
}

function percent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function pad(value, width) {
  const text = String(value ?? '');
  if (text.length >= width) return `${text.slice(0, width - 1)}…`;
  return text.padEnd(width, ' ');
}

main();
