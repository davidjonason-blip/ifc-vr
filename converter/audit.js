#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { convertIfcTextToVRIFC } = require('./ifc-to-vrifc.js');

const root = path.resolve(__dirname, '..', '..');

function main() {
  const args = process.argv.slice(2);
  const maxElements = readNumberOption(args, '--max-elements', 100000);
  const overviewMode = readStringOption(args, '--overview', 'auto');
  const json = args.includes('--json');
  const outFile = readStringOption(args, '--out', '');
  const files = positionalArgs(args);
  if (!files.length) {
    console.error('Usage: node VR-IFC/converter/audit.js <file.ifc|file.vrifc.json[.gz]> [more files] [--max-elements 100000] [--json] [--out report.json]');
    process.exitCode = 1;
    return;
  }

  const rows = files.map((file) => auditOne(resolveInput(file), { maxElements, overviewMode }));
  const report = {
    schema: 'vr-ifc-audit-v1',
    generatedAt: new Date().toISOString(),
    maxElements,
    overviewMode,
    files: rows,
    comparison: compareRows(rows)
  };

  if (outFile) {
    fs.writeFileSync(resolveOutput(outFile), JSON.stringify(report, null, 2));
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReport(report);
  if (outFile) console.log(`\nWrote ${outFile}`);
}

function auditOne(input, options) {
  const started = Date.now();
  const sourceName = path.basename(input);
  const result = isVRIFCPath(input)
    ? { doc: readVRIFCDoc(input), stats: null }
    : convertIfcTextToVRIFC(fs.readFileSync(input, 'utf8'), {
      sourceName,
      projectName: sourceName.replace(/\.[^.]+$/, ''),
      maxElements: options.maxElements,
      overviewMode: options.overviewMode
    });
  const q = result.doc.qualityReport || {};
  const audit = q.geometryAudit || {};
  const bounds = result.stats?.runtimeBounds?.size || result.doc.bounds?.size || [0, 0, 0];
  return {
    file: path.relative(root, input).replace(/\\/g, '/'),
    seconds: round((Date.now() - started) / 1000, 2),
    products: result.stats?.productCount || q.summary?.products || result.doc.elements?.length || 0,
    elements: q.summary?.elements || result.doc.elements?.length || 0,
    geometries: audit.summary?.geometries || result.doc.geometries?.length || 0,
    score: q.summary?.score || 0,
    bounds,
    medianElementMaxDim: result.doc.sceneHints?.medianElementMaxDim || 0,
    geometrySources: q.geometrySources || {},
    classes: audit.classes || {},
    disciplines: q.disciplines || {},
    auditSummary: audit.summary || {},
    topTypes: topClassTypes(audit.byType || {}),
    topSources: topClassSources(audit.bySource || {}),
    topDisciplines: topClassSources(audit.byDiscipline || {}).map((item) => ({ discipline: item.source, classes: item.classes, total: item.total })),
    warnings: (q.warnings || []).map((warning) => `${warning.severity}:${warning.code}:${warning.count}`)
  };
}

function isVRIFCPath(file) {
  return /\.vrifc\.json(?:\.gz)?$/i.test(file);
}

function readVRIFCDoc(file) {
  const bytes = fs.readFileSync(file);
  const text = /\.gz$/i.test(file) ? zlib.gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
  return JSON.parse(text);
}

function compareRows(rows) {
  if (rows.length < 2) return {};
  const out = {};
  for (const row of rows) {
    out[row.file] = {
      surfaceOnlyRatio: ratio(row.classes['surface-only'], row.elements),
      thinSurfaceMepRatio: ratio(row.classes['thin-surface-mep'], row.elements),
      surfaceMeshRatio: ratio(row.classes['surface-mesh'], row.elements),
      mepNodeRatio: ratio(row.classes['mep-node'], row.elements),
      boxMepRatio: ratio(row.classes['box-mep'], row.elements),
      linearMepCandidateRatio: ratio(row.auditSummary.linearMepCandidates, row.elements),
      mappedRatio: ratio(row.auditSummary.mappedElements, row.elements),
      geometryReuse: ratio(row.elements, row.geometries),
      thinAxisMedian: row.auditSummary.thinAxisMedian || 0
    };
  }
  return out;
}

function printReport(report) {
  console.log('VR-IFC geometry audit');
  console.log(`Max elements: ${report.maxElements}`);
  console.log(`Overview mode: ${report.overviewMode}`);
  console.log('');
  for (const row of report.files) {
    console.log(row.file);
    console.log(`  score/elements: ${row.score} / ${row.elements}`);
    console.log(`  bounds: ${row.bounds.join(' x ')} m`);
    console.log(`  median element max dim: ${row.medianElementMaxDim} m`);
    console.log(`  classes: ${formatCounts(row.classes)}`);
    console.log(`  disciplines: ${formatCounts(row.disciplines)}`);
    console.log(`  audit: mapped=${row.auditSummary.mappedElements || 0}, profiles=${row.auditSummary.profileElements || 0}, solids=${row.auditSummary.solidElements || 0}, linear-mep-candidates=${row.auditSummary.linearMepCandidates || 0}`);
    console.log(`  thin axis p10/median/p90: ${row.auditSummary.thinAxisP10 || 0} / ${row.auditSummary.thinAxisMedian || 0} / ${row.auditSummary.thinAxisP90 || 0} m`);
    console.log(`  visual inflation: geometries=${row.auditSummary.visuallyInflatedGeometries || 0}, local-prisms=${row.auditSummary.localBoxPrismGeometries || 0}`);
    console.log(`  top types: ${row.topTypes.map(formatTypeClass).join('; ') || '-'}`);
    console.log(`  top sources: ${row.topSources.map(formatSourceClass).join('; ') || '-'}`);
    console.log(`  top disciplines: ${row.topDisciplines.map(formatDisciplineClass).join('; ') || '-'}`);
    console.log(`  warnings: ${row.warnings.join(', ') || '-'}`);
    console.log('');
  }
  if (Object.keys(report.comparison || {}).length) {
    console.log('Comparison signals');
    for (const [file, item] of Object.entries(report.comparison)) {
      console.log(`  ${file}: linear-mep=${percent(item.linearMepCandidateRatio)}, mep-node=${percent(item.mepNodeRatio)}, box-mep=${percent(item.boxMepRatio)}, thin-surface-mep=${percent(item.thinSurfaceMepRatio)}, surface-mesh=${percent(item.surfaceMeshRatio)}, mapped=${percent(item.mappedRatio)}, reuse=${round(item.geometryReuse, 2)}x, thin-median=${item.thinAxisMedian} m`);
    }
  }
}

function topClassTypes(byType) {
  return Object.entries(byType)
    .map(([type, classes]) => ({ type, classes, total: sumValues(classes) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

function topClassSources(bySource) {
  return Object.entries(bySource)
    .map(([source, classes]) => ({ source, classes, total: sumValues(classes) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

function formatTypeClass(item) {
  return `${item.type}:${item.total} (${formatCounts(item.classes)})`;
}

function formatSourceClass(item) {
  return `${item.source}:${item.total} (${formatCounts(item.classes)})`;
}

function formatDisciplineClass(item) {
  return `${item.discipline}:${item.total} (${formatCounts(item.classes)})`;
}

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}:${value}`)
    .join(', ') || '-';
}

function resolveInput(file) {
  return path.isAbsolute(file) ? file : path.resolve(root, file);
}

function resolveOutput(file) {
  return path.isAbsolute(file) ? file : path.resolve(root, file);
}

function positionalArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (['--max-elements', '--overview', '--out'].includes(arg)) i++;
      continue;
    }
    out.push(arg);
  }
  return out;
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

function sumValues(input) {
  return Object.values(input || {}).reduce((sum, value) => sum + value, 0);
}

function ratio(value, total) {
  return total ? (value || 0) / total : 0;
}

function percent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

main();
