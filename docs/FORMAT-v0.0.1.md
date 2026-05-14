# VR-IFC Format v0.0.1

VR-IFC is the headset-facing format for the VR viewer. It is not meant to replace IFC as the source of truth. IFC remains the authoring/exchange format; VR-IFC is the optimized runtime payload.

## Goals

- Load quickly in Meta Quest 3 Browser/WebXR.
- Reduce draw calls through instancing.
- Preserve IFC identity: product id, type, name, system, level, and selected property sets.
- Allow future binary geometry payloads without changing the viewer's interaction model.
- Keep conversion deterministic so a selected VR object can be traced back to the original IFC element.

## Current Payload

Version `0.0.1` is JSON-only and intentionally simple.

```json
{
  "format": "vr-ifc",
  "version": "0.0.1",
  "units": "m",
  "axis": "Y_UP",
  "project": { "name": "Example" },
  "materials": [],
  "geometries": [],
  "elements": []
}
```

Converter-generated files may also include:

```json
{
  "source": { "name": "model.ifc", "kind": "IFC", "convertedAt": "..." },
  "conversion": { "geometryMode": "representation-bounds-box" }
}
```

### Materials

```json
{ "id": "concrete", "color": "#aeb9c8", "roughness": 0.82, "opacity": 1 }
```

### Geometries

`v0.0.1` supports procedural boxes and reusable indexed meshes. This keeps the first runtime format simple while allowing the converter to move real geometry into the VR reader.

```json
{ "id": "wall-long", "kind": "box", "size": [12, 3, 0.22] }
```

The converter can also emit reusable mesh geometry:

```json
{
  "id": "mesh-surface-462",
  "kind": "mesh",
  "positions": [0, 0, 0, 1, 0, 0, 0, 1, 0],
  "indices": [0, 1, 2]
}
```

Mesh elements may use `transform.matrix`, a row-major 4x4 matrix that maps IFC-local mesh coordinates into VR-IFC Y-up meters.

Materials may be generated from IFC styled item colors. Elements preserve the parsed source color in `properties.ExportColor`.

### Optional Render Batches

Large packaged projects may include `renderBatches` as an optional compatibility bridge before `v0.0.2` binary payloads exist. A render batch is a premerged mesh used for fast all-model overview rendering while the original elements and reusable geometries remain in the document for filtering, identity, and inspection.

```json
{
  "renderBatches": [
    {
      "id": "render-batch-detail-1",
      "kind": "mesh-batch",
      "material": "concrete",
      "positions": [0, 0, 0],
      "indices": [0, 1, 2],
      "source": {
        "role": "detail-mesh-performance-batch",
        "drawObjects": 120,
        "elements": 450
      }
    }
  ]
}
```

This is not the desired final transport for large models because transformed vertex arrays are duplicated in JSON. It exists to validate the runtime strategy: keep every part visually present in the overview, reduce draw calls, and still preserve per-element IFC identity in `elementTable`.

### Elements

Elements reference shared geometry and material records. The viewer groups matching geometry/material pairs into `THREE.InstancedMesh`.

```json
{
  "id": "duct-s-001",
  "type": "IfcDuctSegment",
  "name": "Tilluft huvudkanal",
  "geometry": "duct-long",
  "material": "supply",
  "transform": {
    "position": [0, 2.65, -1.6],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  "properties": {
    "System": "SA",
    "Flow": "420 l/s"
  }
}
```

## Planned Binary Shape

The next practical format, expected as `v0.0.2`, should become a small manifest plus binary buffers:

- `model.vrifc.json`: project, materials, geometry groups, element metadata.
- `geometry.bin`: quantized vertex/index buffers, grouped by reusable shape and prebuilt overview batches.
- Optional `model.glb`: for geometry transport if GLB proves simpler and fast enough on Quest.

The important design point is that metadata stays outside the mesh transport. That lets us swap geometry encoding later without rewriting selection, properties, hide/isolate, or system filters.

The current large-project data suggests this direction is necessary: JSON-only VR-safe packages can be compact when they reuse geometry, while JSON render batches reduce draw calls but substantially increase gzip size. Binary buffers should let the project keep the draw-call benefit without paying the JSON duplication cost.

## Converter Direction

The standalone converter reads IFC text, extracts common product entities, preserves identity metadata, resolves local placements where available, and emits:

- reusable meshes from `IFCFACETEDBREP`, shell surface models, `IFCPOLYGONALFACESET`, and `IFCTRIANGULATEDFACESET`;
- prism meshes from `IFCEXTRUDEDAREASOLID` rectangle, circle, hollow circle, and arbitrary indexed polycurve profiles, with inner void side faces where present;
- representation-sized boxes only when a supported mesh representation cannot be emitted;
- mapped meshes or boxes through `IFCMAPPEDITEM`, `IFCREPRESENTATIONMAP`, and cartesian transformation operators;
- type-based fallback boxes when no supported representation is found.

For very long, very thin MEP models, the converter may apply `sceneHints.visualMinThickness` to proxy geometry so the overview remains visible and clickable. The original size signal is still preserved in `sceneHints.medianElementMaxDim`.

This gives the project the intended process:

```text
IFC -> standalone converter -> VRIFC runtime file -> VR reader
```

The real converter should then start from the existing IFC reader knowledge:

- Reuse product/type/system/property extraction from the desktop viewer.
- Continue expanding placement support before real geometry: units, mapped transforms, storey elevation, and representation transforms.
- Reuse the mapped-item color propagation discovery from W150.
- Prefer repeated mapped geometry as shared geometry plus transforms.
- Emit one element record per selectable IFC product or mapped instance.
- Preserve a lookup from VR instance to IFC product id.

The first real converter can be browser-side for experiments, but the production converter should likely run on desktop/server so Quest receives a compact runtime file instead of parsing raw IFC.
