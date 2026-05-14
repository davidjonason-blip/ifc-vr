#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = path.resolve(__dirname, '..', '..');

const PRODUCT_PREFIXES = [
  'IFCFLOW',
  'IFCPIPE',
  'IFCDUCT',
  'IFCCABLE',
  'IFCELECTRIC',
  'IFCAIR',
  'IFCDISTRIBUTION'
];

const PRODUCT_TYPES = new Set([
  'IFCBUILDINGELEMENTPROXY',
  'IFCBEAM',
  'IFCCOLUMN',
  'IFCCOVERING',
  'IFCCURTAINWALL',
  'IFCDOOR',
  'IFCFURNISHINGELEMENT',
  'IFCMEMBER',
  'IFCPLATE',
  'IFCRAILING',
  'IFCRAMP',
  'IFCRAMPFLIGHT',
  'IFCROOF',
  'IFCSLAB',
  'IFCSPACE',
  'IFCSTAIR',
  'IFCSTAIRFLIGHT',
  'IFCWALL',
  'IFCWALLSTANDARDCASE',
  'IFCWINDOW'
]);

const GEOMETRY_TYPES = new Set([
  'IFCFACETEDBREP',
  'IFCFACE',
  'IFCFACEBOUND',
  'IFCFACEOUTERBOUND',
  'IFCINDEXEDPOLYGONALFACE',
  'IFCPOLYGONALFACESET',
  'IFCPOLYLOOP',
  'IFCTRIANGULATEDFACESET',
  'IFCCARTESIANPOINT',
  'IFCCARTESIANPOINTLIST3D',
  'IFCMAPPEDITEM',
  'IFCSHAPEREPRESENTATION',
  'IFCPRODUCTDEFINITIONSHAPE'
]);

async function main() {
  const args = process.argv.slice(2);
  const input = positionalArgs(args)[0];
  const outFile = readStringOption(args, '--out', '');
  const json = args.includes('--json');

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }
  if (!input) {
    printHelp();
    process.exit(1);
  }

  const started = Date.now();
  const files = collectIfcFiles(resolveInput(input));
  const reports = [];
  for (const file of files) {
    reports.push(await scanIfcFile(file));
  }

  reports.sort((a, b) => b.bytes - a.bytes);
  const report = {
    schema: 'vr-ifc-project-inventory-v1',
    generatedAt: new Date().toISOString(),
    source: path.relative(root, resolveInput(input)).replace(/\\/g, '/'),
    totals: summarizeProject(reports),
    files: reports
  };

  if (outFile) fs.writeFileSync(resolveOutput(outFile), JSON.stringify(report, null, 2));
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report, (Date.now() - started) / 1000);
    if (outFile) console.log(`\nWrote ${outFile}`);
  }
}

