#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { convertIfcTextToVRIFC } = require('./ifc-to-vrifc.js');

function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const input = parsed.positionals[0];
  const output = parsed.positionals[1] || defaultOutput(input);

  if (!input || input === '-h' || input === '--help') {
    printHelp();
    process.exit(input ? 0 : 1);
  }

  const maxElements = readNumberOption(args, '--max-elements', 50000);
  const overviewMode = readStringOption(args, '--overview', 'auto');
  const includeSpaces = !args.includes('--exclude-spaces') && !args.includes('--no-spaces');
  const sourceName = path.basename(input);
  const projectName = sourceName.replace(/\.[^.]+$/, '');

  const started = Date.now();
  const text = fs.readFileSync(input, 'utf8');
  const result = convertIfcTextToVRIFC(text, { sourceName, projectName, maxElements, overviewMode, includeSpaces });
  const pretty = args.includes('--pretty');
  const json = JSON.stringify(result.doc, null, pretty ? 2 : 0);
  writeJsonOutput(output, json, args.includes('--gzip'));
  const reportPath = readStringOption(args, '--report', '');
  if (reportPath) {
    fs.writeFileSync(reportPath, JSON.stringify(result.doc.qualityReport, null, 2));
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(2);
  const topTypes = Object.entries(result.stats.typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => `${type}:${count}`)
    .join(', ');

  console.log(`VR-IFC Converter v${result.doc.version}`);
  console.log(`Input: ${input}`);
  console.log(`Output: ${output}`);
  if (isGzipOutput(output, args.includes('--gzip'))) console.log('Compression: gzip');
  console.log(`Entities: ${result.stats.entityCount}`);
  console.log(`Products: ${result.stats.productCount}`);
  if (result.stats.excludedSpaceProducts) console.log(`IFCSPACE excluded: ${result.stats.excludedSpaceProducts}`);
  console.log(`Placements: ${result.stats.placementCount}`);
  console.log(`Representation elements: ${result.stats.representationCount}`);
  console.log(`Skipped no representation: ${result.stats.skippedNoRepresentation}`);
  console.log(`Geometry mode: ${result.doc.conversion.geometryMode}`);
  console.log(`Overview mode: ${result.doc.conversion.overviewMode}`);
  if (result.doc.qualityReport.summary.visualOverlayElements) {
    console.log(`Visual overlay elements: ${result.doc.qualityReport.summary.visualOverlayElements}`);
  }
  console.log(`Quality score: ${result.stats.qualityScore} (${result.doc.qualityReport.summary.level})`);
  console.log(`Bounds: ${result.stats.runtimeBounds.size.join(' x ')} m`);
  console.log(`Median element max dim: ${result.stats.medianElementMaxDim} m`);
  console.log(`Styled colors: ${result.stats.styledColorCount}`);
  console.log(`Scene hint: ${result.doc.sceneHints.overview}`);
  if (result.doc.sceneHints.visualMinThickness) {
    console.log(`Visual min thickness: ${result.doc.sceneHints.visualMinThickness} m`);
  }
  console.log(`Geometry sources: ${formatCounts(result.stats.geometrySources)}`);
  console.log(`Fallback reasons: ${formatCounts(result.stats.fallbackReasons)}`);
  console.log(`Skipped reasons: ${formatCounts(result.doc.qualityReport.summary.skippedByReason)}`);
  console.log(`Warnings: ${formatWarnings(result.stats.qualityWarnings)}`);
  console.log(`Top types: ${topTypes || '-'}`);
  console.log(`Done in ${elapsed}s`);
  if (!pretty) console.log('Output JSON: compact');
  if (reportPath) console.log(`Quality report: ${reportPath}`);
}

function parseArgs(args) {
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (['--max-elements', '--overview', '--report'].includes(arg)) i++;
      continue;
    }
    positionals.push(arg);
  }
  return { positionals };
}

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}:${value}`)
    .join(', ') || '-';
}

function defaultOutput(input) {
  if (!input) return 'model.vrifc.json';
  const parsed = path.parse(input);
  return path.join(parsed.dir, `${parsed.name}.vrifc.json`);
}

function writeJsonOutput(output, json, forceGzip) {
  if (isGzipOutput(output, forceGzip)) {
    fs.writeFileSync(output, zlib.gzipSync(json, { level: 9 }));
  } else {
    fs.writeFileSync(output, json);
  }
}

function isGzipOutput(output, forceGzip) {
  return forceGzip || /\.gz$/i.test(output);
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

function formatWarnings(warnings) {
  if (!warnings?.length) return '-';
  return warnings.map((warning) => `${warning.severity}:${warning.code}:${warning.count}`).join(', ');
}

function printHelp() {
  console.log(`Usage:
  node converter/cli.js input.ifc [output.vrifc.json|output.vrifc.json.gz] [--max-elements 50000] [--overview auto|hybrid|off|replace|force] [--report report.json] [--exclude-spaces] [--pretty] [--gzip]

Examples:
  node converter/cli.js "../TEST IFCer/Ifc4_SampleHouse.ifc"
  node converter/cli.js model.ifc model.vrifc.json --max-elements 100000 --report model.report.json`);
}

main();
