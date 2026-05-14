(function attachConverter(global) {
  'use strict';

  const VERSION = '0.0.1';
  const LARGE_THIN_MEP_OVERVIEW_THICKNESS_M = 0.75;
  const LARGE_THIN_MEP_RAW_THICKNESS_M = 0.12;
  const PRODUCT_TYPES = new Set([
    'IFCBUILDINGELEMENTPROXY',
    'IFCCOLUMN',
    'IFCCURTAINWALL',
    'IFCDOOR',
    'IFCAIRTERMINAL',
    'IFCCABLECARRIERFITTING',
    'IFCCABLECARRIERSEGMENT',
    'IFCDUCTFITTING',
    'IFCDUCTSEGMENT',
    'IFCDUCTSILENCER',
    'IFCELECTRICAPPLIANCE',
    'IFCELECTRICDISTRIBUTIONBOARD',
    'IFCFLOWCONTROLLER',
    'IFCFLOWFITTING',
    'IFCFLOWMETER',
    'IFCFLOWSEGMENT',
    'IFCFLOWTERMINAL',
    'IFCFLOWTREATMENTDEVICE',
    'IFCMEMBER',
    'IFCPIPEFITTING',
    'IFCPIPESEGMENT',
    'IFCPLATE',
    'IFCRAILING',
    'IFCROOF',
    'IFCSLAB',
    'IFCSPACE',
    'IFCSTAIR',
    'IFCWALL',
    'IFCWALLSTANDARDCASE',
    'IFCWINDOW'
  ]);

  const TYPE_CONFIG = {
    IFCWALL: { geometry: 'proxy-wall', material: 'concrete', size: [4.8, 2.8, 0.24] },
    IFCWALLSTANDARDCASE: { geometry: 'proxy-wall', material: 'concrete', size: [4.8, 2.8, 0.24] },
    IFCSLAB: { geometry: 'proxy-slab', material: 'concrete', size: [4.8, 0.28, 4.8] },
    IFCCOLUMN: { geometry: 'proxy-column', material: 'steel', size: [0.36, 3.0, 0.36] },
    IFCMEMBER: { geometry: 'proxy-member', material: 'steel', size: [2.4, 0.22, 0.22] },
    IFCPLATE: { geometry: 'proxy-plate', material: 'glass', size: [1.4, 1.2, 0.08] },
    IFCWINDOW: { geometry: 'proxy-window', material: 'glass', size: [1.4, 1.2, 0.08] },
    IFCDOOR: { geometry: 'proxy-door', material: 'door', size: [1.0, 2.1, 0.12] },
    IFCSPACE: { geometry: 'proxy-space', material: 'space', size: [3.2, 2.7, 3.2] },
    IFCAIRTERMINAL: { geometry: 'proxy-terminal', material: 'return', size: [0.55, 0.2, 0.55] },
    IFCCABLECARRIERSEGMENT: { geometry: 'proxy-duct-long', material: 'steel', size: [2.4, 0.16, 0.16] },
    IFCCABLECARRIERFITTING: { geometry: 'proxy-duct-fitting', material: 'steel', size: [0.45, 0.22, 0.45] },
    IFCDUCTSEGMENT: { geometry: 'proxy-duct-long', material: 'supply', size: [3.0, 0.32, 0.32] },
    IFCDUCTFITTING: { geometry: 'proxy-duct-fitting', material: 'supply', size: [0.7, 0.5, 0.7] },
    IFCDUCTSILENCER: { geometry: 'proxy-duct-long', material: 'supply', size: [1.2, 0.5, 0.5] },
    IFCELECTRICAPPLIANCE: { geometry: 'proxy-controller', material: 'steel', size: [0.8, 0.6, 0.25] },
    IFCELECTRICDISTRIBUTIONBOARD: { geometry: 'proxy-controller', material: 'steel', size: [0.9, 0.9, 0.2] },
    IFCFLOWSEGMENT: { geometry: 'proxy-duct-long', material: 'supply', size: [3.0, 0.32, 0.32] },
    IFCFLOWFITTING: { geometry: 'proxy-duct-fitting', material: 'supply', size: [0.7, 0.5, 0.7] },
    IFCFLOWTERMINAL: { geometry: 'proxy-terminal', material: 'return', size: [0.55, 0.2, 0.55] },
    IFCFLOWCONTROLLER: { geometry: 'proxy-controller', material: 'return', size: [0.8, 0.8, 0.8] },
    IFCFLOWMETER: { geometry: 'proxy-controller', material: 'return', size: [0.5, 0.5, 0.5] },
    IFCFLOWTREATMENTDEVICE: { geometry: 'proxy-controller', material: 'return', size: [1.2, 0.8, 0.8] },
    IFCPIPESEGMENT: { geometry: 'proxy-duct-long', material: 'supply', size: [3.0, 0.22, 0.22] },
    IFCPIPEFITTING: { geometry: 'proxy-duct-fitting', material: 'supply', size: [0.45, 0.34, 0.45] },
    IFCRAILING: { geometry: 'proxy-railing', material: 'steel', size: [2.6, 1.1, 0.12] },
    IFCSTAIR: { geometry: 'proxy-stair', material: 'concrete', size: [2.4, 1.2, 3.4] },
    IFCROOF: { geometry: 'proxy-roof', material: 'concrete', size: [4.8, 0.34, 4.8] },
    IFCCURTAINWALL: { geometry: 'proxy-curtainwall', material: 'glass', size: [4.0, 3.0, 0.12] },
    IFCBUILDINGELEMENTPROXY: { geometry: 'proxy-generic', material: 'default', size: [1.0, 1.0, 1.0] }
  };

  const MATERIALS = [
    { id: 'default', color: '#b7c6d8', roughness: 0.78, finishClass: 'generic', materialRole: 'generic' },
    { id: 'concrete', color: '#aeb9c8', roughness: 0.82, finishClass: 'mineral', materialRole: 'structure' },
    { id: 'steel', color: '#64748b', roughness: 0.58, metalness: 0.08, finishClass: 'metal', materialRole: 'structure' },
    { id: 'glass', color: '#67e8f9', roughness: 0.18, opacity: 0.42, finishClass: 'glass', materialRole: 'enclosure' },
    { id: 'door', color: '#c08457', roughness: 0.74, finishClass: 'wood', materialRole: 'opening' },
    { id: 'space', color: '#a78bfa', roughness: 0.8, opacity: 0.18, finishClass: 'space', materialRole: 'space' },
    { id: 'supply', color: '#38bdf8', roughness: 0.5, finishClass: 'mep', materialRole: 'air-supply' },
    { id: 'return', color: '#f59e0b', roughness: 0.5, finishClass: 'mep', materialRole: 'air-return' },
    { id: 'mep-pipe', color: '#2f7fc6', roughness: 0.56, finishClass: 'mep', materialRole: 'pipe' },
    { id: 'mep-duct', color: '#4f9d5f', roughness: 0.6, finishClass: 'mep', materialRole: 'duct' },
    { id: 'mep-cable-tray', color: '#8b929b', roughness: 0.66, finishClass: 'mep', materialRole: 'cable-tray' },
    { id: 'mep-terminal', color: '#5bb8a8', roughness: 0.54, finishClass: 'mep', materialRole: 'terminal' },
    { id: 'mep-equipment', color: '#c9923d', roughness: 0.62, finishClass: 'mep', materialRole: 'equipment' }
  ];
  const MESH_COORDINATE_PRECISION = 3;

  function convertIfcTextToVRIFC(text, options = {}) {
    const sourceName = options.sourceName || 'model.ifc';
    const maxElements = options.maxElements || 50000;
    const meshMode = options.meshMode !== false;
    const overviewMode = options.overviewMode || 'auto';
    const includeSpaces = options.includeSpaces !== false;
    const entities = parseStepEntities(text);
    const context = buildIfcContext(entities);
    const allProducts = entities.filter((entity) => PRODUCT_TYPES.has(entity.type));
    const excludedSpaceProducts = includeSpaces ? [] : allProducts.filter((entity) => entity.type === 'IFCSPACE');
    const products = allProducts
      .filter((entity) => includeSpaces || entity.type !== 'IFCSPACE')
      .slice(0, maxElements);
    const typeCounts = countBy(products, (entity) => entity.type);

    const elements = [];
    const skippedProducts = [];
    products.forEach((entity, index) => {
      const element = productToElement(entity, index, context, { meshMode });
      if (element) elements.push(element);
      else skippedProducts.push(describeSkippedProduct(entity, context));
    });
    const geometries = buildGeometryDefs(elements);
    const materials = buildMaterialDefs(elements);
    const sourceRuntimeStats = computeRuntimeStats(elements, geometries);
    const wantsReplaceOverview = overviewMode === 'force' || overviewMode === 'replace';
    const wantsHybridOverview = overviewMode === 'hybrid';
    const hasMepRuntimeCandidates = hasLinearMepRuntimeCandidates(elements, geometries, context.unitScale);
    const shouldApplyMepRuntime = (sourceRuntimeStats.sceneHints.largeThinMep || hasMepRuntimeCandidates) && overviewMode !== 'off';
    const shouldApplyOverview = sourceRuntimeStats.sceneHints.largeThinMep && wantsReplaceOverview;
    const shouldBuildOverviewOverlay = sourceRuntimeStats.sceneHints.largeThinMep && wantsHybridOverview;
    const linearMepRuntimeCount = shouldApplyMepRuntime
      ? applyLinearMepRuntime(elements, geometries, context.unitScale, LARGE_THIN_MEP_RAW_THICKNESS_M)
      : 0;
    const mepNodeRuntimeCount = shouldApplyMepRuntime
      ? applyMepNodeRuntime(elements, geometries, context.unitScale, LARGE_THIN_MEP_RAW_THICKNESS_M)
      : 0;
    const boxMepRuntimeCount = shouldApplyMepRuntime
      ? applyBoxMepRuntime(elements, geometries, context.unitScale, LARGE_THIN_MEP_RAW_THICKNESS_M)
      : 0;
    if (linearMepRuntimeCount || mepNodeRuntimeCount || boxMepRuntimeCount) pruneUnusedGeometries(elements, geometries);
    const visualMinThickness = (shouldApplyOverview || shouldBuildOverviewOverlay) ? LARGE_THIN_MEP_OVERVIEW_THICKNESS_M : 0;
    const shouldEnhanceRawThinMep = sourceRuntimeStats.sceneHints.largeThinMep && !shouldApplyOverview && overviewMode !== 'off';
    const rawVisualMinThickness = shouldEnhanceRawThinMep ? LARGE_THIN_MEP_RAW_THICKNESS_M : 0;
    const rawEnhancedGeometryCount = rawVisualMinThickness
      ? inflateThinGeometries(geometries, rawVisualMinThickness, context.unitScale)
      : 0;
    const visualOverlays = [];
    if (shouldApplyOverview) {
      convertLargeThinMepToOverviewBoxes(elements, geometries, visualMinThickness);
    } else if (shouldBuildOverviewOverlay) {
      visualOverlays.push(buildLargeThinMepOverviewOverlay(elements, geometries, visualMinThickness));
    }
    const runtimeStats = computeRuntimeStats(elements, geometries);
    const representationCount = elements.filter((element) => element.properties.GeometrySource !== 'type-proxy').length;
    const geometrySources = countBy(elements, (element) => element.properties.GeometrySource);
    const qualityReport = buildQualityReport({
      products,
      elements,
      geometries,
      materials,
      runtimeStats,
      sourceRuntimeStats,
      skippedProducts,
      overviewMode,
      overviewApplied: shouldApplyOverview,
      visualOverlays,
      rawVisualMinThickness,
      rawEnhancedGeometryCount,
      linearMepRuntimeCount,
      mepNodeRuntimeCount,
      boxMepRuntimeCount,
      includeSpaces,
      excludedSpaceProducts: excludedSpaceProducts.length,
      unitScale: context.unitScale
    });
    const elementTable = buildElementTable(elements);
    const doc = {
      format: 'vr-ifc',
      version: VERSION,
      generator: 'VR-IFC Converter v0.0.1',
      units: 'm',
      axis: 'Y_UP',
      project: {
        name: options.projectName || sourceName.replace(/\.[^.]+$/, '')
      },
      source: {
        name: sourceName,
        kind: 'IFC',
        convertedAt: new Date().toISOString()
      },
      conversion: {
        geometryMode: elements.some((element) => element.properties.GeometrySource?.includes('mesh')) ? 'mesh-runtime' : (representationCount > 0 ? 'representation-bounds-box' : 'proxy-box'),
        placementMode: 'ifc-local-placement',
        sourceUnitScaleToMeters: context.unitScale,
        overviewMode,
        overviewStrategy: shouldApplyOverview ? 'replace' : (shouldBuildOverviewOverlay ? 'raw-enhanced-plus-overlay' : (rawEnhancedGeometryCount ? 'raw-enhanced' : 'none')),
        rawVisualMinThickness,
        rawEnhancedGeometryCount,
        linearMepRuntimeCount,
        mepNodeRuntimeCount,
        boxMepRuntimeCount,
        includeSpaces,
        excludedSpaceProducts: excludedSpaceProducts.length,
        note: 'v0.0.1 preserves IFC product identity and emits reusable meshes when available, with representation bounds/box proxies as fallback.'
      },
      bounds: runtimeStats.bounds,
      sceneHints: {
        tableTargetMeters: sourceRuntimeStats.sceneHints.tableTargetMeters,
        overview: sourceRuntimeStats.sceneHints.overview,
        medianElementMaxDim: sourceRuntimeStats.medianElementMaxDim,
        p90ElementMaxDim: sourceRuntimeStats.p90ElementMaxDim,
        largeThinMep: sourceRuntimeStats.sceneHints.largeThinMep,
        mepRuntime: shouldApplyMepRuntime,
        visualMinThickness,
        rawVisualMinThickness
      },
      materials,
      geometries,
      elements: [],
      elementTable,
      visualOverlays,
      qualityReport
    };

    return {
      sourceName,
      doc,
      stats: {
        entityCount: entities.length,
        productCount: products.length,
        sourceProductCount: allProducts.length,
        excludedSpaceProducts: excludedSpaceProducts.length,
        placementCount: context.localPlacements.size,
        representationCount,
        runtimeBounds: runtimeStats.bounds,
        medianElementMaxDim: sourceRuntimeStats.medianElementMaxDim,
        p90ElementMaxDim: sourceRuntimeStats.p90ElementMaxDim,
        geometrySources,
        fallbackReasons: qualityReport.fallbackReasons,
        qualityWarnings: qualityReport.warnings,
        qualityScore: qualityReport.summary.score,
        skippedNoRepresentation: skippedProducts.length,
        skippedProducts,
        styledColorCount: elements.filter((element) => element.properties.ExportColor && element.properties.ExportColor !== '-').length,
        typeCounts,
        truncated: products.length >= maxElements
      }
    };
  }

  function mergeVRIFCDocs(items, options = {}) {
    const projectName = options.projectName || 'VRIFC Project';
    const { includedItems, excludedModels } = splitPackageItems(items, options);
    items = includedItems;
    if (!items.length) {
      throw new Error('No VRIFC documents remained after package filters.');
    }
    const materials = [];
    const geometries = [];
    const elements = [];
    const visualOverlays = [];
    const files = [];
    const bounds = emptyBBox();
    let hasLargeThinMep = false;
    let tableTargetMeters = 4.5;
    let visualMinThickness = 0;
    let rawVisualMinThickness = 0;
    let medianElementMaxDim = 0;
    let p90ElementMaxDim = 0;

    items.forEach((item, index) => {
      const doc = item.doc || item;
      const modelName = item.name || doc.source?.name || doc.project?.name || `model-${index + 1}`;
      validateVRIFCDoc(doc);
      files.push(modelName);

      const prefix = `m${index + 1}-${slugId(modelName)}`;
      const materialMap = new Map();
      const geometryMap = new Map();

      for (const material of doc.materials || []) {
        const sourceId = material.id || 'default';
        const id = `${prefix}-mat-${sourceId}`;
        materialMap.set(sourceId, id);
        materials.push({ ...material, id });
      }
      if (!materialMap.has('default')) {
        const id = `${prefix}-mat-default`;
        materialMap.set('default', id);
        materials.push({ id, color: '#b7c6d8', roughness: 0.78, metalness: 0.02, opacity: 1 });
      }

      for (const geometry of doc.geometries || []) {
        const id = `${prefix}-geo-${geometry.id}`;
        geometryMap.set(geometry.id, id);
        geometries.push({ ...geometry, id });
      }

      for (const element of expandElementTable(doc)) {
        const sourceGeometry = element.geometry || 'box';
        const sourceMaterial = element.material || 'default';
        elements.push({
          ...element,
          id: `${prefix}-el-${element.id}`,
          geometry: geometryMap.get(sourceGeometry) || sourceGeometry,
          material: materialMap.get(sourceMaterial) || materialMap.get('default') || sourceMaterial,
          source: { ...(element.source || {}), model: modelName },
          properties: { ...(element.properties || {}), SourceElementId: element.id, Model: modelName }
        });
      }

      for (const overlay of doc.visualOverlays || []) {
        const overlayGeometryMap = new Map();
        const overlayGeometries = [];
        for (const geometry of overlay.geometries || []) {
          const id = `${prefix}-overlay-${overlay.id || 'overlay'}-geo-${geometry.id}`;
          overlayGeometryMap.set(geometry.id, id);
          overlayGeometries.push({ ...geometry, id });
        }
        const overlayElements = (overlay.elements || []).map((element) => {
          const sourceGeometry = element.geometry || 'box';
          const sourceMaterial = element.material || 'default';
          return {
            ...element,
            id: `${prefix}-overlay-${element.id}`,
            geometry: overlayGeometryMap.get(sourceGeometry) || geometryMap.get(sourceGeometry) || sourceGeometry,
            material: materialMap.get(sourceMaterial) || materialMap.get('default') || sourceMaterial,
            source: { ...(element.source || {}), model: modelName },
            properties: {
              ...(element.properties || {}),
              SourceElementId: element.properties?.SourceElementId ? `${prefix}-el-${element.properties.SourceElementId}` : element.properties?.SourceElementId,
              Model: modelName
            }
          };
        });
        const overlayInstances = (overlay.instances || []).map((instance) => {
          const copy = instance.slice();
          copy[0] = `${prefix}-overlay-${copy[0]}`;
          copy[3] = overlayGeometryMap.get(copy[3]) || geometryMap.get(copy[3]) || copy[3];
          copy[4] = materialMap.get(copy[4]) || materialMap.get('default') || copy[4];
          copy[8] = copy[8] ? `${prefix}-el-${copy[8]}` : copy[8];
          return copy;
        });
        visualOverlays.push({
          ...overlay,
          id: `${prefix}-${overlay.id || 'overlay'}`,
          sourceModel: modelName,
          geometries: overlayGeometries,
          elements: overlayElements,
          instances: overlayInstances
        });
      }

      if (doc.bounds?.min && doc.bounds?.max) {
        expandBBox(bounds, doc.bounds.min);
        expandBBox(bounds, doc.bounds.max);
      }

      const hints = doc.sceneHints || {};
      hasLargeThinMep ||= Boolean(hints.largeThinMep || hints.overview === 'large-thin-mep' || hints.overview === 'multi-model-large-thin');
      tableTargetMeters = Math.max(tableTargetMeters, Number(hints.tableTargetMeters) || 0);
      visualMinThickness = Math.max(visualMinThickness, Number(hints.visualMinThickness) || 0);
      rawVisualMinThickness = Math.max(rawVisualMinThickness, Number(hints.rawVisualMinThickness) || 0);
      medianElementMaxDim = Math.max(medianElementMaxDim, Number(hints.medianElementMaxDim) || 0);
      p90ElementMaxDim = Math.max(p90ElementMaxDim, Number(hints.p90ElementMaxDim) || 0);
    });

    const spatialOutliers = options.excludeSpatialOutliers ? removeSpatialOutliers(elements) : [];
    if (spatialOutliers.length) pruneUnusedGeometries(elements, geometries);
    const runtimeStats = computeRuntimeStats(elements, geometries);
    const renderBatches = options.renderBatches === false ? [] : buildRenderBatches(elements, geometries, materials, {
      threshold: options.renderBatchThreshold
    });
    const qualityReport = buildMergedQualityReport(items, elements, runtimeStats, excludedModels, spatialOutliers, renderBatches, materials);
    return {
      format: 'vr-ifc',
      version: VERSION,
      generator: 'VR-IFC Converter Package v0.0.1',
      units: items[0]?.doc?.units || items[0]?.units || 'm',
      axis: items[0]?.doc?.axis || items[0]?.axis || 'Y_UP',
      project: { name: projectName },
      source: {
        name: projectName,
        kind: 'VRIFC-PACKAGE',
        files,
        packagedAt: new Date().toISOString()
      },
      conversion: {
        geometryMode: 'packaged-runtime',
        placementMode: 'shared-world-coordinates',
        note: 'Packaged from multiple separately converted VRIFC documents.'
      },
      bounds: bounds.valid ? {
        min: roundVector(bounds.min),
        max: roundVector(bounds.max),
        center: roundVector(bounds.max.map((value, axis) => (value + bounds.min[axis]) * 0.5)),
        size: roundVector(bounds.max.map((value, axis) => value - bounds.min[axis]))
      } : runtimeStats.bounds,
      sceneHints: {
        tableTargetMeters: hasLargeThinMep ? Math.max(tableTargetMeters, 32) : tableTargetMeters,
        overview: hasLargeThinMep ? 'multi-model-large-thin' : 'multi-model',
        medianElementMaxDim,
        p90ElementMaxDim,
        largeThinMep: hasLargeThinMep,
        visualMinThickness,
        rawVisualMinThickness
      },
      materials,
      geometries,
      renderBatches,
      elements: [],
      elementTable: buildElementTable(elements),
      visualOverlays,
      qualityReport
    };
  }

  function splitPackageItems(items, options = {}) {
    if (!options.excludeExtremeBounds) return { includedItems: items, excludedModels: [] };
    const includedItems = [];
    const excludedModels = [];
    items.forEach((item, index) => {
      const doc = item.doc || item;
      const name = item.name || doc.source?.name || doc.project?.name || `model-${index + 1}`;
      const bounds = doc.bounds?.min && doc.bounds?.max ? {
        min: roundVector(doc.bounds.min),
        max: roundVector(doc.bounds.max),
        center: roundVector(doc.bounds.center || doc.bounds.max.map((value, axis) => (value + doc.bounds.min[axis]) * 0.5)),
        size: roundVector(doc.bounds.size || doc.bounds.max.map((value, axis) => value - doc.bounds.min[axis]))
      } : null;
      if (hasExtremeBounds(bounds)) {
        excludedModels.push({
          name,
          sourceName: doc.source?.name || name,
          reason: 'extreme-bounds',
          elements: docElementCount(doc),
          bounds
        });
      } else {
        includedItems.push(item);
      }
    });
    return { includedItems, excludedModels };
  }

  function buildMergedQualityReport(items, elements, runtimeStats, excludedModels = [], spatialOutliers = [], renderBatches = [], materials = []) {
    const geometrySources = countBy(elements, (element) => element.properties?.GeometrySource || 'unknown');
    const fallbackReasons = countBy(elements, (element) => element.properties?.GeometryFallbackReason || 'unknown');
    const disciplines = countBy(elements, (element) => element.properties?.Discipline || disciplineForIfcType(element.type));
    const models = buildPackageModelReports(items, elements);
    const overviewCount = elements.filter((element) => element.properties?.GeometrySource?.includes('overview-box')).length;
    const representationCount = elements.filter((element) => element.properties?.GeometrySource !== 'type-proxy').length;
    const finalGeometryCount = Math.max(0, representationCount - overviewCount);
    const styledColorCount = elements.filter((element) => element.properties?.ExportColor && element.properties.ExportColor !== '-').length;
    const visualMaterialCount = elements.filter((element) => element.material && element.material !== 'default').length;
    const visualOverlayCount = items.reduce((sum, item) => {
      const doc = item.doc || item;
      return sum + (doc.visualOverlays || []).reduce((overlaySum, overlay) => overlaySum + overlayElementCount(overlay), 0);
    }, 0);
    const extremeBoundsModels = models.filter((model) => model.extremeBounds).map((model) => model.name);
    const geometryCoverage = ratio(finalGeometryCount, elements.length);
    const materialCoverage = ratio(styledColorCount, elements.length);
    const visualMaterialCoverage = ratio(visualMaterialCount, elements.length);
    const robust = computeRobustBounds(elements);
    const linearMepRuntimeCount = elements.filter((element) => element.properties?.GeometryRuntimeClass === 'linear-mep' || element.properties?.GeometrySource?.includes('linear-mep')).length;
    const mepNodeRuntimeCount = elements.filter((element) => element.properties?.GeometryRuntimeClass === 'mep-node' || element.properties?.GeometrySource?.includes('mep-node')).length;
    const boxMepRuntimeCount = elements.filter((element) => element.properties?.GeometryRuntimeClass === 'box-mep' || element.properties?.GeometrySource?.includes('box-mep')).length;
    const materialUsage = buildMaterialUsage(elements, materials);
    const sourceScores = items.map((item) => ({
      name: item.name || item.doc?.source?.name || item.doc?.project?.name || 'model',
      score: item.doc?.qualityReport?.summary?.score ?? null,
      level: item.doc?.qualityReport?.summary?.level ?? null
    }));
    const excludedSpaceElements = items.reduce((sum, item) => {
      const doc = item.doc || item;
      return sum + (doc.qualityReport?.summary?.excludedSpaceElements || 0);
    }, 0);

    return {
      summary: {
        score: Math.round(100 * (geometryCoverage * 0.6 + materialCoverage * 0.15 + visualMaterialCoverage * 0.1 + 0.15)),
        level: geometryCoverage >= 0.85 ? 'good' : (geometryCoverage >= 0.6 ? 'usable' : 'needs-work'),
        products: elements.length,
        elements: elements.length,
        sourceFiles: items.length,
        representationElements: representationCount,
        overviewFallbackElements: overviewCount,
        visualOverlayElements: visualOverlayCount,
        finalGeometryElements: finalGeometryCount,
        typeProxyElements: elements.length - representationCount,
        styledColorCount,
        visualMaterialCount,
        styledMaterialCoverage: roundNumber(materialCoverage),
        visualMaterialCoverage: roundNumber(visualMaterialCoverage),
        geometryCoverage: roundNumber(geometryCoverage),
        runtimeRepresentationCoverage: roundNumber(ratio(representationCount, elements.length)),
        overviewApplied: overviewCount > 0,
        visualOverlayApplied: visualOverlayCount > 0,
        linearMepRuntimeCount,
        mepNodeRuntimeCount,
        boxMepRuntimeCount,
        modelReports: models.length,
        excludedSourceFiles: excludedModels.length,
        excludedSpaceElements,
        spatialOutlierElements: spatialOutliers.length,
        renderBatches: renderBatches.length,
        renderBatchElements: renderBatches.reduce((sum, batch) => sum + (batch.source?.elements || 0), 0),
        renderBatchDrawObjects: renderBatches.reduce((sum, batch) => sum + (batch.source?.drawObjects || 0), 0),
        materialFinishClasses: materialUsage.finishClasses,
        materialRoles: materialUsage.roles
      },
      models,
      excludedModels,
      spatialOutliers,
      sourceScores,
      geometrySources,
      fallbackReasons,
      disciplines,
      bounds: {
        full: runtimeStats.bounds,
        robust: robust.bounds,
        outlierElements: robust.outlierElements
      },
      warnings: [
        ...(overviewCount ? [{
          code: 'package-contains-overview-fallback',
          severity: 'warn',
          count: overviewCount,
          message: 'Package contains overview fallback geometry from one or more source models.'
        }] : []),
        ...(visualOverlayCount ? [{
          code: 'package-contains-visual-overlay',
          severity: 'info',
          count: visualOverlayCount,
          message: 'Package contains separate visual overlay geometry while preserving source model elements.'
        }] : []),
        ...(linearMepRuntimeCount ? [{
          code: 'package-contains-linear-mep-runtime',
          severity: 'info',
          count: linearMepRuntimeCount,
          message: 'Package contains lightweight linear MEP runtime geometry from one or more source models.'
        }] : []),
        ...(mepNodeRuntimeCount ? [{
          code: 'package-contains-mep-node-runtime',
          severity: 'info',
          count: mepNodeRuntimeCount,
          message: 'Package contains lightweight compact MEP node runtime geometry from one or more source models.'
        }] : []),
        ...(boxMepRuntimeCount ? [{
          code: 'package-contains-box-mep-runtime',
          severity: 'info',
          count: boxMepRuntimeCount,
          message: 'Package contains lightweight local box MEP runtime geometry from one or more source models.'
        }] : []),
        ...(extremeBoundsModels.length ? [{
          code: 'package-model-extreme-bounds',
          severity: 'warn',
          count: extremeBoundsModels.length,
          models: extremeBoundsModels,
          message: 'One or more source models have extreme bounds and may need coordinate normalization or exclusion before VR framing.'
        }] : []),
        ...(excludedModels.length ? [{
          code: 'package-excluded-extreme-bounds',
          severity: 'warn',
          count: excludedModels.length,
          models: excludedModels.map((model) => model.name),
          message: 'One or more source models were excluded because their bounds are too large for reliable VR framing.'
        }] : []),
        ...(spatialOutliers.length ? [{
          code: 'package-excluded-spatial-outliers',
          severity: 'warn',
          count: spatialOutliers.length,
          models: uniqueSorted(spatialOutliers.map((outlier) => outlier.model)),
          message: 'One or more elements were excluded because they sit far outside the main project cluster.'
        }] : []),
        ...(excludedSpaceElements ? [{
          code: 'package-excluded-ifcspace',
          severity: 'info',
          count: excludedSpaceElements,
          message: 'Package source conversions excluded IFCSPACE products by converter option.'
        }] : []),
        ...(renderBatches.length ? [{
          code: 'package-contains-render-batches',
          severity: 'info',
          count: renderBatches.length,
          message: 'Package contains prebuilt render batches for heavy detail mesh while preserving source elements.'
        }] : [])
      ]
    };
  }

  function removeSpatialOutliers(elements) {
    const outliers = identifySpatialOutliers(elements);
    if (!outliers.length) return [];
    const outlierIds = new Set(outliers.map((outlier) => outlier.id));
    for (let i = elements.length - 1; i >= 0; i--) {
      if (outlierIds.has(elements[i].id)) elements.splice(i, 1);
    }
    return outliers;
  }

  function identifySpatialOutliers(elements) {
    const robust = computeRobustBounds(elements);
    if (!robust.bounds) return [];
    const center = robust.bounds.center || [0, 0, 0];
    const size = robust.bounds.size || [0, 0, 0];
    const diagonal = Math.hypot(size[0] || 0, size[1] || 0, size[2] || 0);
    const threshold = Math.max(500, diagonal * 3);
    const outliers = [];
    for (const element of elements) {
      const point = elementCenter(element);
      if (!point) continue;
      const distance = Math.hypot(
        (point[0] || 0) - center[0],
        (point[1] || 0) - center[1],
        (point[2] || 0) - center[2]
      );
      if (distance > threshold) {
        outliers.push({
          id: element.id,
          sourceElementId: element.properties?.SourceElementId || element.id,
          name: element.name || element.id,
          type: element.type || '',
          model: element.properties?.Model || element.source?.model || '',
          center: roundVector(point),
          distance: roundNumber(distance),
          threshold: roundNumber(threshold),
          reason: 'outside-main-cluster'
        });
      }
    }
    return outliers;
  }

  function buildPackageModelReports(items, elements) {
    return items.map((item, index) => {
      const doc = item.doc || item;
      const name = item.name || doc.source?.name || doc.project?.name || `model-${index + 1}`;
      const modelElements = elements.filter((element) => element.properties?.Model === name || element.source?.model === name);
      const representationCount = modelElements.filter((element) => element.properties?.GeometrySource !== 'type-proxy').length;
      const overviewCount = modelElements.filter((element) => element.properties?.GeometrySource?.includes('overview-box')).length;
      const finalGeometryCount = Math.max(0, representationCount - overviewCount);
      const styledColorCount = modelElements.filter((element) => element.properties?.ExportColor && element.properties.ExportColor !== '-').length;
      const visualMaterialCount = modelElements.filter((element) => element.material && element.material !== 'default').length;
      const runtimeClasses = countBy(modelElements, (element) => element.properties?.GeometryRuntimeClass || runtimeClassForGeometrySource(element.properties?.GeometrySource));
      delete runtimeClasses.unknown;
      delete runtimeClasses[''];
      const bounds = doc.bounds?.min && doc.bounds?.max ? {
        min: roundVector(doc.bounds.min),
        max: roundVector(doc.bounds.max),
        center: roundVector(doc.bounds.center || doc.bounds.max.map((value, axis) => (value + doc.bounds.min[axis]) * 0.5)),
        size: roundVector(doc.bounds.size || doc.bounds.max.map((value, axis) => value - doc.bounds.min[axis]))
      } : null;
      return {
        name,
        sourceName: doc.source?.name || name,
        projectName: doc.project?.name || name,
        elements: modelElements.length,
        products: doc.qualityReport?.summary?.products ?? docElementCount(doc),
        representationElements: representationCount,
        finalGeometryElements: finalGeometryCount,
        typeProxyElements: modelElements.length - representationCount,
        overviewFallbackElements: overviewCount,
        styledColorCount,
        visualMaterialCount,
        geometryCoverage: roundNumber(ratio(finalGeometryCount, modelElements.length)),
        styledMaterialCoverage: roundNumber(ratio(styledColorCount, modelElements.length)),
        visualMaterialCoverage: roundNumber(ratio(visualMaterialCount, modelElements.length)),
        geometrySources: countBy(modelElements, (element) => element.properties?.GeometrySource || 'unknown'),
        fallbackReasons: countBy(modelElements, (element) => element.properties?.GeometryFallbackReason || 'unknown'),
        disciplines: countBy(modelElements, (element) => element.properties?.Discipline || disciplineForIfcType(element.type)),
        runtimeClasses,
        bounds,
        extremeBounds: hasExtremeBounds(bounds),
        score: doc.qualityReport?.summary?.score ?? null,
        level: doc.qualityReport?.summary?.level ?? null
      };
    });
  }

  function hasExtremeBounds(bounds) {
    const size = bounds?.size || [];
    const maxAxis = Math.max(...size.map((value) => Math.abs(Number(value) || 0)));
    return maxAxis > 5000;
  }

  function runtimeClassForGeometrySource(source) {
    const value = String(source || '');
    if (value.includes('linear-mep')) return 'linear-mep';
    if (value.includes('mep-node')) return 'mep-node';
    if (value.includes('box-mep')) return 'box-mep';
    if (value.includes('mesh')) return 'surface-mesh';
    return '';
  }

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function buildRenderBatches(elements, geometries, materials, options = {}) {
    const threshold = Number.isFinite(options.threshold) ? options.threshold : 18000;
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const materialMap = new Map((materials || []).map((material) => [material.id, material]));
    const detailed = elements.filter((element) => {
      const geometry = geometryMap.get(element.geometry);
      return geometry?.kind === 'mesh' && !isSpaceElement(element) && isDetailedMeshElement(element);
    });
    const drawObjectKeys = new Set(detailed.map(renderDrawObjectKey));
    if (drawObjectKeys.size < threshold) return [];

    const batches = [];
    const activeByMaterial = new Map();
    const maxVerticesPerBatch = 140000;
    for (const element of detailed) {
      const geometry = geometryMap.get(element.geometry);
      const vertexCount = Math.floor((geometry.positions || []).length / 3);
      if (!vertexCount) continue;
      const material = element.material || 'default';
      const materialKey = renderBatchMaterialSignature(materialMap.get(material) || { id: material });
      let builder = activeByMaterial.get(materialKey);
      if (!builder || builder.vertexCount + vertexCount > maxVerticesPerBatch) {
        builder = createRenderBatchBuilder(material, batches.length);
        batches.push(builder);
        activeByMaterial.set(materialKey, builder);
      }
      appendElementToRenderBatch(builder, element, geometry);
    }

    return batches
      .map(finalizeRenderBatch)
      .filter(Boolean);
  }

  function isDetailedMeshElement(element) {
    const runtimeClass = element.properties?.GeometryRuntimeClass || '';
    if (runtimeClass === 'surface-mesh') return true;
    if (runtimeClass) return false;
    return String(element.properties?.GeometrySource || '').includes('-mesh');
  }

  function isSpaceElement(element) {
    return String(element.type || element.properties?.IfcType || '').toUpperCase() === 'IFCSPACE'
      || element.properties?.Discipline === 'space';
  }

  function renderDrawObjectKey(element) {
    return [
      element.geometry || 'box',
      element.material || 'default',
      element.properties?.Model || element.source?.model || 'Modell',
      element.type || element.properties?.IfcType || '-',
      element.properties?.Discipline || disciplineForIfcType(element.type),
      elementSystemClass(element),
      element.properties?.GeometryRuntimeClass || runtimeClassForGeometrySource(element.properties?.GeometrySource),
      element.properties?.GeometrySource || ''
    ].join('|');
  }

  function elementSystemClass(element) {
    const type = String(element.type || element.properties?.IfcType || '').toUpperCase();
    if (type.includes('PIPE')) return 'mep-pipe';
    if (type.includes('DUCT') || type === 'IFCFLOWSEGMENT' || type === 'IFCFLOWFITTING') return 'mep-duct';
    if (type.includes('CABLE')) return 'mep-cable-tray';
    if (type.includes('TERMINAL') || type === 'IFCAIRTERMINAL') return 'mep-terminal';
    if (type.includes('ELECTRIC') || type.includes('CONTROLLER') || type.includes('METER') || type.includes('TREATMENT')) return 'mep-equipment';
    return '';
  }

  function createRenderBatchBuilder(material, index) {
    return {
      id: `render-batch-detail-${index + 1}`,
      kind: 'mesh-batch',
      material,
      positions: [],
      indices: [],
      vertexCount: 0,
      sourceDrawObjects: new Set(),
      sourceElements: 0,
      sourceGeometrySources: new Set(),
      sourceTypes: new Set(),
      sourceDisciplines: new Set(),
      sourceHasSpaces: false
    };
  }

  function renderBatchMaterialSignature(material) {
    return [
      material.color || '#b7c6d8',
      material.emissive || '',
      material.opacity ?? 1,
      material.metalness ?? 0,
      material.roughness ?? 1,
      material.side ?? ''
    ].join('|');
  }

  function appendElementToRenderBatch(builder, element, geometry) {
    const baseIndex = builder.vertexCount;
    const positions = geometry.positions || [];
    const matrix = elementTransformMatrix(element);
    for (let i = 0; i < positions.length; i += 3) {
      const point = applyMatrixToPoint(matrix, [positions[i], positions[i + 1], positions[i + 2]]);
      builder.positions.push(roundNumber(point[0]), roundNumber(point[1]), roundNumber(point[2]));
    }
    if (Array.isArray(geometry.indices) && geometry.indices.length) {
      for (const index of geometry.indices) builder.indices.push(baseIndex + index);
    } else {
      for (let index = 0; index < positions.length / 3; index++) builder.indices.push(baseIndex + index);
    }
    builder.vertexCount += positions.length / 3;
    builder.sourceElements++;
    builder.sourceDrawObjects.add(renderDrawObjectKey(element));
    builder.sourceGeometrySources.add(element.properties?.GeometrySource || 'unknown');
    builder.sourceTypes.add(element.type || element.properties?.IfcType || 'unknown');
    builder.sourceDisciplines.add(element.properties?.Discipline || disciplineForIfcType(element.type || element.properties?.IfcType));
    if (isSpaceElement(element)) builder.sourceHasSpaces = true;
  }

  function finalizeRenderBatch(builder) {
    if (!builder.vertexCount || !builder.indices.length) return null;
    return {
      id: builder.id,
      kind: builder.kind,
      material: builder.material,
      positions: builder.positions,
      indices: builder.indices,
      source: {
        role: 'detail-mesh-performance-batch',
        drawObjects: builder.sourceDrawObjects.size,
        elements: builder.sourceElements,
        geometrySources: uniqueSorted([...builder.sourceGeometrySources]),
        types: uniqueSorted([...builder.sourceTypes]),
        disciplines: uniqueSorted([...builder.sourceDisciplines]),
        hasSpaces: builder.sourceHasSpaces
      }
    };
  }

  function elementTransformMatrix(element) {
    if (Array.isArray(element.transform?.matrix) && element.transform.matrix.length === 16) {
      return element.transform.matrix;
    }
    const position = element.transform?.position || [0, 0, 0];
    return [
      1, 0, 0, position[0] || 0,
      0, 1, 0, position[1] || 0,
      0, 0, 1, position[2] || 0,
      0, 0, 0, 1
    ];
  }

  function buildElementTable(elements) {
    return {
      schema: 'compact-elements-v1',
      columns: [
        'id',
        'type',
        'name',
        'geometry',
        'material',
        'transformKind',
        'transform',
        'expressId',
        'globalId',
        'placementId',
        'objectType',
        'geometrySource',
        'geometryFallbackReason',
        'exportColor',
        'shapeRepresentation',
        'solid',
        'profile',
        'mappedItem',
        'representationMap',
        'model',
        'geometryRuntimeClass',
        'discipline'
      ],
      rows: elements.map((element) => [
        element.id,
        element.type || '',
        element.name || element.id,
        element.geometry,
        element.material || 'default',
        Array.isArray(element.transform?.matrix) ? 'm' : 'p',
        Array.isArray(element.transform?.matrix)
          ? element.transform.matrix
          : [
            ...(element.transform?.position || [0, 0, 0]),
            ...(element.transform?.rotation || [0, 0, 0])
          ],
        element.source?.expressId ?? '',
        element.source?.globalId || '',
        element.source?.placementId ?? '',
        propValue(element, 'ObjectType'),
        propValue(element, 'GeometrySource'),
        propValue(element, 'GeometryFallbackReason'),
        propValue(element, 'ExportColor'),
        propValue(element, 'ShapeRepresentation'),
        propValue(element, 'Solid'),
        propValue(element, 'Profile'),
        propValue(element, 'MappedItem'),
        propValue(element, 'RepresentationMap'),
        propValue(element, 'Model') || element.source?.model || '',
        propValue(element, 'GeometryRuntimeClass'),
        propValue(element, 'Discipline') || disciplineForIfcType(element.type)
      ])
    };
  }

  function expandElementTable(doc) {
    if (Array.isArray(doc?.elements) && doc.elements.length) return doc.elements;
    const table = doc?.elementTable;
    if (!table?.rows?.length) return [];
    return table.rows.map((row) => {
      const transform = row[5] === 'm'
        ? { matrix: row[6] || [] }
        : { position: (row[6] || []).slice(0, 3), rotation: (row[6] || []).slice(3, 6) };
      return {
        id: row[0],
        type: row[1],
        name: row[2],
        geometry: row[3],
        material: row[4],
        transform,
        source: {
          expressId: row[7],
          globalId: row[8],
          placementId: row[9]
        },
        properties: {
          ExpressId: String(row[7] || ''),
          GlobalId: row[8] || '',
          IfcType: row[1] || '',
          ObjectType: row[10] || '-',
          Placement: row[9] ? `#${row[9]}` : '-',
          GeometrySource: row[11] || 'unknown',
          GeometryFallbackReason: row[12] || 'unknown',
          ExportColor: row[13] || '-',
          ShapeRepresentation: row[14] || '-',
          Solid: row[15] || '-',
          Profile: row[16] || '-',
          MappedItem: row[17] || '-',
          RepresentationMap: row[18] || '-',
          Model: row[19] || '',
          GeometryRuntimeClass: row[20] || '',
          Discipline: row[21] || disciplineForIfcType(row[1])
        }
      };
    });
  }

  function docElementCount(doc) {
    return doc?.qualityReport?.summary?.elements
      || doc?.elements?.length
      || doc?.elementTable?.rows?.length
      || 0;
  }

  function propValue(element, key) {
    return element.properties?.[key] ?? '';
  }

  function validateVRIFCDoc(doc) {
    if (!doc || doc.format !== 'vr-ifc' || (!Array.isArray(doc.elements) && !Array.isArray(doc.elementTable?.rows)) || !Array.isArray(doc.geometries)) {
      throw new Error('Expected a VRIFC document.');
    }
  }

  function slugId(value) {
    return String(value || 'model')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'model';
  }

  function parseStepEntities(text) {
    const entities = [];
    const bodyStart = text.search(/\bDATA\s*;/i);
    const bodyEnd = bodyStart >= 0 ? text.slice(bodyStart).search(/\bENDSEC\s*;/i) : -1;
    const body = bodyStart >= 0
      ? text.slice(bodyStart, bodyEnd >= 0 ? bodyStart + bodyEnd : undefined)
      : text;

    const re = /#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*?)\)\s*;/gi;
    let match;
    while ((match = re.exec(body))) {
      const args = splitStepArgs(match[3]);
      entities.push({
        expressId: Number(match[1]),
        type: match[2].toUpperCase(),
        rawArgs: match[3],
        args
      });
    }
    return entities;
  }

  function splitStepArgs(input) {
    const args = [];
    let current = '';
    let depth = 0;
    let inString = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const next = input[i + 1];

      if (ch === "'") {
        current += ch;
        if (inString && next === "'") {
          current += next;
          i++;
        } else {
          inString = !inString;
        }
        continue;
      }

      if (!inString) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
      }

      current += ch;
    }

    if (current.trim() || input.endsWith(',')) args.push(current.trim());
    return args;
  }

  function buildGeometryDefs(elements) {
    const byId = new Map();
    for (const element of elements) {
      if (!byId.has(element.geometry)) {
        if (element.geometryDef) {
          byId.set(element.geometry, element.geometryDef);
        } else {
          byId.set(element.geometry, {
            id: element.geometry,
            kind: 'box',
            size: element.geometrySize
          });
        }
      }
      delete element.geometrySize;
      delete element.geometryDef;
    }
    return [...byId.values()];
  }

  function buildMaterialDefs(elements) {
    const materials = new Map(MATERIALS.map((material) => [material.id, material]));
    for (const element of elements) {
      if (!element.materialDef) continue;
      materials.set(element.materialDef.id, element.materialDef);
      delete element.materialDef;
    }
    return [...materials.values()];
  }

  function computeRuntimeStats(elements, geometries) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const bounds = emptyBBox();
    const maxDims = [];

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      const elementBox = elementWorldBounds(element, geometry);
      if (!elementBox.valid) continue;
      const elementSize = elementBox.max.map((value, index) => value - elementBox.min[index]);
      maxDims.push(Math.max(...elementSize));
      for (let i = 0; i < 3; i++) {
        bounds.min[i] = Math.min(bounds.min[i], elementBox.min[i]);
        bounds.max[i] = Math.max(bounds.max[i], elementBox.max[i]);
      }
      bounds.valid = true;
    }

    const size = bounds.valid
      ? roundVector(bounds.max.map((value, index) => value - bounds.min[index]))
      : [0, 0, 0];
    const center = bounds.valid
      ? roundVector(bounds.max.map((value, index) => (value + bounds.min[index]) * 0.5))
      : [0, 0, 0];

    maxDims.sort((a, b) => a - b);
    const medianElementMaxDim = percentile(maxDims, 0.5);
    const p90ElementMaxDim = percentile(maxDims, 0.9);
    const maxAxis = Math.max(...size, 1);
    const largeThinMep = maxAxis > 100 && medianElementMaxDim < 0.12;

    return {
      bounds: {
        min: bounds.valid ? roundVector(bounds.min) : [0, 0, 0],
        max: bounds.valid ? roundVector(bounds.max) : [0, 0, 0],
        center,
        size
      },
      medianElementMaxDim,
      p90ElementMaxDim,
      sceneHints: {
        largeThinMep,
        tableTargetMeters: largeThinMep ? 32 : 4.5,
        overview: largeThinMep ? 'large-thin-mep' : 'default'
      }
    };
  }

  function buildGeometryAudit(elements, geometries, unitScale = 1) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const classes = {};
    const byType = {};
    const bySource = {};
    const byDiscipline = {};
    const thinAxisMeters = [];
    let mappedElements = 0;
    let profileElements = 0;
    let solidElements = 0;
    let surfaceOnlyElements = 0;
    let thinSurfaceMepElements = 0;
    let mepNodeElements = 0;
    let boxMepElements = 0;
    let linearMepCandidates = 0;
    let visuallyInflatedGeometries = 0;
    let localBoxPrismGeometries = 0;

    for (const geometry of geometries) {
      if (geometry.visualInflation) {
        visuallyInflatedGeometries++;
        if (geometry.visualInflation.mode === 'local-bbox-prism') localBoxPrismGeometries++;
      }
    }

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      const source = element.properties?.GeometrySource || 'unknown';
      const type = element.type || 'unknown';
      const discipline = element.properties?.Discipline || disciplineForIfcType(type);
      const auditClass = classifyGeometryForAudit(element, geometry, unitScale);
      classes[auditClass] = (classes[auditClass] || 0) + 1;
      byType[type] ||= {};
      byType[type][auditClass] = (byType[type][auditClass] || 0) + 1;
      bySource[source] ||= {};
      bySource[source][auditClass] = (bySource[source][auditClass] || 0) + 1;
      byDiscipline[discipline] ||= {};
      byDiscipline[discipline][auditClass] = (byDiscipline[discipline][auditClass] || 0) + 1;

      if (source.includes('mapped')) mappedElements++;
      if (propValue(element, 'Profile') !== '-') profileElements++;
      if (propValue(element, 'Solid') !== '-') solidElements++;
      if (auditClass === 'surface-only') surfaceOnlyElements++;
      if (auditClass === 'thin-surface-mep') thinSurfaceMepElements++;
      if (auditClass === 'mep-node') mepNodeElements++;
      if (auditClass === 'box-mep') boxMepElements++;
      if (isLinearMepCandidate(element, geometry, unitScale)) linearMepCandidates++;

      const sizeMeters = geometryLocalSizeMeters(geometry, unitScale);
      const positive = sizeMeters.filter((value) => value > 1e-6).sort((a, b) => a - b);
      if (positive.length) thinAxisMeters.push(positive[0]);
    }

    thinAxisMeters.sort((a, b) => a - b);
    return {
      schema: 'geometry-audit-v1',
      summary: {
        elements: elements.length,
        geometries: geometries.length,
        mappedElements,
        profileElements,
        solidElements,
        surfaceOnlyElements,
        thinSurfaceMepElements,
        mepNodeElements,
        boxMepElements,
        linearMepCandidates,
        visuallyInflatedGeometries,
        localBoxPrismGeometries,
        thinAxisP10: roundNumber(percentile(thinAxisMeters, 0.1)),
        thinAxisMedian: roundNumber(percentile(thinAxisMeters, 0.5)),
        thinAxisP90: roundNumber(percentile(thinAxisMeters, 0.9))
      },
      classes,
      byType,
      bySource,
      byDiscipline
    };
  }

  function classifyGeometryForAudit(element, geometry, unitScale) {
    const source = element.properties?.GeometrySource || '';
    if (!geometry) return 'missing';
    if (geometry.kind === 'linear-mep') return 'linear-mep';
    if (geometry.kind === 'mep-node') return 'mep-node';
    if (geometry.kind === 'mep-box') return 'box-mep';
    if (source === 'type-proxy') return 'type-proxy';
    if (source.includes('overview-box')) return 'debug-overlay';
    if (source.includes('extrude') || source.includes('brep') || source.includes('face-set')) return 'mesh';
    const size = geometryLocalSizeMeters(geometry, unitScale);
    const positive = size.filter((value) => value > 1e-6).sort((a, b) => a - b);
    if (source.includes('surface-model')) {
      if (isLinearMepCandidate(element, geometry, unitScale) || (positive.length && positive[0] < 0.1)) return 'thin-surface-mep';
      return 'surface-mesh';
    }

    if (positive.length && positive[0] < 0.01) return 'thin-surface-mep';
    return geometry.kind === 'mesh' ? 'mesh' : 'solid-proxy';
  }

  function isLinearMepCandidate(element, geometry, unitScale) {
    if (!geometry || !isMepRuntimeType(element.type)) return false;
    const size = geometryLocalSizeMeters(geometry, unitScale).sort((a, b) => b - a);
    if (size[0] <= 0) return false;
    return size[0] > Math.max(size[1], 1e-6) * 4;
  }

  function isMepRuntimeType(type) {
    const value = String(type || '').toUpperCase();
    return value.includes('FLOW')
      || value.includes('PIPE')
      || value.includes('DUCT')
      || value.includes('CABLE')
      || value.includes('ELECTRIC')
      || value.includes('AIR');
  }

  function geometryLocalSizeMeters(geometry, unitScale) {
    if (!geometry) return [0, 0, 0];
    if (geometry.kind === 'linear-mep') {
      const size = [geometry.radius * 2, geometry.radius * 2, geometry.radius * 2];
      size[geometry.axis || 0] = geometry.length || 0;
      return size.map((value) => Math.max(0, value) * unitScale);
    }
    if (geometry.kind === 'mep-node') {
      return (geometry.size || [0, 0, 0]).map((value) => Math.max(0, value) * unitScale);
    }
    if (geometry.kind === 'mep-box') {
      return (geometry.size || [0, 0, 0]).map((value) => Math.max(0, value) * unitScale);
    }
    if (geometry.kind === 'mesh') {
      const bbox = meshLocalBounds(geometry.positions || []);
      if (!bbox.valid) return [0, 0, 0];
      return bbox.max.map((value, index) => Math.max(0, value - bbox.min[index]) * unitScale);
    }
    return (geometry.size || [0, 0, 0]).map((value) => Math.max(0, value));
  }

  function buildQualityReport(input) {
    const {
      products,
      elements,
      geometries,
      runtimeStats,
      sourceRuntimeStats,
      skippedProducts,
      overviewMode,
      overviewApplied,
      visualOverlays = [],
      rawVisualMinThickness = 0,
      rawEnhancedGeometryCount = 0,
      linearMepRuntimeCount = 0,
      mepNodeRuntimeCount = 0,
      boxMepRuntimeCount = 0,
      includeSpaces = true,
      excludedSpaceProducts = 0,
      unitScale = 1
    } = input;
    const geometrySources = countBy(elements, (element) => element.properties.GeometrySource || 'unknown');
    const fallbackReasons = countBy(elements, (element) => element.properties.GeometryFallbackReason || 'unknown');
    const disciplines = countBy(elements, (element) => element.properties?.Discipline || disciplineForIfcType(element.type));
    const skippedNoRepresentation = skippedProducts?.length || 0;
    const skippedByReason = countBy(skippedProducts || [], (item) => item.reason || 'skipped');
    for (const [reason, count] of Object.entries(skippedByReason)) {
      fallbackReasons[`skipped-${reason}`] = count;
    }

    const styledColorCount = elements.filter((element) => element.properties.ExportColor && element.properties.ExportColor !== '-').length;
    const visualMaterialCount = elements.filter((element) => element.material && element.material !== 'default').length;
    const representationCount = elements.filter((element) => element.properties.GeometrySource !== 'type-proxy').length;
    const overviewCount = elements.filter((element) => element.properties.GeometrySource?.includes('overview-box')).length;
    const visualOverlayCount = visualOverlays.reduce((sum, overlay) => sum + overlayElementCount(overlay), 0);
    const finalGeometryCount = Math.max(0, representationCount - overviewCount);
    const typeProxyCount = elements.length - representationCount;
    const materialCoverage = ratio(styledColorCount, elements.length);
    const visualMaterialCoverage = ratio(visualMaterialCount, elements.length);
    const geometryCoverage = ratio(finalGeometryCount, elements.length);
    const runtimeRepresentationCoverage = ratio(representationCount, elements.length);
    const robust = computeRobustBounds(elements);
    const geometryAudit = buildGeometryAudit(elements, geometries, unitScale);
    const materialUsage = buildMaterialUsage(elements, input.materials || []);
    const warnings = [];

    const aggregateSkipped = skippedByReason['aggregate-without-own-representation'] || 0;
    const otherSkipped = skippedNoRepresentation - aggregateSkipped;
    if (aggregateSkipped) {
      warnings.push({
        code: 'skipped-aggregate-containers',
        severity: 'info',
        count: aggregateSkipped,
        message: 'Aggregate products without their own representation were skipped; child elements are expected to carry renderable geometry.'
      });
    }
    if (otherSkipped) {
      warnings.push({
        code: 'skipped-no-product-representation',
        severity: 'warn',
        count: otherSkipped,
        message: 'Products without product representation were skipped instead of emitted as type proxies.'
      });
    }
    if (typeProxyCount) {
      warnings.push({
        code: 'type-proxy-fallback',
        severity: typeProxyCount / Math.max(elements.length, 1) > 0.1 ? 'warn' : 'info',
        count: typeProxyCount,
        message: 'Elements fell back to type-sized proxy boxes because no supported representation geometry was resolved.'
      });
    }
    if (overviewApplied) {
      warnings.push({
        code: 'large-thin-mep-overview',
        severity: 'warn',
        count: elements.length,
        message: 'Large thin MEP runtime was converted to overview boxes for readability; this is a debug fallback, not final geometry.'
      });
    }
    if (visualOverlayCount) {
      warnings.push({
        code: 'large-thin-mep-visual-overlay',
        severity: 'info',
        count: visualOverlayCount,
        message: 'Large thin MEP keeps final geometry and includes a separate overview overlay for readable inspection.'
      });
    }
    if (rawEnhancedGeometryCount) {
      warnings.push({
        code: 'large-thin-mep-raw-enhanced',
        severity: 'info',
        count: rawEnhancedGeometryCount,
        message: 'Large thin MEP raw mesh geometry was given a small visual minimum thickness for readability while preserving product identity.'
      });
    }
    if (linearMepRuntimeCount) {
      warnings.push({
        code: 'linear-mep-runtime',
        severity: 'info',
        count: linearMepRuntimeCount,
        message: 'Thin linear MEP surface meshes were converted to lightweight linear runtime geometry while preserving original product identity.'
      });
    }
    if (mepNodeRuntimeCount) {
      warnings.push({
        code: 'mep-node-runtime',
        severity: 'info',
        count: mepNodeRuntimeCount,
        message: 'Compact MEP fittings/controllers were converted to lightweight node runtime geometry while preserving original product identity.'
      });
    }
    if (boxMepRuntimeCount) {
      warnings.push({
        code: 'box-mep-runtime',
        severity: 'info',
        count: boxMepRuntimeCount,
        message: 'Thin non-linear MEP surface meshes were converted to local bbox runtime geometry while preserving original product identity.'
      });
    }
    if (excludedSpaceProducts) {
      warnings.push({
        code: 'ifcspace-excluded',
        severity: 'info',
        count: excludedSpaceProducts,
        message: 'IFCSPACE products were excluded by converter option.'
      });
    }
    if (robust.outlierElements > Math.max(20, elements.length * 0.01)) {
      warnings.push({
        code: 'spatial-outliers',
        severity: 'warn',
        count: robust.outlierElements,
        message: 'Element centers outside the 1-99 percentile robust bounds may make framing and scale harder to inspect.'
      });
    }
    if (sourceRuntimeStats.sceneHints.largeThinMep && overviewMode === 'off') {
      warnings.push({
        code: 'large-thin-mep-overview-disabled',
        severity: 'info',
        count: elements.length,
        message: 'Large thin MEP was detected, but overview conversion was disabled.'
      });
    }

    const score = Math.round(100 * (
      geometryCoverage * 0.55
      + materialCoverage * 0.15
      + visualMaterialCoverage * 0.1
      + ratio(elements.length, products.length) * 0.2
    ));

    return {
      summary: {
        score,
        level: score >= 85 ? 'good' : (score >= 65 ? 'usable' : 'needs-work'),
        products: products.length,
        sourceProducts: products.length + excludedSpaceProducts,
        includeSpaces,
        excludedSpaceElements: excludedSpaceProducts,
        elements: elements.length,
        skippedNoRepresentation,
        skippedProducts: (skippedProducts || []).slice(0, 40),
        skippedByReason,
        representationElements: representationCount,
        overviewFallbackElements: overviewCount,
        visualOverlayElements: visualOverlayCount,
        finalGeometryElements: finalGeometryCount,
        typeProxyElements: typeProxyCount,
        styledColorCount,
        visualMaterialCount,
        styledMaterialCoverage: roundNumber(materialCoverage),
        visualMaterialCoverage: roundNumber(visualMaterialCoverage),
        geometryCoverage: roundNumber(geometryCoverage),
        runtimeRepresentationCoverage: roundNumber(runtimeRepresentationCoverage),
        overviewMode,
        overviewApplied,
        visualOverlayApplied: visualOverlayCount > 0,
        rawVisualMinThickness,
        rawEnhancedGeometryCount,
        linearMepRuntimeCount,
        mepNodeRuntimeCount,
        boxMepRuntimeCount,
        materialFinishClasses: materialUsage.finishClasses,
        materialRoles: materialUsage.roles
      },
      geometrySources,
      fallbackReasons,
      disciplines,
      geometryAudit,
      bounds: {
        full: runtimeStats.bounds,
        robust: robust.bounds,
        outlierElements: robust.outlierElements
      },
      warnings
    };
  }

  function buildMaterialUsage(elements, materials) {
    const materialById = new Map((materials || []).map((material) => [material.id, material]));
    const finishClasses = {};
    const roles = {};
    for (const element of elements || []) {
      const material = materialById.get(element.material) || null;
      const finishClass = material?.finishClass || 'unknown';
      const role = material?.materialRole || 'unknown';
      finishClasses[finishClass] = (finishClasses[finishClass] || 0) + 1;
      roles[role] = (roles[role] || 0) + 1;
    }
    return {
      finishClasses: sortCountObject(finishClasses),
      roles: sortCountObject(roles)
    };
  }

  function sortCountObject(counts) {
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  }

  function overlayElementCount(overlay) {
    return overlay?.elements?.length || overlay?.instances?.length || 0;
  }

  function describeSkippedProduct(entity, context) {
    const pdsId = refId(entity.args[6]);
    const hasPlacement = Boolean(refId(entity.args[5]));
    const reason = pdsId ? 'empty-product-representation' : aggregateContainerReason(entity.type);
    return {
      expressId: entity.expressId,
      globalId: cleanStepString(entity.args[0]) || `#${entity.expressId}`,
      type: entity.type,
      name: cleanStepString(entity.args[2]) || `${entity.type} #${entity.expressId}`,
      objectType: cleanStepString(entity.args[4]) || '',
      productDefinitionShape: pdsId ? `#${pdsId}` : '-',
      hasPlacement,
      reason,
      note: skippedProductNote(reason)
    };
  }

  function aggregateContainerReason(type) {
    if (type === 'IFCCURTAINWALL' || type === 'IFCSTAIR') return 'aggregate-without-own-representation';
    return 'no-product-representation';
  }

  function skippedProductNote(reason) {
    if (reason === 'aggregate-without-own-representation') {
      return 'Likely an aggregate/container; child panels, members, or stair parts carry the renderable geometry.';
    }
    if (reason === 'empty-product-representation') {
      return 'Product points at an empty product definition shape.';
    }
    return 'No product definition shape was found on this product.';
  }

  function computeRobustBounds(elements) {
    const centers = [];
    for (const element of elements) {
      const center = elementCenter(element);
      if (center) centers.push(center);
    }

    if (centers.length < 100) {
      return {
        bounds: null,
        outlierElements: 0
      };
    }

    const min = [0, 1, 2].map((axis) => percentile(centers.map((center) => center[axis]).sort((a, b) => a - b), 0.01));
    const max = [0, 1, 2].map((axis) => percentile(centers.map((center) => center[axis]).sort((a, b) => a - b), 0.99));
    let outlierElements = 0;
    for (const center of centers) {
      if (center.some((value, axis) => value < min[axis] || value > max[axis])) outlierElements++;
    }

    return {
      bounds: {
        min: roundVector(min),
        max: roundVector(max),
        center: roundVector(max.map((value, index) => (value + min[index]) * 0.5)),
        size: roundVector(max.map((value, index) => value - min[index]))
      },
      outlierElements
    };
  }

  function elementCenter(element) {
    if (Array.isArray(element.transform?.matrix) && element.transform.matrix.length === 16) {
      return matrixTranslation(element.transform.matrix);
    }
    if (Array.isArray(element.transform?.position)) {
      return element.transform.position;
    }
    return null;
  }

  function ratio(value, total) {
    return total > 0 ? value / total : 0;
  }

  function elementWorldBounds(element, geometry) {
    if (!geometry) return emptyBBox();
    let localBox = emptyBBox();

    if (geometry.kind === 'mesh') {
      localBox = meshLocalBounds(geometry.positions || []);
    } else if (geometry.kind === 'linear-mep') {
      const size = [geometry.radius * 2, geometry.radius * 2, geometry.radius * 2];
      size[geometry.axis || 0] = geometry.length || 0;
      localBox = bboxFromCenterSize(geometry.center || [0, 0, 0], size);
    } else if (geometry.kind === 'mep-node') {
      localBox = bboxFromCenterSize(geometry.center || [0, 0, 0], geometry.size || [0, 0, 0]);
    } else if (geometry.kind === 'mep-box') {
      localBox = bboxFromCenterSize(geometry.center || [0, 0, 0], geometry.size || [0, 0, 0]);
    } else {
      const size = geometry.size || [0, 0, 0];
      localBox = bboxFromCenterSize([0, 0, 0], size);
    }

    if (Array.isArray(element.transform?.matrix)) {
      return transformBBox(localBox, element.transform.matrix);
    }

    const position = element.transform?.position || [0, 0, 0];
    return {
      min: localBox.min.map((value, index) => value + position[index]),
      max: localBox.max.map((value, index) => value + position[index]),
      valid: localBox.valid
    };
  }

  function meshLocalBounds(positions) {
    const bbox = emptyBBox();
    for (let i = 0; i < positions.length; i += 3) {
      expandBBox(bbox, [positions[i], positions[i + 1], positions[i + 2]]);
    }
    return bbox;
  }

  function inflateThinGeometries(geometries, minThickness, unitScale = 1) {
    let inflatedCount = 0;
    for (const geometry of geometries) {
      if (geometry.kind === 'mesh') {
        if (inflateThinMeshGeometry(geometry, minThickness, unitScale)) inflatedCount++;
      } else {
        const size = geometry.size || [0, 0, 0];
        const maxDim = Math.max(...size);
        if (maxDim <= 0 || maxDim < minThickness) continue;
        const nextSize = roundVector(size.map((value) => {
          if (value <= 0) return value;
          return Math.max(value, Math.min(minThickness, maxDim));
        }));
        if (nextSize.some((value, index) => value !== size[index])) inflatedCount++;
        geometry.size = nextSize;
      }
    }
    return inflatedCount;
  }

  function applyLinearMepRuntime(elements, geometries, unitScale, minThickness) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const linearGeometries = new Map();
    let converted = 0;

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      if (!isLinearMepCandidate(element, geometry, unitScale)) continue;
      const linear = linearMepGeometryFromMesh(geometry, unitScale, minThickness);
      if (!linear) continue;

      linearGeometries.set(linear.id, linear);
      element.geometry = linear.id;
      element.properties.GeometrySource = `${element.properties.GeometrySource || 'mesh'}-linear-mep`;
      element.properties.GeometryRuntimeClass = 'linear-mep';
      converted++;
    }

    for (const geometry of linearGeometries.values()) {
      if (!geometryMap.has(geometry.id)) {
        geometries.push(geometry);
        geometryMap.set(geometry.id, geometry);
      }
    }
    return converted;
  }

  function hasLinearMepRuntimeCandidates(elements, geometries, unitScale) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    let candidates = 0;
    for (const element of elements) {
      if (isLinearMepCandidate(element, geometryMap.get(element.geometry), unitScale)) {
        candidates++;
        if (candidates >= 20) return true;
      }
    }
    return false;
  }

  function applyBoxMepRuntime(elements, geometries, unitScale, minThickness) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const boxGeometries = new Map();
    let converted = 0;

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      if (!isThinMepBoxCandidate(element, geometry, unitScale)) continue;
      const box = boxMepGeometryFromMesh(geometry, unitScale, minThickness);
      if (!box) continue;

      boxGeometries.set(box.id, box);
      element.geometry = box.id;
      element.properties.GeometrySource = `${element.properties.GeometrySource || 'mesh'}-box-mep`;
      element.properties.GeometryRuntimeClass = 'box-mep';
      converted++;
    }

    for (const geometry of boxGeometries.values()) {
      if (!geometryMap.has(geometry.id)) {
        geometries.push(geometry);
        geometryMap.set(geometry.id, geometry);
      }
    }
    return converted;
  }

  function applyMepNodeRuntime(elements, geometries, unitScale, minThickness) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const nodeGeometries = new Map();
    let converted = 0;

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      if (!isCompactMepNodeCandidate(element, geometry, unitScale)) continue;
      const node = mepNodeGeometryFromMesh(element, geometry, unitScale, minThickness);
      if (!node) continue;

      nodeGeometries.set(node.id, node);
      element.geometry = node.id;
      element.properties.GeometrySource = `${element.properties.GeometrySource || 'mesh'}-mep-node`;
      element.properties.GeometryRuntimeClass = 'mep-node';
      converted++;
    }

    for (const geometry of nodeGeometries.values()) {
      if (!geometryMap.has(geometry.id)) {
        geometries.push(geometry);
        geometryMap.set(geometry.id, geometry);
      }
    }
    return converted;
  }

  function pruneUnusedGeometries(elements, geometries) {
    const used = new Set(elements.map((element) => element.geometry).filter(Boolean));
    for (let i = geometries.length - 1; i >= 0; i--) {
      if (!used.has(geometries[i].id)) geometries.splice(i, 1);
    }
  }

  function linearMepGeometryFromMesh(geometry, unitScale, minThickness) {
    if (!geometry || geometry.kind !== 'mesh') return null;
    const bbox = meshLocalBounds(geometry.positions || []);
    if (!bbox.valid) return null;

    const size = bbox.max.map((value, index) => Math.max(0, value - bbox.min[index]));
    const ranked = size.map((value, axis) => ({ value, axis })).sort((a, b) => b.value - a.value);
    const length = ranked[0]?.value || 0;
    if (length * unitScale < 0.2) return null;

    const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
    const cross = ranked.slice(1).map((item) => item.value * unitScale);
    const minRadiusMeters = Math.max((minThickness || 0.07) * 0.5, 0.035);
    const radiusMeters = clampNumber(Math.max(...cross, minRadiusMeters * 2) * 0.5, minRadiusMeters, 0.18);
    const targetLocal = minThickness / Math.max(unitScale, 1e-12);
    const normalizedSize = size.map((value) => Math.max(value, targetLocal));
    const crossSorted = cross.slice().sort((a, b) => a - b);
    const crossRatio = crossSorted[1] / Math.max(crossSorted[0], 1e-9);
    const profile = crossRatio >= 1.15 && crossSorted[1] >= 0.16 ? 'rect' : 'round';
    return {
      id: `linear-${profile}-${geometry.id}-${ranked[0].axis}-${Math.round(radiusMeters * 1000)}-${normalizedSize.map((value) => Math.round(value)).join('x')}`,
      kind: 'linear-mep',
      profile,
      axis: ranked[0].axis,
      center: roundVector(center),
      size: roundVector(normalizedSize),
      length: roundNumber(length),
      radius: roundNumber(radiusMeters / Math.max(unitScale, 1e-12))
    };
  }

  function isThinMepBoxCandidate(element, geometry, unitScale) {
    if (!geometry || geometry.kind !== 'mesh') return false;
    const source = element.properties?.GeometrySource || '';
    if (!source.includes('mesh') || source.includes('linear-mep') || source.includes('mep-node') || source.includes('box-mep')) return false;
    if (!isMepRuntimeType(element.type) && element.type !== 'IFCBUILDINGELEMENTPROXY') return false;
    const size = geometryLocalSizeMeters(geometry, unitScale);
    const positive = size.filter((value) => value > 1e-6).sort((a, b) => a - b);
    if (!positive.length) return false;
    const maxDim = Math.max(...size);
    return positive[0] < 0.1 && maxDim < 2.5;
  }

  function isCompactMepNodeCandidate(element, geometry, unitScale) {
    if (!isThinMepBoxCandidate(element, geometry, unitScale)) return false;
    const type = String(element.type || '').toUpperCase();
    if (!isMepNodeRuntimeType(type)) return false;
    const size = geometryLocalSizeMeters(geometry, unitScale);
    const maxDim = Math.max(...size);
    const minDim = Math.min(...size.filter((value) => value > 1e-6));
    if (!Number.isFinite(maxDim) || !Number.isFinite(minDim)) return false;
    const ratio = maxDim / Math.max(minDim, 1e-6);
    return maxDim <= 0.65 && ratio <= 14;
  }

  function isMepNodeRuntimeType(type) {
    const value = String(type || '').toUpperCase();
    return [
      'IFCAIRTERMINAL',
      'IFCCABLECARRIERFITTING',
      'IFCDUCTFITTING',
      'IFCELECTRICAPPLIANCE',
      'IFCELECTRICDISTRIBUTIONBOARD',
      'IFCFLOWCONTROLLER',
      'IFCFLOWFITTING',
      'IFCFLOWMETER',
      'IFCFLOWTERMINAL',
      'IFCFLOWTREATMENTDEVICE',
      'IFCPIPEFITTING'
    ].includes(value);
  }

  function mepNodeGeometryFromMesh(element, geometry, unitScale, minThickness) {
    if (!geometry || geometry.kind !== 'mesh') return null;
    const bbox = meshLocalBounds(geometry.positions || []);
    if (!bbox.valid) return null;

    const targetLocal = minThickness / Math.max(unitScale, 1e-12);
    const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
    const size = bbox.max.map((value, index) => Math.max(value - bbox.min[index], targetLocal));
    const profile = mepNodeProfileForType(element?.type);
    const shape = mepNodeShapeForSize(profile, size);
    return {
      id: `mepnode-${profile}-${shape.kind}-${geometry.id}-${size.map((value) => Math.round(value)).join('x')}`,
      kind: 'mep-node',
      profile,
      shape: shape.kind,
      axis: shape.axis,
      center: roundVector(center),
      size: roundVector(size)
    };
  }

  function mepNodeProfileForType(type) {
    const value = String(type || '').toUpperCase();
    if (value === 'IFCFLOWTERMINAL' || value === 'IFCAIRTERMINAL') return 'terminal';
    if (value.includes('CONTROLLER') || value.includes('METER') || value.includes('TREATMENT') || value.includes('DISTRIBUTIONBOARD') || value.includes('APPLIANCE')) return 'controller';
    if (value.includes('FITTING')) return 'fitting';
    return 'node';
  }

  function mepNodeShapeForSize(profile, size) {
    const ranked = size.map((value, axis) => ({ value, axis })).sort((a, b) => b.value - a.value);
    const max = ranked[0]?.value || 0;
    const min = ranked[2]?.value || ranked[ranked.length - 1]?.value || 0;
    const ratio = max / Math.max(min, 1e-9);
    if (profile === 'fitting' && ratio >= 1.55) return { kind: 'inline', axis: ranked[0].axis };
    if (profile === 'fitting') return { kind: 'compact', axis: ranked[0].axis };
    if (profile === 'controller' || profile === 'terminal') return { kind: 'box', axis: ranked[0].axis };
    return { kind: 'rounded', axis: ranked[0].axis };
  }

  function boxMepGeometryFromMesh(geometry, unitScale, minThickness) {
    if (!geometry || geometry.kind !== 'mesh') return null;
    const bbox = meshLocalBounds(geometry.positions || []);
    if (!bbox.valid) return null;

    const targetLocal = minThickness / Math.max(unitScale, 1e-12);
    const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
    const size = bbox.max.map((value, index) => Math.max(value - bbox.min[index], targetLocal));
    return {
      id: `boxmep-${geometry.id}-${size.map((value) => Math.round(value)).join('x')}`,
      kind: 'mep-box',
      center: roundVector(center),
      size: roundVector(size)
    };
  }

  function convertLargeThinMepToOverviewBoxes(elements, geometries, minThickness) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      const bbox = elementWorldBounds(element, geometry);
      if (!bbox.valid) continue;

      const size = bbox.max.map((value, index) => Math.max(value - bbox.min[index], minThickness));
      const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
      element.geometry = geometryIdForSize(`${element.type || 'mep'}-overview`, size);
      element.geometrySize = roundVector(size);
      element.geometryDef = undefined;
      element.transform = { position: roundVector(center) };
      element.properties.GeometrySource = `${element.properties.GeometrySource}-overview-box`;
      element.properties.GeometryFallbackReason = 'large-thin-mep-overview-box';
    }

    geometries.length = 0;
    for (const geometry of buildGeometryDefs(elements)) geometries.push(geometry);
  }

  function buildLargeThinMepOverviewOverlay(elements, geometries, minThickness) {
    const geometryMap = new Map(geometries.map((geometry) => [geometry.id, geometry]));
    const overlayElements = [];
    const instances = [];

    for (const element of elements) {
      const geometry = geometryMap.get(element.geometry);
      const bbox = elementWorldBounds(element, geometry);
      if (!bbox.valid) continue;

      const size = bbox.max.map((value, index) => Math.max(value - bbox.min[index], minThickness));
      const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
      const geometryId = geometryIdForSize(`${element.type || 'mep'}-overview`, size);
      overlayElements.push({
        id: `overview-${element.id}`,
        geometry: geometryId,
        geometrySize: roundVector(size)
      });
      instances.push([
        `overview-${element.id}`,
        element.type || '',
        element.name || element.id,
        geometryId,
        element.material || 'default',
        ...roundVector(center),
        element.id
      ]);
    }

    return {
      id: 'large-thin-overview',
      label: 'MEP översikt',
      kind: 'element-overlay',
      schema: 'compact-box-instances-v1',
      defaultVisible: false,
      purpose: 'Readable visual layer for large, thin MEP models. Original elements remain in doc.elements.',
      instanceColumns: ['id', 'type', 'name', 'geometry', 'material', 'x', 'y', 'z', 'sourceElementId'],
      instances,
      geometries: buildGeometryDefs(overlayElements)
    };
  }

  function inflateThinMeshGeometry(geometry, minThickness, unitScale) {
    const positions = geometry.positions || [];
    if (positions.length < 9) return false;

    const bbox = meshLocalBounds(positions);
    if (!bbox.valid) return false;

    const size = bbox.max.map((value, index) => value - bbox.min[index]);
    const maxDimMeters = Math.max(...size) * unitScale;
    if (maxDimMeters <= 0 || maxDimMeters < minThickness) return false;

    const targetLocal = minThickness / Math.max(unitScale, 1e-12);
    const center = bbox.max.map((value, index) => (value + bbox.min[index]) * 0.5);
    const flatAxes = size
      .map((value, axis) => ({ axis, value }))
      .filter((item) => item.value * unitScale < minThickness * 0.1);
    if (flatAxes.length) {
      const adjustedSize = size.map((value) => Math.max(value, targetLocal));
      replaceMeshWithLocalBox(geometry, center, adjustedSize);
      geometry.visualInflation = {
        minThickness,
        mode: 'local-bbox-prism',
        axes: size.map((value, axis) => adjustedSize[axis] === value ? 1 : Math.round((adjustedSize[axis] / Math.max(value, 1e-9)) * 1000) / 1000)
      };
      return true;
    }

    const scaleByAxis = size.map((value) => {
      if (value <= 1e-9) return 1;
      const valueMeters = value * unitScale;
      if (valueMeters >= minThickness) return 1;
      return Math.min(targetLocal, Math.max(...size)) / value;
    });

    if (scaleByAxis.every((value) => value === 1)) return false;

    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        if (scaleByAxis[axis] === 1) continue;
        positions[i + axis] = roundNumber(center[axis] + (positions[i + axis] - center[axis]) * scaleByAxis[axis]);
      }
    }
    geometry.visualInflation = {
      minThickness,
      axes: scaleByAxis.map((value) => Math.round(value * 1000) / 1000)
    };
    return true;
  }

  function replaceMeshWithLocalBox(geometry, center, size) {
    const hx = size[0] * 0.5;
    const hy = size[1] * 0.5;
    const hz = size[2] * 0.5;
    const corners = [
      [-hx, -hy, -hz],
      [hx, -hy, -hz],
      [hx, hy, -hz],
      [-hx, hy, -hz],
      [-hx, -hy, hz],
      [hx, -hy, hz],
      [hx, hy, hz],
      [-hx, hy, hz]
    ];
    geometry.positions = corners.flatMap((point) => roundVector([
      center[0] + point[0],
      center[1] + point[1],
      center[2] + point[2]
    ]));
    geometry.indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0
    ];
  }

  function buildIfcContext(entities) {
    const byId = new Map();
    const points = new Map();
    const directions = new Map();
    const axisPlacements = new Map();
    const localPlacements = new Map();
    const shapeReps = new Map();
    const productDefinitionShapes = new Map();
    const profiles = new Map();
    const pointLists2d = new Map();
    const indexedPolyCurves = new Map();
    const polylines = new Map();
    const compositeCurveSegments = new Map();
    const compositeCurves = new Map();
    const trimmedCurves = new Map();
    const circles = new Map();
    const extrudes = new Map();
    const booleanResults = new Map();
    const loops = new Map();
    const faceBounds = new Map();
    const faces = new Map();
    const shells = new Map();
    const surfaceModels = new Map();
    const breps = new Map();
    const pointLists3d = new Map();
    const indexedFaces = new Map();
    const polygonalFaceSets = new Map();
    const triangulatedFaceSets = new Map();
    const representationMaps = new Map();
    const mappedItems = new Map();
    const cartesianTransforms = new Map();
    const colours = new Map();
    const colourLists = new Map();
    const indexedColourMaps = [];
    const renderings = new Map();
    const surfaceStyles = new Map();
    const styleAssignments = new Map();
    const styledItems = [];
    const itemColors = new Map();
    const placementCache = new Map();
    const meshCache = new Map();
    const unitScale = detectLengthUnitScale(entities);

    for (const entity of entities) {
      byId.set(entity.expressId, entity);
    }

    for (const entity of entities) {
      if (entity.type === 'IFCCARTESIANPOINT') {
        points.set(entity.expressId, parseTupleNumbers(entity.args[0], 3, [0, 0, 0]));
      } else if (entity.type === 'IFCDIRECTION') {
        directions.set(entity.expressId, normalize(parseTupleNumbers(entity.args[0], 3, [0, 0, 1])));
      } else if (entity.type === 'IFCAXIS2PLACEMENT3D') {
        axisPlacements.set(entity.expressId, {
          location: refId(entity.args[0]),
          axis: refId(entity.args[1]),
          refDirection: refId(entity.args[2])
        });
      } else if (entity.type === 'IFCAXIS2PLACEMENT2D') {
        axisPlacements.set(entity.expressId, {
          location: refId(entity.args[0]),
          axis: null,
          refDirection: refId(entity.args[1])
        });
      } else if (entity.type === 'IFCLOCALPLACEMENT') {
        localPlacements.set(entity.expressId, {
          relativeTo: refId(entity.args[0]),
          placementRelTo: refId(entity.args[1])
        });
      } else if (entity.type === 'IFCSHAPEREPRESENTATION') {
        shapeReps.set(entity.expressId, {
          identifier: cleanStepString(entity.args[1]),
          type: cleanStepString(entity.args[2]),
          items: allRefs(entity.args[3])
        });
      } else if (entity.type === 'IFCPRODUCTDEFINITIONSHAPE') {
        productDefinitionShapes.set(entity.expressId, {
          representations: allRefs(entity.args[2])
        });
      } else if (entity.type === 'IFCRECTANGLEPROFILEDEF') {
        const nums = numberArgs(entity.rawArgs);
        profiles.set(entity.expressId, {
          type: 'rectangle',
          position: refId(entity.args[2]),
          xDim: nums[nums.length - 2] || 1,
          yDim: nums[nums.length - 1] || 1
        });
      } else if (entity.type === 'IFCCIRCLEPROFILEDEF' || entity.type === 'IFCCIRCLEHOLLOWPROFILEDEF') {
        const nums = numberArgs(entity.rawArgs);
        const radius = entity.type === 'IFCCIRCLEHOLLOWPROFILEDEF'
          ? nums[nums.length - 2]
          : nums[nums.length - 1];
        profiles.set(entity.expressId, {
          type: 'circle',
          position: refId(entity.args[2]),
          radius: radius || 0.5,
          innerRadius: entity.type === 'IFCCIRCLEHOLLOWPROFILEDEF'
            ? Math.max((radius || 0.5) - (nums[nums.length - 1] || 0), 0)
            : 0
        });
      } else if (entity.type === 'IFCCARTESIANPOINTLIST2D') {
        pointLists2d.set(entity.expressId, parseNestedNumberTuples(entity.args[0], 2));
      } else if (entity.type === 'IFCINDEXEDPOLYCURVE') {
        indexedPolyCurves.set(entity.expressId, {
          pointListId: refId(entity.args[0]),
          segments: allRefs(entity.args[1])
        });
      } else if (entity.type === 'IFCPOLYLINE') {
        polylines.set(entity.expressId, allRefs(entity.args[0]));
      } else if (entity.type === 'IFCCOMPOSITECURVESEGMENT') {
        compositeCurveSegments.set(entity.expressId, {
          sameSense: String(entity.args[1]).toUpperCase() !== '.F.',
          curveId: refId(entity.args[2])
        });
      } else if (entity.type === 'IFCCOMPOSITECURVE') {
        compositeCurves.set(entity.expressId, allRefs(entity.args[0]));
      } else if (entity.type === 'IFCTRIMMEDCURVE') {
        trimmedCurves.set(entity.expressId, {
          basisCurveId: refId(entity.args[0]),
          trim1: firstNumber(entity.args[1]),
          trim2: firstNumber(entity.args[2]),
          senseAgreement: String(entity.args[3]).toUpperCase() !== '.F.'
        });
      } else if (entity.type === 'IFCCIRCLE') {
        const nums = numberArgs(entity.rawArgs);
        circles.set(entity.expressId, {
          position: refId(entity.args[0]),
          radius: nums[nums.length - 1] || 1
        });
      } else if (entity.type === 'IFCARBITRARYCLOSEDPROFILEDEF' || entity.type === 'IFCARBITRARYPROFILEDEFWITHVOIDS') {
        profiles.set(entity.expressId, {
          type: 'arbitrary',
          outerCurveId: refId(entity.args[2]),
          innerCurveIds: allRefs(entity.args[3])
        });
      } else if (entity.type === 'IFCEXTRUDEDAREASOLID') {
        const nums = numberArgs(entity.rawArgs);
        extrudes.set(entity.expressId, {
          profileId: refId(entity.args[0]),
          position: refId(entity.args[1]),
          direction: refId(entity.args[2]),
          depth: nums[nums.length - 1] || 1
        });
      } else if (entity.type === 'IFCBOOLEANCLIPPINGRESULT' || entity.type === 'IFCBOOLEANRESULT') {
        booleanResults.set(entity.expressId, {
          operator: cleanStepString(entity.args[0]) || entity.args[0],
          firstOperand: refId(entity.args[1]),
          secondOperand: refId(entity.args[2])
        });
      } else if (entity.type === 'IFCPOLYLOOP') {
        loops.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCFACEOUTERBOUND' || entity.type === 'IFCFACEBOUND') {
        faceBounds.set(entity.expressId, {
          loopId: refId(entity.args[0])
        });
      } else if (entity.type === 'IFCFACE') {
        faces.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCCLOSEDSHELL' || entity.type === 'IFCOPENSHELL') {
        shells.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCSHELLBASEDSURFACEMODEL' || entity.type === 'IFCFACEBASEDSURFACEMODEL') {
        surfaceModels.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCFACETEDBREP') {
        breps.set(entity.expressId, refId(entity.args[0]));
      } else if (entity.type === 'IFCCARTESIANPOINTLIST3D') {
        pointLists3d.set(entity.expressId, parseNestedNumberTuples(entity.args[0], 3));
      } else if (entity.type === 'IFCINDEXEDPOLYGONALFACE' || entity.type === 'IFCINDEXEDPOLYGONALFACEWITHVOIDS') {
        indexedFaces.set(entity.expressId, numberArgs(entity.args[0]).map((index) => index - 1));
      } else if (entity.type === 'IFCPOLYGONALFACESET') {
        polygonalFaceSets.set(entity.expressId, {
          pointListId: refId(entity.args[0]),
          faceIds: allRefs(entity.args[2])
        });
      } else if (entity.type === 'IFCTRIANGULATEDFACESET') {
        triangulatedFaceSets.set(entity.expressId, {
          pointListId: refId(entity.args[0]),
          triangles: parseNestedNumberTuples(entity.args[3], 3).map((tuple) => tuple.map((index) => index - 1))
        });
      } else if (entity.type === 'IFCREPRESENTATIONMAP') {
        representationMaps.set(entity.expressId, {
          mappingOrigin: refId(entity.args[0]),
          representation: refId(entity.args[1])
        });
      } else if (entity.type === 'IFCMAPPEDITEM') {
        mappedItems.set(entity.expressId, {
          representationMap: refId(entity.args[0]),
          transform: refId(entity.args[1])
        });
      } else if (
        entity.type === 'IFCCARTESIANTRANSFORMATIONOPERATOR3D' ||
        entity.type === 'IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM' ||
        entity.type === 'IFCCARTESIANTRANSFORMATIONOPERATOR'
      ) {
        cartesianTransforms.set(entity.expressId, parseCartesianTransform(entity));
      } else if (entity.type === 'IFCCOLOURRGB') {
        const nums = numberArgs(entity.rawArgs);
        colours.set(entity.expressId, {
          r: clamp01(nums[nums.length - 3] || 0),
          g: clamp01(nums[nums.length - 2] || 0),
          b: clamp01(nums[nums.length - 1] || 0),
          a: 1
        });
      } else if (entity.type === 'IFCCOLOURRGBLIST') {
        const tuples = parseNestedNumberTuples(entity.args[0], 3);
        colourLists.set(entity.expressId, tuples.map((tuple) => ({
          r: clamp01(tuple[0] || 0),
          g: clamp01(tuple[1] || 0),
          b: clamp01(tuple[2] || 0),
          a: 1
        })));
      } else if (entity.type === 'IFCINDEXEDCOLOURMAP') {
        indexedColourMaps.push({
          itemId: refId(entity.args[0]),
          opacity: Number(entity.args[1]),
          colourListId: refId(entity.args[2]),
          colourIndices: numberArgs(entity.args[3])
        });
      } else if (entity.type === 'IFCSURFACESTYLERENDERING') {
        const transparency = Number(entity.args[1]);
        renderings.set(entity.expressId, {
          colourId: refId(entity.args[0]),
          transparency: Number.isFinite(transparency) ? clamp01(transparency) : 0
        });
      } else if (entity.type === 'IFCSURFACESTYLE') {
        surfaceStyles.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCPRESENTATIONSTYLEASSIGNMENT') {
        styleAssignments.set(entity.expressId, allRefs(entity.rawArgs));
      } else if (entity.type === 'IFCSTYLEDITEM') {
        const trimmed = entity.rawArgs.trimStart();
        const refs = allRefs(entity.rawArgs);
        const hasItem = trimmed.startsWith('#');
        const itemId = hasItem ? refs[0] : null;
        const styleRefs = hasItem ? refs.slice(1) : refs;
        for (const styleRef of styleRefs) {
          styledItems.push({ itemId, styleRef });
        }
      }
    }

    for (const styled of styledItems) {
      if (!styled.itemId) continue;
      const color = resolveColourFromStyle(styled.styleRef);
      if (color) itemColors.set(styled.itemId, color);
    }

    for (const colourMap of indexedColourMaps) {
      if (!colourMap.itemId || itemColors.has(colourMap.itemId)) continue;
      const colors = colourLists.get(colourMap.colourListId) || [];
      const colorIndex = Math.max((colourMap.colourIndices?.[0] || 1) - 1, 0);
      const color = colors[colorIndex] || colors[0];
      if (!color) continue;
      itemColors.set(colourMap.itemId, {
        r: color.r,
        g: color.g,
        b: color.b,
        a: Number.isFinite(colourMap.opacity) ? clamp01(colourMap.opacity) : 1
      });
    }

    function resolveLocalPlacement(id, seen = new Set()) {
      if (!id) return identityMatrix();
      if (placementCache.has(id)) return placementCache.get(id);
      if (seen.has(id)) return identityMatrix();
      seen.add(id);

      const local = localPlacements.get(id);
      if (!local) return identityMatrix();

      const parent = local.relativeTo ? resolveLocalPlacement(local.relativeTo, seen) : identityMatrix();
      const here = resolveAxisPlacement(local.placementRelTo);
      const matrix = multiplyMatrices(parent, here);
      placementCache.set(id, matrix);
      return matrix;
    }

    function resolveAxisPlacement(id) {
      const placement = axisPlacements.get(id);
      if (!placement) return identityMatrix();

      const origin = points.get(placement.location) || [0, 0, 0];
      const zAxis = normalize(directions.get(placement.axis) || [0, 0, 1]);
      const rawX = normalize(directions.get(placement.refDirection) || [1, 0, 0]);
      const yAxis = normalize(cross(zAxis, rawX));
      const xAxis = normalize(cross(yAxis, zAxis));

      return [
        xAxis[0], yAxis[0], zAxis[0], origin[0],
        xAxis[1], yAxis[1], zAxis[1], origin[1],
        xAxis[2], yAxis[2], zAxis[2], origin[2],
        0, 0, 0, 1
      ];
    }

    function resolveProductBox(product) {
      const pdsId = refId(product.args[6]);
      const pds = productDefinitionShapes.get(pdsId);
      if (!pds) return null;

      for (const repId of pds.representations) {
        const box = resolveRepresentationBox(repId, new Set());
        if (box) return box;
      }

      return null;
    }

    function hasProductRepresentation(product) {
      const pdsId = refId(product.args[6]);
      const pds = productDefinitionShapes.get(pdsId);
      return Boolean(pds?.representations?.length);
    }

    function resolveColourFromStyle(styleRef) {
      const styleIds = styleAssignments.get(styleRef) || (surfaceStyles.has(styleRef) ? [styleRef] : []);
      for (const styleId of styleIds) {
        const renderingIds = surfaceStyles.get(styleId) || [];
        for (const renderingId of renderingIds) {
          const rendering = renderings.get(renderingId);
          const color = rendering ? colours.get(rendering.colourId) : null;
          if (color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: 1 - (rendering.transparency || 0)
            };
          }
        }
      }
      return null;
    }

    function colorForItem(itemId) {
      return itemColors.get(itemId) || null;
    }

    function resolveProductMesh(product) {
      const pdsId = refId(product.args[6]);
      const pds = productDefinitionShapes.get(pdsId);
      if (!pds) return null;

      for (const repId of pds.representations) {
        const mesh = resolveRepresentationMesh(repId, new Set());
        if (mesh) return mesh;
      }

      return null;
    }

    function resolveRepresentationMesh(repId, seen) {
      if (!repId || seen.has(repId)) return null;
      seen.add(repId);
      const rep = shapeReps.get(repId);
      if (!rep || (rep.identifier && rep.identifier.toUpperCase() !== 'BODY')) return null;

      for (const itemId of rep.items) {
        if (booleanResults.has(itemId)) {
          const mesh = meshFromBooleanResult(itemId, `mesh-boolean-${itemId}`, seen);
          if (mesh) return mesh;
        }
        if (mappedItems.has(itemId)) return meshFromMappedItem(itemId, seen);
        if (extrudes.has(itemId)) {
          const geometry = meshFromExtrude(itemId, `mesh-extrude-${itemId}`);
          const extrude = extrudes.get(itemId);
          const profile = extrude ? profiles.get(extrude.profileId) : null;
          if (geometry) return { geometry, matrixIfc: identityMatrix(), source: `${profile?.type || 'profile'}-extrude-mesh`, solidId: itemId, profileId: extrude.profileId, color: colorForItem(itemId) };
        }
        if (polygonalFaceSets.has(itemId)) {
          const geometry = meshFromPolygonalFaceSet(itemId, `mesh-pfs-${itemId}`);
          if (geometry) return { geometry, matrixIfc: identityMatrix(), source: 'polygonal-face-set-mesh', solidId: itemId, color: colorForItem(itemId) };
        }
        if (triangulatedFaceSets.has(itemId)) {
          const geometry = meshFromTriangulatedFaceSet(itemId, `mesh-tfs-${itemId}`);
          if (geometry) return { geometry, matrixIfc: identityMatrix(), source: 'triangulated-face-set-mesh', solidId: itemId, color: colorForItem(itemId) };
        }
        if (surfaceModels.has(itemId)) {
          const geometry = meshFromSurfaceModel(itemId, `mesh-surface-${itemId}`);
          if (geometry) return { geometry, matrixIfc: identityMatrix(), source: 'surface-model-mesh', solidId: itemId };
        }
        if (breps.has(itemId)) {
          const shellId = breps.get(itemId);
          const geometry = meshFromShellIds([shellId], `mesh-brep-${itemId}`);
          if (geometry) return { geometry, matrixIfc: identityMatrix(), source: 'brep-mesh', solidId: itemId };
        }
      }

      return null;
    }

    function meshFromBooleanResult(booleanId, geometryId, seen) {
      const result = booleanResults.get(booleanId);
      if (!result?.firstOperand || seen.has(booleanId)) return null;
      seen.add(booleanId);

      if (extrudes.has(result.firstOperand)) {
        const geometry = meshFromExtrude(result.firstOperand, geometryId);
        const extrude = extrudes.get(result.firstOperand);
        const profile = extrude ? profiles.get(extrude.profileId) : null;
        if (geometry) {
          return {
            geometry,
            matrixIfc: identityMatrix(),
            source: `${profile?.type || 'profile'}-extrude-mesh-clipping-base`,
            solidId: result.firstOperand,
            profileId: extrude.profileId,
            color: colorForItem(booleanId) || colorForItem(result.firstOperand)
          };
        }
      }

      if (booleanResults.has(result.firstOperand)) {
        return meshFromBooleanResult(result.firstOperand, geometryId, seen);
      }

      return null;
    }

    function meshFromMappedItem(mappedItemId, seen) {
      const mapped = mappedItems.get(mappedItemId);
      const repMap = mapped ? representationMaps.get(mapped.representationMap) : null;
      if (!mapped || !repMap) return null;

      const inner = resolveRepresentationMesh(repMap.representation, seen);
      if (!inner) return null;

      const mapOrigin = resolveAxisPlacement(repMap.mappingOrigin);
      const ctop = cartesianTransforms.get(mapped.transform) || identityMatrix();
      const matrixIfc = multiplyMatrices(ctop, multiplyMatrices(mapOrigin, inner.matrixIfc || identityMatrix()));
      return {
        geometry: inner.geometry,
        matrixIfc,
        source: `mapped-${inner.source}`,
        mappedItemId,
        repMapId: mapped.representationMap,
        solidId: inner.solidId,
        profileId: inner.profileId,
        color: colorForItem(mappedItemId) || inner.color
      };
    }

    function meshFromSurfaceModel(modelId, geometryId) {
      return meshFromShellIds(surfaceModels.get(modelId) || [], geometryId);
    }

    function meshFromExtrude(extrudeId, geometryId) {
      const extrude = extrudes.get(extrudeId);
      const profile = extrude ? profiles.get(extrude.profileId) : null;
      const profileLoops = profileLoopsForExtrude(profile);
      if (!profileLoops) return null;

      const depth = Math.max(extrude.depth || 0, 1e-6);
      const solidPlacement = resolveAxisPlacement(extrude.position);
      const profilePlacement = profile.position ? resolveAxisPlacement(profile.position) : identityMatrix();
      const placement = multiplyMatrices(solidPlacement, profilePlacement);
      const cacheKey = `extrude:${extrudeId}:${profileLoops.cacheKey}:${depth}`;
      if (meshCache.has(cacheKey)) return meshCache.get(cacheKey);

      const positions = [];
      const indices = [];
      const loops = profileLoops.loops;

      for (const loop of loops) {
        loop.start = positions.length / 3;
        for (const z of [0, depth]) {
          for (const point of loop.points) {
            const p = applyMatrixToPoint(placement, [point[0], point[1], z]);
            positions.push(roundMeshNumber(p[0]), roundMeshNumber(p[1]), roundMeshNumber(p[2]));
          }
        }
      }

      if (!profileLoops.hasHoles) {
        for (const tri of triangulateSimplePolygon(loops[0].points)) {
          indices.push(loops[0].start + tri[0], loops[0].start + tri[2], loops[0].start + tri[1]);
          indices.push(loops[0].start + loops[0].points.length + tri[0], loops[0].start + loops[0].points.length + tri[1], loops[0].start + loops[0].points.length + tri[2]);
        }
      }

      for (const loop of loops) {
        addExtrudeSideFaces(indices, loop.start, loop.points.length, loop.hole);
      }

      if (positions.length === 0 || indices.length === 0) return null;
      const geometry = {
        id: geometryId,
        kind: 'mesh',
        positions,
        indices
      };
      meshCache.set(cacheKey, geometry);
      return geometry;
    }

    function profileLoopsForExtrude(profile) {
      if (!profile) return null;

      if (profile.type === 'rectangle') {
        const hx = Math.max(profile.xDim || 1, 1e-6) * 0.5;
        const hy = Math.max(profile.yDim || 1, 1e-6) * 0.5;
        return {
          cacheKey: `rect:${profile.xDim}:${profile.yDim}`,
          hasHoles: false,
          loops: [{
            points: orientLoop([[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]], 1),
            hole: false
          }]
        };
      }

      if (profile.type === 'circle') {
        const segments = 32;
        const outer = circleLoop(Math.max(profile.radius || 0.5, 1e-6), segments);
        const inner = profile.innerRadius > 1e-6 ? circleLoop(profile.innerRadius, segments) : null;
        return {
          cacheKey: `circle:${profile.radius}:${profile.innerRadius || 0}:${segments}`,
          hasHoles: Boolean(inner),
          loops: [
            { points: orientLoop(outer, 1), hole: false },
            ...(inner ? [{ points: orientLoop(inner, -1), hole: true }] : [])
          ]
        };
      }

      if (profile.type === 'arbitrary') {
        const points2d = pointsForIndexedCurve(profile.outerCurveId);
        if (points2d.length < 3) return null;
        const innerLoops = profile.innerCurveIds
          .map((curveId) => removeClosingPoint(pointsForIndexedCurve(curveId)))
          .filter((loop) => loop.length >= 3);
        return {
          cacheKey: `arb:${profile.outerCurveId}:${profile.innerCurveIds.join('_')}`,
          hasHoles: innerLoops.length > 0,
          loops: [
            { points: orientLoop(removeClosingPoint(points2d), 1), hole: false },
            ...innerLoops.map((loop) => ({ points: orientLoop(loop, -1), hole: true }))
          ]
        };
      }

      return null;
    }

    function circleLoop(radius, segments) {
      const points = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        points.push([Math.cos(a) * radius, Math.sin(a) * radius]);
      }
      return points;
    }

    function meshFromPolygonalFaceSet(faceSetId, geometryId) {
      const faceSet = polygonalFaceSets.get(faceSetId);
      const points3d = faceSet ? pointLists3d.get(faceSet.pointListId) : null;
      if (!points3d) return null;

      const facesForMesh = [];
      for (const faceId of faceSet.faceIds) {
        const face = (indexedFaces.get(faceId) || []).filter((index) => index >= 0 && index < points3d.length);
        if (face.length >= 3) facesForMesh.push(face);
      }

      return meshFromIndexedPointFaces(points3d, facesForMesh, geometryId, `pfs:${faceSetId}`);
    }

    function meshFromTriangulatedFaceSet(faceSetId, geometryId) {
      const faceSet = triangulatedFaceSets.get(faceSetId);
      const points3d = faceSet ? pointLists3d.get(faceSet.pointListId) : null;
      if (!points3d) return null;

      const facesForMesh = faceSet.triangles
        .filter((face) => face.length === 3 && face.every((index) => index >= 0 && index < points3d.length));

      return meshFromIndexedPointFaces(points3d, facesForMesh, geometryId, `tfs:${faceSetId}`);
    }

    function meshFromIndexedPointFaces(points3d, facesForMesh, geometryId, cacheKey) {
      if (meshCache.has(cacheKey)) return meshCache.get(cacheKey);

      const vertexMap = new Map();
      const positions = [];
      const indices = [];

      for (const face of facesForMesh) {
        const faceIndices = [];
        for (const pointIndex of face) {
          const point = points3d[pointIndex];
          if (!point) continue;
          let index = vertexMap.get(pointIndex);
          if (index == null) {
            index = positions.length / 3;
            vertexMap.set(pointIndex, index);
            positions.push(roundMeshNumber(point[0]), roundMeshNumber(point[1]), roundMeshNumber(point[2]));
          }
          faceIndices.push(index);
        }
        for (let i = 1; i < faceIndices.length - 1; i++) {
          indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
        }
      }

      if (positions.length === 0 || indices.length === 0) return null;
      const geometry = {
        id: geometryId,
        kind: 'mesh',
        positions,
        indices
      };
      meshCache.set(cacheKey, geometry);
      return geometry;
    }

    function meshFromShellIds(shellIds, geometryId) {
      const cacheKey = `${geometryId}:${shellIds.join('_')}`;
      if (meshCache.has(cacheKey)) return meshCache.get(cacheKey);

      const vertexMap = new Map();
      const positions = [];
      const indices = [];

      for (const shellId of shellIds) {
        for (const faceId of (shells.get(shellId) || [])) {
          const boundId = (faces.get(faceId) || [])[0];
          const loopId = faceBounds.get(boundId)?.loopId;
          const pointIds = loops.get(loopId) || [];
          if (pointIds.length < 3) continue;
          const faceIndices = [];
          for (const pointId of pointIds) {
            const point = points.get(pointId);
            if (!point) continue;
            let index = vertexMap.get(pointId);
            if (index == null) {
              index = positions.length / 3;
              vertexMap.set(pointId, index);
              positions.push(roundMeshNumber(point[0]), roundMeshNumber(point[1]), roundMeshNumber(point[2]));
            }
            faceIndices.push(index);
          }
          for (let i = 1; i < faceIndices.length - 1; i++) {
            indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
          }
        }
      }

      if (positions.length === 0 || indices.length === 0) return null;
      const geometry = {
        id: geometryId,
        kind: 'mesh',
        positions,
        indices
      };
      meshCache.set(cacheKey, geometry);
      return geometry;
    }

    function resolveRepresentationBox(repId, seen) {
      if (!repId || seen.has(repId)) return null;
      seen.add(repId);
      const rep = shapeReps.get(repId);
      if (!rep || (rep.identifier && rep.identifier.toUpperCase() !== 'BODY')) return null;

      for (const itemId of rep.items) {
        const box = resolveItemBox(itemId, seen);
        if (box) return { ...box, representationId: repId };
      }

      return null;
    }

    function resolveItemBox(itemId, seen) {
      if (booleanResults.has(itemId)) {
        const box = boxFromBooleanResult(itemId, seen);
        return box ? { ...box, solidId: booleanResults.get(itemId).firstOperand, profileId: box.profileId || null } : null;
      }

      const extrude = extrudes.get(itemId);
      if (extrude) {
        const profile = profiles.get(extrude.profileId);
        const box = boxFromProfile(profile, extrude);
        return box ? { ...box, solidId: itemId, profileId: extrude.profileId } : null;
      }

      if (breps.has(itemId)) {
        const box = boxFromBrep(itemId);
        return box ? { ...box, solidId: itemId, profileId: null } : null;
      }

      if (surfaceModels.has(itemId)) {
        const box = boxFromSurfaceModel(itemId);
        return box ? { ...box, solidId: itemId, profileId: null } : null;
      }

      if (polygonalFaceSets.has(itemId)) {
        const box = boxFromPolygonalFaceSet(itemId);
        return box ? { ...box, solidId: itemId, profileId: null, color: colorForItem(itemId) } : null;
      }

      if (triangulatedFaceSets.has(itemId)) {
        const box = boxFromTriangulatedFaceSet(itemId);
        return box ? { ...box, solidId: itemId, profileId: null, color: colorForItem(itemId) } : null;
      }

      if (mappedItems.has(itemId)) {
        return boxFromMappedItem(itemId, seen);
      }

      return null;
    }

    function boxFromBooleanResult(booleanId, seen) {
      const result = booleanResults.get(booleanId);
      if (!result?.firstOperand || seen.has(booleanId)) return null;
      seen.add(booleanId);

      if (extrudes.has(result.firstOperand)) {
        const extrude = extrudes.get(result.firstOperand);
        const profile = profiles.get(extrude.profileId);
        const box = boxFromProfile(profile, extrude);
        return box ? { ...box, source: `${box.source}-clipping-base`, profileId: extrude.profileId } : null;
      }
      if (booleanResults.has(result.firstOperand)) return boxFromBooleanResult(result.firstOperand, seen);
      return null;
    }

    function boxFromBrep(brepId) {
      const shellId = breps.get(brepId);
      return boxFromShellIds([shellId], 'brep-bounds-box');
    }

    function boxFromSurfaceModel(modelId) {
      return boxFromShellIds(surfaceModels.get(modelId) || [], 'surface-model-bounds-box');
    }

    function boxFromPolygonalFaceSet(faceSetId) {
      const faceSet = polygonalFaceSets.get(faceSetId);
      const points3d = faceSet ? pointLists3d.get(faceSet.pointListId) : null;
      if (!points3d) return null;
      return boxFromPointList(points3d, 'polygonal-face-set-bounds-box');
    }

    function boxFromTriangulatedFaceSet(faceSetId) {
      const faceSet = triangulatedFaceSets.get(faceSetId);
      const points3d = faceSet ? pointLists3d.get(faceSet.pointListId) : null;
      if (!points3d) return null;
      return boxFromPointList(points3d, 'triangulated-face-set-bounds-box');
    }

    function boxFromPointList(points3d, source) {
      const bbox = emptyBBox();
      for (const point of points3d) {
        expandBBox(bbox, point);
      }
      return boxFromNativeBBox(bbox, source);
    }

    function boxFromShellIds(shellIds, source) {
      const bbox = emptyBBox();

      for (const sid of shellIds) {
        for (const faceId of (shells.get(sid) || [])) {
          const boundIds = faces.get(faceId) || [];
          for (const boundId of boundIds) {
            const loopId = faceBounds.get(boundId)?.loopId;
            const pointIds = loops.get(loopId) || [];
            for (const pointId of pointIds) {
              const point = points.get(pointId);
              if (point) expandBBox(bbox, point);
            }
          }
        }
      }

      if (!bbox.valid) return null;

      const sizeIfc = [
        Math.max(bbox.max[0] - bbox.min[0], 1),
        Math.max(bbox.max[1] - bbox.min[1], 1),
        Math.max(bbox.max[2] - bbox.min[2], 1)
      ];
      const centerIfc = [
        (bbox.min[0] + bbox.max[0]) * 0.5,
        (bbox.min[1] + bbox.max[1]) * 0.5,
        (bbox.min[2] + bbox.max[2]) * 0.5
      ];

      return {
        size: [sizeIfc[0] * unitScale, sizeIfc[2] * unitScale, sizeIfc[1] * unitScale],
        centerOffset: ifcToYUp(centerIfc).map((value) => value * unitScale),
        bboxIfc: cloneBBox(bbox),
        source
      };
    }

    function boxFromMappedItem(mappedItemId, seen) {
      const mapped = mappedItems.get(mappedItemId);
      const repMap = mapped ? representationMaps.get(mapped.representationMap) : null;
      if (!mapped || !repMap) return null;

      const inner = resolveRepresentationBox(repMap.representation, seen);
      if (!inner?.bboxIfc) return null;

      const mapOrigin = resolveAxisPlacement(repMap.mappingOrigin);
      const ctop = cartesianTransforms.get(mapped.transform) || identityMatrix();
      const bbox = transformBBox(inner.bboxIfc, multiplyMatrices(ctop, mapOrigin));
      const box = boxFromNativeBBox(bbox, `mapped-${inner.source}`);

      return {
        ...box,
        mappedItemId,
        repMapId: mapped.representationMap,
        solidId: inner.solidId,
        profileId: inner.profileId,
        color: colorForItem(mappedItemId) || inner.color
      };
    }

    function boxFromNativeBBox(bbox, source) {
      if (!bbox?.valid) return null;
      const sizeIfc = [
        Math.max(bbox.max[0] - bbox.min[0], 1),
        Math.max(bbox.max[1] - bbox.min[1], 1),
        Math.max(bbox.max[2] - bbox.min[2], 1)
      ];
      const centerIfc = [
        (bbox.min[0] + bbox.max[0]) * 0.5,
        (bbox.min[1] + bbox.max[1]) * 0.5,
        (bbox.min[2] + bbox.max[2]) * 0.5
      ];

      return {
        size: [sizeIfc[0] * unitScale, sizeIfc[2] * unitScale, sizeIfc[1] * unitScale],
        centerOffset: ifcToYUp(centerIfc).map((value) => value * unitScale),
        bboxIfc: cloneBBox(bbox),
        source
      };
    }

    function boxFromProfile(profile, extrude) {
      if (!profile) return null;
      const depth = Math.max((extrude.depth || 1) * unitScale, 0.001);
      const solidPosition = matrixTranslation(resolveAxisPlacement(extrude.position));
      const profilePosition = matrixTranslation(resolveAxisPlacement(profile.position));
      const offsetIfc = [
        solidPosition[0] + profilePosition[0],
        solidPosition[1] + profilePosition[1],
        solidPosition[2] + profilePosition[2] + (extrude.depth || 1) * 0.5
      ];

      if (profile.type === 'rectangle') {
        return {
          ...boxFromNativeBBox(bboxFromCenterSize(offsetIfc, [
            Math.max(profile.xDim, 1e-6),
            Math.max(profile.yDim, 1e-6),
            Math.max(extrude.depth || 1, 1e-6)
          ]), 'rectangle-extrude'),
          size: [
            Math.max(profile.xDim * unitScale, 0.001),
            depth,
            Math.max(profile.yDim * unitScale, 0.001)
          ]
        };
      }

      if (profile.type === 'circle') {
        const diameterIfc = Math.max(profile.radius * 2, 1e-6);
        return {
          ...boxFromNativeBBox(bboxFromCenterSize(offsetIfc, [
            diameterIfc,
            diameterIfc,
            Math.max(extrude.depth || 1, 1e-6)
          ]), 'circle-extrude-box'),
          size: [
            Math.max(diameterIfc * unitScale, 0.001),
            depth,
            Math.max(diameterIfc * unitScale, 0.001)
          ]
        };
      }

      if (profile.type === 'arbitrary') {
        const points2d = pointsForIndexedCurve(profile.outerCurveId);
        if (points2d.length < 3) return null;
        const bbox = emptyBBox();
        const placement = resolveAxisPlacement(extrude.position);
        for (const z of [0, extrude.depth || 1]) {
          for (const point of removeClosingPoint(points2d)) {
            expandBBox(bbox, applyMatrixToPoint(placement, [point[0], point[1], z]));
          }
        }
        return boxFromNativeBBox(bbox, 'arbitrary-extrude-bounds-box');
      }

      return null;
    }

    function pointsForIndexedCurve(curveId) {
      const curve = indexedPolyCurves.get(curveId);
      if (curve) return pointLists2d.get(curve.pointListId) || [];

      const pointIds = polylines.get(curveId);
      if (pointIds) {
        return pointIds
          .map((pointId) => points.get(pointId))
          .filter(Boolean)
          .map((point) => [point[0], point[1]]);
      }

      const segmentIds = compositeCurves.get(curveId);
      if (segmentIds) {
        const out = [];
        for (const segmentId of segmentIds) {
          const segment = compositeCurveSegments.get(segmentId);
          if (!segment) continue;
          let segmentPoints = pointsForIndexedCurve(segment.curveId);
          if (!segment.sameSense) segmentPoints = segmentPoints.slice().reverse();
          appendCurvePoints(out, segmentPoints);
        }
        return out;
      }

      const trimmed = trimmedCurves.get(curveId);
      if (trimmed) return pointsForTrimmedCurve(trimmed);

      return [];
    }

    function pointsForTrimmedCurve(trimmed) {
      const circle = circles.get(trimmed.basisCurveId);
      if (!circle || !Number.isFinite(trimmed.trim1) || !Number.isFinite(trimmed.trim2)) return [];

      const placement = resolveAxisPlacement(circle.position);
      const origin = matrixTranslation(placement);
      const xAxis = normalize([placement[0], placement[4], placement[8]]);
      const yAxis = normalize([placement[1], placement[5], placement[9]]);
      let start = trimmed.trim1 * Math.PI / 180;
      let end = trimmed.trim2 * Math.PI / 180;
      if (trimmed.senseAgreement && end < start) end += Math.PI * 2;
      if (!trimmed.senseAgreement && end > start) end -= Math.PI * 2;

      const sweep = end - start;
      const steps = Math.max(3, Math.ceil(Math.abs(sweep) / (Math.PI / 18)));
      const out = [];
      for (let i = 0; i <= steps; i++) {
        const t = start + sweep * (i / steps);
        const x = origin[0] + (xAxis[0] * Math.cos(t) + yAxis[0] * Math.sin(t)) * circle.radius;
        const y = origin[1] + (xAxis[1] * Math.cos(t) + yAxis[1] * Math.sin(t)) * circle.radius;
        out.push([x, y]);
      }
      return out;
    }

    function appendCurvePoints(out, points2d) {
      for (const point of points2d) {
        const last = out[out.length - 1];
        if (last && Math.abs(last[0] - point[0]) < 1e-6 && Math.abs(last[1] - point[1]) < 1e-6) continue;
        out.push(point);
      }
    }

    function removeClosingPoint(points2d) {
      if (points2d.length < 2) return points2d;
      const first = points2d[0];
      const last = points2d[points2d.length - 1];
      if (Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7) {
        return points2d.slice(0, -1);
      }
      return points2d;
    }

    function addExtrudeSideFaces(indices, start, count, reverse) {
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        const a = start + i;
        const b = start + next;
        const c = start + count + next;
        const d = start + count + i;
        if (reverse) {
          indices.push(a, c, b);
          indices.push(a, d, c);
        } else {
          indices.push(a, b, c);
          indices.push(a, c, d);
        }
      }
    }

    function triangulateSimplePolygon(points2d) {
      const count = points2d.length;
      if (count < 3) return [];
      const order = points2d.map((_, index) => index);
      const triangles = [];
      const ccw = signedArea2d(points2d) >= 0;
      let guard = count * count;

      while (order.length > 3 && guard-- > 0) {
        let clipped = false;
        for (let i = 0; i < order.length; i++) {
          const prev = order[(i - 1 + order.length) % order.length];
          const curr = order[i];
          const next = order[(i + 1) % order.length];
          if (!isConvexCorner(points2d[prev], points2d[curr], points2d[next], ccw)) continue;
          if (containsAnyPoint(points2d, order, prev, curr, next)) continue;
          triangles.push(ccw ? [prev, curr, next] : [prev, next, curr]);
          order.splice(i, 1);
          clipped = true;
          break;
        }
        if (!clipped) break;
      }

      if (order.length === 3) {
        triangles.push(ccw ? [order[0], order[1], order[2]] : [order[0], order[2], order[1]]);
      }
      if (triangles.length === 0) {
        for (let i = 1; i < count - 1; i++) triangles.push([0, i, i + 1]);
      }
      return triangles;
    }

    function orientLoop(points2d, sign) {
      const area = signedArea2d(points2d);
      if ((sign > 0 && area < 0) || (sign < 0 && area > 0)) {
        return points2d.slice().reverse();
      }
      return points2d;
    }

    function signedArea2d(points2d) {
      let area = 0;
      for (let i = 0; i < points2d.length; i++) {
        const a = points2d[i];
        const b = points2d[(i + 1) % points2d.length];
        area += a[0] * b[1] - b[0] * a[1];
      }
      return area * 0.5;
    }

    function isConvexCorner(a, b, c, ccw) {
      const cross2d = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      return ccw ? cross2d > 1e-9 : cross2d < -1e-9;
    }

    function containsAnyPoint(points2d, order, ia, ib, ic) {
      const a = points2d[ia];
      const b = points2d[ib];
      const c = points2d[ic];
      for (const index of order) {
        if (index === ia || index === ib || index === ic) continue;
        if (pointInTriangle2d(points2d[index], a, b, c)) return true;
      }
      return false;
    }

    function pointInTriangle2d(p, a, b, c) {
      const area = triArea2d(a, b, c);
      const a1 = triArea2d(p, b, c);
      const a2 = triArea2d(a, p, c);
      const a3 = triArea2d(a, b, p);
      const hasNeg = a1 < -1e-9 || a2 < -1e-9 || a3 < -1e-9;
      const hasPos = a1 > 1e-9 || a2 > 1e-9 || a3 > 1e-9;
      return Math.abs(area) > 1e-12 && !(hasNeg && hasPos);
    }

    function triArea2d(a, b, c) {
      return ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) * 0.5;
    }

    function parseCartesianTransform(entity) {
      const refs = allRefs(entity.rawArgs);
      const originRef = refs.find((id) => points.has(id));
      const origin = originRef ? points.get(originRef) : [0, 0, 0];
      const dirIds = refs.filter((id) => directions.has(id));

      let xAxis = normalize(dirIds[0] ? directions.get(dirIds[0]) : [1, 0, 0]);
      let yAxis = normalize(dirIds[1] ? directions.get(dirIds[1]) : [0, 1, 0]);
      let zAxis = normalize(dirIds[2] ? directions.get(dirIds[2]) : cross(xAxis, yAxis));
      yAxis = normalize(subtractVectors(yAxis, scaleVector(xAxis, dot(xAxis, yAxis))));
      zAxis = normalize(cross(xAxis, yAxis));

      const nums = splitStepArgs(entity.rawArgs)
        .map((arg) => arg.replace(/#\d+/g, '').trim())
        .filter((arg) => arg && arg !== '$' && arg !== '*')
        .map((arg) => Number(arg))
        .filter((value) => Number.isFinite(value));
      const sx = nums[0] ?? 1;
      const sy = nums[1] ?? sx;
      const sz = nums[2] ?? sx;

      return [
        xAxis[0] * sx, yAxis[0] * sy, zAxis[0] * sz, origin[0],
        xAxis[1] * sx, yAxis[1] * sy, zAxis[1] * sz, origin[1],
        xAxis[2] * sx, yAxis[2] * sy, zAxis[2] * sz, origin[2],
        0, 0, 0, 1
      ];
    }

    return {
      byId,
      points,
      directions,
      axisPlacements,
      localPlacements,
      shapeReps,
      productDefinitionShapes,
      profiles,
      pointLists2d,
      indexedPolyCurves,
      polylines,
      compositeCurveSegments,
      compositeCurves,
      trimmedCurves,
      circles,
      extrudes,
      booleanResults,
      loops,
      faceBounds,
      faces,
      shells,
      surfaceModels,
      breps,
      pointLists3d,
      indexedFaces,
      polygonalFaceSets,
      triangulatedFaceSets,
      representationMaps,
      mappedItems,
      cartesianTransforms,
      colourLists,
      itemColors,
      unitScale,
      resolveLocalPlacement
      , resolveProductBox,
      resolveProductMesh,
      hasProductRepresentation,
      colorForItem
    };
  }

  function productToElement(entity, index, context, options = {}) {
    if (!context.hasProductRepresentation(entity)) return null;
    const cfg = getConfig(entity.type);
    const productMesh = options.meshMode ? context.resolveProductMesh(entity) : null;
    const productBox = productMesh ? null : context.resolveProductBox(entity);
    const exportColor = productMesh?.color || productBox?.color || null;
    const semanticMaterial = semanticMaterialForType(entity.type);
    const size = productBox?.size || cfg.size;
    const geometry = productMesh ? productMesh.geometry.id : (productBox ? geometryIdForSize(entity.type, size) : cfg.geometry);
    const globalId = cleanStepString(entity.args[0]) || `#${entity.expressId}`;
    const name = cleanStepString(entity.args[2]) || `${entity.type} #${entity.expressId}`;
    const objectType = cleanStepString(entity.args[4]) || '';
    const placementId = refId(entity.args[5]);
    const placementMatrix = placementId ? context.resolveLocalPlacement(placementId) : null;
    const ifcPosition = placementMatrix ? matrixTranslation(placementMatrix) : null;
    const basePosition = ifcPosition ? ifcToYUp(ifcPosition).map((value) => value * context.unitScale) : layoutPosition(index, entity.type);
    const position = productBox ? addVectors(basePosition, productBox.centerOffset) : basePosition;
    const rotation = placementMatrix ? ifcMatrixToYUpEuler(placementMatrix) : [0, 0, 0];
    const meshMatrix = productMesh && placementMatrix
      ? ifcMatrixToYUpRows(multiplyMatrices(placementMatrix, productMesh.matrixIfc || identityMatrix()), context.unitScale)
      : null;

    return {
      id: `ifc-${entity.expressId}`,
      type: entity.type,
      name,
      geometry,
      geometrySize: productMesh ? undefined : roundVector(size),
      geometryDef: productMesh ? convertMeshGeometry(productMesh.geometry) : undefined,
      material: semanticMaterial || (exportColor ? materialIdForColor(exportColor) : cfg.material),
      materialDef: semanticMaterial || !exportColor ? undefined : materialDefForColor(exportColor),
      transform: meshMatrix ? { matrix: meshMatrix } : { position: roundVector(position), rotation: roundVector(rotation) },
      source: {
        expressId: entity.expressId,
        globalId,
        placementId
      },
      properties: {
        ExpressId: String(entity.expressId),
        GlobalId: globalId,
        IfcType: entity.type,
        Discipline: disciplineForIfcType(entity.type),
        ObjectType: objectType || '-',
        Placement: placementId ? `#${placementId}` : 'fallback-grid',
        GeometrySource: productMesh?.source || productBox?.source || 'type-proxy',
        GeometryFallbackReason: geometryFallbackReason(productMesh, productBox),
        ExportColor: exportColor ? colorToHex(exportColor) : '-',
        ShapeRepresentation: productBox?.representationId ? `#${productBox.representationId}` : '-',
        Solid: (productMesh?.solidId || productBox?.solidId) ? `#${productMesh?.solidId || productBox?.solidId}` : '-',
        Profile: (productMesh?.profileId || productBox?.profileId) ? `#${productMesh?.profileId || productBox?.profileId}` : '-',
        MappedItem: (productMesh?.mappedItemId || productBox?.mappedItemId) ? `#${productMesh?.mappedItemId || productBox?.mappedItemId}` : '-',
        RepresentationMap: (productMesh?.repMapId || productBox?.repMapId) ? `#${productMesh?.repMapId || productBox?.repMapId}` : '-'
      }
    };
  }

  function geometryFallbackReason(productMesh, productBox) {
    if (productMesh) return 'resolved-mesh';
    if (!productBox) return 'type-proxy';
    const source = productBox.source || '';
    if (source.includes('bounds-box')) return 'representation-bounds-box';
    if (source.includes('extrude')) return 'resolved-swept-solid-bounds';
    return 'representation-box';
  }

  function disciplineForIfcType(type) {
    const value = String(type || '').toUpperCase();
    if (value === 'IFCSPACE') return 'space';
    if (value.includes('FLOW') || value.includes('DUCT') || value.includes('PIPE') || value.includes('CABLE')) return 'mep';
    if ([
      'IFCWALL',
      'IFCWALLSTANDARDCASE',
      'IFCSLAB',
      'IFCROOF',
      'IFCDOOR',
      'IFCWINDOW',
      'IFCCOLUMN',
      'IFCMEMBER',
      'IFCPLATE',
      'IFCRAILING',
      'IFCSTAIR',
      'IFCCURTAINWALL'
    ].includes(value)) return 'building';
    if (value === 'IFCBUILDINGELEMENTPROXY') return 'proxy';
    return 'other';
  }

  function layoutPosition(index, type) {
    const typeBucket = [...PRODUCT_TYPES].indexOf(type);
    const column = index % 24;
    const row = Math.floor(index / 24) % 24;
    const level = Math.floor(index / (24 * 24));
    const typeOffset = typeBucket >= 0 ? (typeBucket % 5) * 0.16 : 0;
    return [
      (column - 11.5) * 1.35,
      0.15 + level * 3.2,
      (row - 11.5) * 1.35 + typeOffset
    ];
  }

  function cleanStepString(value) {
    if (!value || value === '$' || value === '*') return '';
    const trimmed = value.trim();
    if (!trimmed.startsWith("'") || !trimmed.endsWith("'")) return trimmed;
    return trimmed
      .slice(1, -1)
      .replace(/''/g, "'");
  }

  function getConfig(type) {
    return TYPE_CONFIG[type] || TYPE_CONFIG.IFCBUILDINGELEMENTPROXY;
  }

  function semanticMaterialForType(type) {
    const value = String(type || '').toUpperCase();
    if (value.includes('PIPE')) return 'mep-pipe';
    if (value.includes('DUCT') || value === 'IFCFLOWSEGMENT' || value === 'IFCFLOWFITTING') return 'mep-duct';
    if (value.includes('CABLE')) return 'mep-cable-tray';
    if (value.includes('TERMINAL') || value === 'IFCAIRTERMINAL') return 'mep-terminal';
    if (value.includes('ELECTRIC') || value.includes('CONTROLLER') || value.includes('METER') || value.includes('TREATMENT')) return 'mep-equipment';
    return null;
  }

  function refId(value) {
    const match = String(value || '').match(/#(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function allRefs(value) {
    const matches = String(value || '').match(/#(\d+)/g) || [];
    return matches.map((ref) => Number(ref.slice(1)));
  }

  function numberArgs(value) {
    return (String(value || '').match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(Number);
  }

  function firstNumber(value) {
    const nums = numberArgs(value);
    return nums.length ? nums[0] : null;
  }

  function parseNestedNumberTuples(value, dimensions) {
    const tuples = [];
    const input = String(value || '');
    const re = /\(([^()]+)\)/g;
    let match;
    while ((match = re.exec(input))) {
      const nums = numberArgs(match[1]);
      if (nums.length < dimensions) continue;
      tuples.push(nums.slice(0, dimensions));
    }
    return tuples;
  }

  function convertMeshGeometry(geometry) {
    return {
      id: geometry.id,
      kind: 'mesh',
      positions: geometry.positions,
      indices: geometry.indices
    };
  }

  function materialIdForColor(color) {
    return `ifc-${colorToHex(color).slice(1)}-${Math.round((color.a ?? 1) * 100)}`;
  }

  function materialDefForColor(color) {
    const finish = materialFinishForColor(color);
    return {
      id: materialIdForColor(color),
      color: colorToHex(color),
      opacity: Math.round((color.a ?? 1) * 1000) / 1000,
      roughness: finish.roughness,
      metalness: finish.metalness,
      finishClass: finish.finishClass,
      materialRole: finish.materialRole
    };
  }

  function materialFinishForColor(color) {
    const opacity = color.a ?? 1;
    const max = Math.max(color.r || 0, color.g || 0, color.b || 0);
    const min = Math.min(color.r || 0, color.g || 0, color.b || 0);
    const chroma = max - min;
    const lightness = (max + min) * 0.5;
    if (opacity < 0.6 || (opacity < 0.85 && lightness > 0.78)) {
      return { finishClass: 'glass', materialRole: 'enclosure', roughness: 0.18, metalness: 0 };
    }
    if (chroma < 0.08 && lightness < 0.45) {
      return { finishClass: 'metal', materialRole: 'generic-metal', roughness: 0.52, metalness: 0.06 };
    }
    if (lightness > 0.72 && chroma < 0.12) {
      return { finishClass: 'mineral', materialRole: 'generic-mineral', roughness: 0.78, metalness: 0 };
    }
    return { finishClass: 'authored', materialRole: 'authored-color', roughness: 0.64, metalness: 0.01 };
  }

  function colorToHex(color) {
    const r = Math.round(clamp01(color.r) * 255).toString(16).padStart(2, '0');
    const g = Math.round(clamp01(color.g) * 255).toString(16).padStart(2, '0');
    const b = Math.round(clamp01(color.b) * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  function detectLengthUnitScale(entities) {
    for (const entity of entities) {
      if (entity.type !== 'IFCSIUNIT') continue;
      const raw = entity.rawArgs.toUpperCase();
      if (!raw.includes('LENGTHUNIT') || !raw.includes('METRE')) continue;
      if (raw.includes('.MILLI.')) return 0.001;
      if (raw.includes('.CENTI.')) return 0.01;
      if (raw.includes('.DECI.')) return 0.1;
      if (raw.includes('.KILO.')) return 1000;
      return 1;
    }
    return 1;
  }

  function parseTupleNumbers(value, dimensions, fallback) {
    const matches = String(value || '').match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
    if (!matches) return fallback.slice();
    const out = matches.slice(0, dimensions).map(Number);
    while (out.length < dimensions) out.push(0);
    return out;
  }

  function identityMatrix() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  function multiplyMatrices(a, b) {
    const out = new Array(16).fill(0);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (let k = 0; k < 4; k++) {
          out[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
        }
      }
    }
    return out;
  }

  function applyMatrixToPoint(matrix, point) {
    return [
      matrix[0] * point[0] + matrix[1] * point[1] + matrix[2] * point[2] + matrix[3],
      matrix[4] * point[0] + matrix[5] * point[1] + matrix[6] * point[2] + matrix[7],
      matrix[8] * point[0] + matrix[9] * point[1] + matrix[10] * point[2] + matrix[11]
    ];
  }

  function ifcMatrixToYUpRows(matrix, unitScale) {
    const origin = ifcToYUp(applyMatrixToPoint(matrix, [0, 0, 0])).map((value) => value * unitScale);
    const x = ifcToYUp(applyMatrixToPoint(matrix, [1, 0, 0])).map((value) => value * unitScale);
    const y = ifcToYUp(applyMatrixToPoint(matrix, [0, 1, 0])).map((value) => value * unitScale);
    const z = ifcToYUp(applyMatrixToPoint(matrix, [0, 0, 1])).map((value) => value * unitScale);
    const cx = subtractVectors(x, origin);
    const cy = subtractVectors(y, origin);
    const cz = subtractVectors(z, origin);
    return roundVector([
      cx[0], cy[0], cz[0], origin[0],
      cx[1], cy[1], cz[1], origin[1],
      cx[2], cy[2], cz[2], origin[2],
      0, 0, 0, 1
    ]);
  }

  function matrixTranslation(matrix) {
    return [matrix[3], matrix[7], matrix[11]];
  }

  function addVectors(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scaleVector(v, scalar) {
    return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function geometryIdForSize(type, size) {
    return `box-${type.toLowerCase()}-${size.map((value) => Math.round(value * 1000)).join('x')}`;
  }

  function roundVector(values, precision = 5) {
    const factor = 10 ** precision;
    return values.map((value) => Math.round((value || 0) * factor) / factor);
  }

  function roundNumber(value, precision = 5) {
    const factor = 10 ** precision;
    return Math.round((value || 0) * factor) / factor;
  }

  function roundMeshNumber(value) {
    return roundNumber(value, MESH_COORDINATE_PRECISION);
  }

  function percentile(sortedValues, ratio) {
    if (!sortedValues.length) return 0;
    const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * ratio)));
    return Math.round(sortedValues[index] * 100000) / 100000;
  }

  function emptyBBox() {
    return {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
      valid: false
    };
  }

  function expandBBox(box, point) {
    for (let i = 0; i < 3; i++) {
      box.min[i] = Math.min(box.min[i], point[i]);
      box.max[i] = Math.max(box.max[i], point[i]);
    }
    box.valid = true;
  }

  function bboxFromCenterSize(center, size) {
    return {
      min: [
        center[0] - size[0] * 0.5,
        center[1] - size[1] * 0.5,
        center[2] - size[2] * 0.5
      ],
      max: [
        center[0] + size[0] * 0.5,
        center[1] + size[1] * 0.5,
        center[2] + size[2] * 0.5
      ],
      valid: true
    };
  }

  function transformBBox(bbox, matrix) {
    const out = emptyBBox();
    for (const x of [bbox.min[0], bbox.max[0]]) {
      for (const y of [bbox.min[1], bbox.max[1]]) {
        for (const z of [bbox.min[2], bbox.max[2]]) {
          expandBBox(out, applyMatrixToPoint(matrix, [x, y, z]));
        }
      }
    }
    return out;
  }

  function cloneBBox(bbox) {
    return {
      min: bbox.min.slice(),
      max: bbox.max.slice(),
      valid: bbox.valid
    };
  }

  function ifcToYUp(point) {
    return [point[0], point[2], -point[1]];
  }

  function ifcMatrixToYUpEuler(matrix) {
    const xAxis = normalize(ifcToYUp([matrix[0], matrix[4], matrix[8]]));
    const yaw = Math.atan2(xAxis[2], xAxis[0]);
    return [0, -yaw * 180 / Math.PI, 0];
  }

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    if (!len) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function countBy(items, getKey) {
    const counts = {};
    for (const item of items) {
      const key = getKey(item);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  const api = {
    VERSION,
    convertIfcTextToVRIFC,
    mergeVRIFCDocs,
    buildIfcContext,
    parseStepEntities,
    splitStepArgs
  };

  global.VRIFCConverter = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