async function scanIfcFile(file) {
  const stat = fs.statSync(file);
  const counts = {};
  const productCounts = {};
  const geometryCounts = {};
  let schema = '';
  let lines = 0;

  const stream = fs.createReadStream(file, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    lines++;
    if (!schema) {
      const match = line.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
      if (match) schema = match[1];
    }
    const entity = line.match(/^#\d+\s*=\s*(IFC[A-Z0-9_]+)\s*\(/i);
    if (!entity) continue;
    const type = entity[1].toUpperCase();
    counts[type] = (counts[type] || 0) + 1;
    if (isProductType(type)) productCounts[type] = (productCounts[type] || 0) + 1;
    if (GEOMETRY_TYPES.has(type)) geometryCounts[type] = (geometryCounts[type] || 0) + 1;
  }

  const productTotal = sumValues(productCounts);
  const geometryTotal = sumValues(geometryCounts);
  const discipline = inferDiscipline(file, productCounts);
  const strategy = recommendStrategy({ bytes: stat.size, productCounts, geometryCounts, productTotal, geometryTotal });

  return {
    file: path.relative(root, file).replace(/\\/g, '/'),
    name: path.basename(file),
    bytes: stat.size,
    mb: round(stat.size / 1048576, 1),
    schema: schema || '?',
    lines,
    discipline,
    productTotal,
    geometrySignalTotal: geometryTotal,
    risk: strategy.risk,
    recommendedStrategy: strategy.name,
    reason: strategy.reason,
    topProducts: topCounts(productCounts, 10),
    topGeometrySignals: topCounts(geometryCounts, 10),
    topEntities: topCounts(counts, 12)
  };
}

function recommendStrategy(input) {
  const { bytes, productCounts, geometryCounts, productTotal, geometryTotal } = input;
  const mb = bytes / 1048576;
  const mepProducts = countMatching(productCounts, (type) => isMepType(type));
  const brepSignals = (geometryCounts.IFCFACETEDBREP || 0) + (geometryCounts.IFCFACE || 0) + (geometryCounts.IFCPOLYLOOP || 0);
  const indexedFaces = geometryCounts.IFCINDEXEDPOLYGONALFACE || 0;
  const proxyProducts = productCounts.IFCBUILDINGELEMENTPROXY || 0;

  if (mb > 250 || brepSignals > 500000 || indexedFaces > 500000) {
    return {
      name: 'heavy-mesh-lod',
      risk: 'high',
      reason: 'Large file or very high face/BREP signal; convert separately and plan mesh simplification/LOD before full VR package.'
    };
  }
  if (mepProducts > Math.max(1000, productTotal * 0.45)) {
    return {
      name: 'mep-runtime',
      risk: mb > 100 ? 'medium' : 'low',
      reason: 'MEP product types dominate; use linear/compact runtime geometry and keep system metadata for filtering.'
    };
  }
  if (proxyProducts > productTotal * 0.35 && productTotal > 1000) {
    return {
      name: 'proxy-audit',
      risk: 'medium',
      reason: 'Many proxy elements; audit visual quality before trusting semantic filters.'
    };
  }
  if (geometryTotal > 100000 || mb > 80) {
    return {
      name: 'separate-model',
      risk: 'medium',
      reason: 'Model is sizeable; convert as its own VRIFC file and include through project manifest.'
    };
  }
  return {
    name: 'standard',
    risk: 'low',
    reason: 'No large geometry or MEP-heavy signal detected; standard conversion should be a reasonable first pass.'
  };
}

function summarizeProject(files) {
  const byDiscipline = {};
  const byStrategy = {};
  const byRisk = {};
  let bytes = 0;
  let productTotal = 0;
  let geometrySignalTotal = 0;
  for (const file of files) {
    bytes += file.bytes;
    productTotal += file.productTotal;
    geometrySignalTotal += file.geometrySignalTotal;
    byDiscipline[file.discipline] = (byDiscipline[file.discipline] || 0) + 1;
    byStrategy[file.recommendedStrategy] = (byStrategy[file.recommendedStrategy] || 0) + 1;
    byRisk[file.risk] = (byRisk[file.risk] || 0) + 1;
  }
  return {
    files: files.length,
    bytes,
    mb: round(bytes / 1048576, 1),
    productTotal,
    geometrySignalTotal,
    byDiscipline,
    byStrategy,
    byRisk
  };
}

function printReport(report, seconds) {
  console.log('VR-IFC project inventory');
  console.log(`Source: ${report.source}`);
  console.log(`Files: ${report.totals.files}`);
  console.log(`Size: ${report.totals.mb} MB`);
  console.log(`Products: ${report.totals.productTotal}`);
  console.log(`Geometry signals: ${report.totals.geometrySignalTotal}`);
  console.log(`Disciplines: ${formatCounts(report.totals.byDiscipline)}`);
  console.log(`Strategies: ${formatCounts(report.totals.byStrategy)}`);
  console.log(`Risk: ${formatCounts(report.totals.byRisk)}`);
  console.log(`Scanned in ${round(seconds, 2)}s`);
  console.log('');
  console.log('Largest / highest-risk files');
  for (const file of report.files.slice(0, 15)) {
    console.log(`  ${file.name}  ${file.mb} MB  ${file.schema}  ${file.discipline}  ${file.recommendedStrategy}/${file.risk}`);
    console.log(`    products=${file.productTotal}, geometry=${file.geometrySignalTotal}`);
    console.log(`    top products: ${formatTop(file.topProducts)}`);
    console.log(`    reason: ${file.reason}`);
  }
}

function collectIfcFiles(input) {
  const stat = fs.statSync(input);
  if (stat.isFile()) return /\.ifc$/i.test(input) ? [input] : [];
  const out = [];
  for (const item of fs.readdirSync(input, { withFileTypes: true })) {
    const itemPath = path.join(input, item.name);
    if (item.isDirectory()) out.push(...collectIfcFiles(itemPath));
    else if (item.isFile() && /\.ifc$/i.test(item.name)) out.push(itemPath);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function inferDiscipline(file, productCounts) {
  const name = path.basename(file).toUpperCase();
  const prefix = name.match(/^([A-Z]+)\d*/)?.[1] || '';
  const mepProducts = countMatching(productCounts, (type) => isMepType(type));
  const structureProducts = countMatching(productCounts, (type) => ['IFCBEAM', 'IFCCOLUMN', 'IFCSLAB', 'IFCMEMBER', 'IFCPLATE'].includes(type));
  const architectureProducts = countMatching(productCounts, (type) => ['IFCWALL', 'IFCWALLSTANDARDCASE', 'IFCDOOR', 'IFCWINDOW', 'IFCSPACE', 'IFCFURNISHINGELEMENT', 'IFCCOVERING'].includes(type));

  if (mepProducts > Math.max(structureProducts, architectureProducts)) return 'mep';
  if (structureProducts > architectureProducts) return 'structure';
  if (architectureProducts > 0) return 'architecture';
  if (prefix.startsWith('K')) return 'structure';
  if (prefix.startsWith('A')) return 'architecture';
  if (['V', 'W', 'E', 'SP'].some((value) => prefix.startsWith(value))) return 'mep';
  return 'unknown';
}

function isProductType(type) {
  return PRODUCT_TYPES.has(type) || PRODUCT_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function isMepType(type) {
  return PRODUCT_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function countMatching(counts, predicate) {
  return Object.entries(counts || {}).reduce((sum, [type, count]) => sum + (predicate(type) ? count : 0), 0);
}

function topCounts(counts, limit) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ type, count }));
}

function formatTop(items) {
  return items.map((item) => `${item.type}:${item.count}`).join(', ') || '-';
}

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}:${value}`)
    .join(', ') || '-';
}

function sumValues(counts) {
  return Object.values(counts || {}).reduce((sum, value) => sum + value, 0);
}

function positionalArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (['--out'].includes(arg)) i++;
      continue;
    }
    out.push(arg);
  }
  return out;
}

function readStringOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) return fallback;
  return args[index + 1] || fallback;
}

function resolveInput(file) {
  return path.isAbsolute(file) ? file : path.resolve(root, file);
}

function resolveOutput(file) {
  return path.isAbsolute(file) ? file : path.resolve(root, file);
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function printHelp() {
  console.log(`Usage:
  node VR-IFC/converter/inventory.js <project-folder|file.ifc> [--json] [--out inventory.json]

Examples:
  node VR-IFC/converter/inventory.js "TEST IFCer/FASTIGHET"
  node VR-IFC/converter/inventory.js "TEST IFCer/FASTIGHET" --out VR-IFC/.scratch/fastighet.inventory.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
