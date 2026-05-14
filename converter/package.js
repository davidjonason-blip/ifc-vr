#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { convertIfcTextToVRIFC, mergeVRIFCDocs } = require('./ifc-to-vrifc.js');
const { extractRenderBatchBinary } = require('./binary.js');

function main() {
  const args = process.argv.slice(2);
  const output = readStringOption(args, '--out', 'project.vrifc.json');
  const projectName = readStringOption(args, '--name', path.basename(output).replace(/\.vrifc\.json$/i, ''));
  const maxElements = readNumberOption(args, '--max-elements', 100000);
  const overviewMode = readStringOption(args, '--overview', 'auto');
  const pretty = args.includes('--pretty');
  const gzip = args.includes('--gzip');
  const reportPath = readStringOption(args, '--report', '');
  const recursive = args.includes('--recursive');
  const excludeExtremeBounds = args.includes('--exclude-extreme-bounds');
  const excludeSpatialOutliers = args.includes('--exclude-spatial-outliers');
  const includeSpaces = !args.includes('--exclude-spaces') && !args.includes('--no-spaces');
  const renderBatches = !args.includes('--no-render-batches');
  const binaryRenderBatches = args.includes('--binary-render-batches');
  const renderBatchThreshold = readNumberOption(args, '--render-batch-threshold', undefined);
  const inputs = expandInputPaths(positionalArgs(args), { recursive });

  if (!inputs.length || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(inputs.length ? 0 : 1);
  }

  const converted = inputs.map((input) => {
    const text = fs.readFileSync(input, 'utf8');
    const sourceName = path.basename(input);
    const result = convertIfcTextToVRIFC(text, {
      sourceName,
      projectName: sourceName.replace(/\.[^.]+$/, ''),
      maxElements,
      overviewMode,
      includeSpaces
    });
    return { name: sourceName, doc: result.doc, stats: result.stats };
  });

  let doc = mergeVRIFCDocs(converted, { projectName, excludeExtremeBounds, excludeSpatialOutliers, renderBatches, renderBatchThreshold });
  let binaryPath = '';
  if (binaryRenderBatches) {
    binaryPath = binaryPathForOutput(output);
    const extracted = extractRenderBatchBinary(doc, { uri: path.basename(binaryPath) });
    doc = extracted.doc;
    fs.writeFileSync(binaryPath, extracted.binary);
  }
  const json = JSON.stringify(doc, null, pretty ? 2 : 0);
  writeJsonOutput(output, json, gzip);
  if (reportPath) {
    fs.writeFileSync(reportPath, JSON.stringify(doc.qualityReport, null, 2));
  }

  console.log(`VR-IFC Package v${doc.version}`);
  console.log(`Output: ${output}`);
  if (isGzipOutput(output, gzip)) console.log('Compression: gzip');
  console.log(`Files: ${converted.map((item) => item.name).join(', ')}`);
  console.log(`Elements: ${doc.qualityReport.summary.elements}`);
  const excludedSpaces = converted.reduce((sum, item) => sum + (item.doc.qualityReport?.summary?.excludedSpaceElements || 0), 0);
  if (excludedSpaces) console.log(`IFCSPACE excluded: ${excludedSpaces}`);
  console.log(`Geometries: ${doc.geometries.length}`);
  console.log(`Materials: ${doc.materials.length}`);
  console.log(`Quality score: ${doc.qualityReport.summary.score} (${doc.qualityReport.summary.level})`);
  console.log(`Model reports: ${doc.qualityReport.summary.modelReports || doc.qualityReport.models?.length || 0}`);
  console.log(`Render batches: ${doc.qualityReport.summary.renderBatches || 0}`);
  if (binaryPath) console.log(`Binary geometry: ${binaryPath}`);
  console.log(`Excluded models: ${doc.qualityReport.summary.excludedSourceFiles || 0}`);
  console.log(`Spatial outliers: ${doc.qualityReport.summary.spatialOutlierElements || 0}`);
  console.log(`Bounds: ${doc.bounds.size.join(' x ')} m`);
  console.log(`Fallback reasons: ${formatCounts(doc.qualityReport.fallbackReasons)}`);
  console.log(`Warnings: ${formatWarnings(doc.qualityReport.warnings)}`);
  if (reportPath) console.log(`Quality report: ${reportPath}`);
}

function expandInputPaths(inputs, { recursive = false } = {}) {
  const expanded = [];
  for (const input of inputs) {
    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
      expanded.push(...collectIfcFiles(input, { recursive }));
    } else {
      expanded.push(input);
    }
  }
  if (!expanded.length) {
    throw new Error('No IFC files found for package input.');
  }
  return expanded;
}

function collectIfcFiles(dir, { recursive = false } = {}) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...collectIfcFiles(fullPath, { recursive }));
    } else if (entry.isFile() && /\.ifc$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function positionalArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
    if (['--out', '--name', '--max-elements', '--overview', '--report', '--render-batch-threshold'].includes(arg)) i++;
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

function formatCounts(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, value]) => `${key}:${value}`)
    .join(', ') || '-';
}

function formatWarnings(warnings) {
  if (!warnings?.length) return '-';
  return warnings.map((warning) => `${warning.severity}:${warning.code}:${warning.count}`).join(', ');
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

function binaryPathForOutput(output) {
  if (/\.vrifc\.json\.gz$/i.test(output)) return output.replace(/\.vrifc\.json\.gz$/i, '.geometry.bin');
  if (/\.vrifc\.json$/i.test(output)) return output.replace(/\.vrifc\.json$/i, '.geometry.bin');
  if (/\.json\.gz$/i.test(output)) return output.replace(/\.json\.gz$/i, '.geometry.bin');
  if (/\.json$/i.test(output)) return output.replace(/\.json$/i, '.geometry.bin');
  return `${output}.geometry.bin`;
}

function printHelp() {
  console.log(`Usage:
  node converter/package.js model-a.ifc model-b.ifc --out project.vrifc.json[.gz] [--name "Project"] [--max-elements 100000] [--overview auto|hybrid|off|replace|force] [--report report.json] [--recursive] [--exclude-spaces] [--exclude-extreme-bounds] [--exclude-spatial-outliers] [--no-render-batches] [--binary-render-batches] [--render-batch-threshold 18000] [--pretty] [--gzip]

Example:
  node converter/package.js "../TEST IFCer/W150-V-test.ifc" "../TEST IFCer/V157-V-test.ifc" --out samples/W150-V157.package.vrifc.json --name "W150 + V157" --report samples/W150-V157.report.json`);
}

main();
