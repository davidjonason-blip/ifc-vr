# VR-IFC

Version: `0.0.1`

VR-IFC is a separate WebXR-first IFC viewing experiment for Meta Quest 3. The first version loads a small custom `.vrifc.json` runtime format instead of raw IFC.

## Run

Serve the folder through a local web server and open `index.html`.

```powershell
cd C:\Users\Jonas\Desktop\ChatGPT\VR-IFC
python -m http.server 8088
```

Then open:

```text
http://localhost:8088/
```

Standalone converter:

```text
http://localhost:8088/converter/
```

Quality/regression tools:

```powershell
node converter/cli.js "../TEST IFCer/Ifc4_SampleHouse.ifc" out.vrifc.json --report out.report.json
node converter/regression.js --max-elements 100000
node converter/package.js "../TEST IFCer/W150-V-test.ifc" "../TEST IFCer/V157-V-test.ifc" --out W150-V157.package.vrifc.json --name "W150 + V157"
```

For Quest 3, host the folder on a reachable HTTPS origin or a local network server the headset can access. WebXR immersive VR is browser/permission sensitive, so the same page may show the VR button only in a compatible headset browser.

## Pipeline

```text
IFC -> converter -> .vrifc.json -> VR-IFC reader -> Quest/WebXR
```

The converter is deliberately separate from the VR reader. Quest should receive a compact runtime payload instead of parsing raw IFC while also trying to keep VR framerate.

## What v0.0.1 Does

- Loads `samples/sample-building.vrifc.json`.
- Supports drag/drop and file picker for one or more `.vrifc.json` files.
- Can merge multiple converted VRIFC files at runtime when they share world coordinates, including the W150 + V157 building test.
- Groups equal geometry/material pairs into `THREE.InstancedMesh`.
- Supports desktop orbit/pan/zoom.
- Supports WebXR controller ray selection.
- Shows per-element metadata.
- Hides selected instanced objects.
- Switches between table-scale and 1:1 placement.

## Converter v0.0.1

- Runs as a standalone browser tool at `converter/index.html`.
- Also runs from the command line with `node converter/cli.js input.ifc output.vrifc.json`.
- Emits a `qualityReport` in each `.vrifc.json` with score, geometry coverage, fallback and skipped-product reasons, authored IFC material coverage, visual material coverage, robust bounds, outlier count, and warnings.
- Supports CLI quality reports with `--report`, large-thin-MEP runtime control with `--overview auto|off|hybrid|force` (`auto` keeps production runtime geometry, `hybrid` adds debug overlay), regression checks with `converter/regression.js`, and multi-IFC packaging with `converter/package.js`.
- Reads IFC text locally in the browser.
- Extracts IFC product identity for common building and MEP entity types.
- Reads `IFCLOCALPLACEMENT`, `IFCAXIS2PLACEMENT3D`, `IFCCARTESIANPOINT`, and `IFCDIRECTION` so proxy boxes land at IFC placements when available.
- Reads `IFCEXTRUDEDAREASOLID` rectangle/circle profiles as prism meshes, arbitrary closed indexed polycurve extrudes, and mesh geometry from `IFCFACETEDBREP`, shell surface models, `IFCPOLYGONALFACESET`, and `IFCTRIANGULATEDFACESET` where available.
- Resolves polyline and simple composite-curve arbitrary profiles, including trimmed circular arcs approximated for runtime mesh, and uses the first operand of boolean clipping results as a conservative clipping-base fallback.
- Reads `IFCMAPPEDITEM` and `IFCREPRESENTATIONMAP` with cartesian transformation operators, which is the critical path for V157/W150.
- Reads styled item color chains (`IFCCOLOURRGB` -> surface rendering/style -> presentation assignment -> `IFCSTYLEDITEM`) and propagates mapped item colors into VRIFC materials.
- Emits `.vrifc.json` with reusable mesh geometry first, representation-sized boxes next, then type-based proxy boxes as fallback.
- Preserves `ExpressId`, `GlobalId`, IFC type, name, and object type.

This converter is still a pipeline-first tool, but it now extracts real reusable meshes for mapped shell geometry and IFC4 face sets. The converter can now either emit one VRIFC per IFC or package multiple separately converted IFCs into one shared-coordinate VRIFC project file.

## What Comes Next

- Treat `fastighet-full-vr-safe.package.vrifc.json.gz` as the current quality baseline: converter quality is high enough that runtime format and Quest loading are now the main risk.
- Define VR-IFC `v0.0.2` as a manifest plus binary geometry payload so render batches do not have to duplicate transformed vertex arrays in JSON.
- Keep JSON `renderBatches` as a proof-of-rendering strategy, not the final transport format.
- Build a Quest 3 budget test around package size, decompressed memory, load time, visible draw objects, and subjective movement smoothness.
- Add section planes, search, and richer VR controls after the package format is stable enough on device.

## Current Large Model Results

- `Ifc4_SampleHouse.ifc` converts to `samples/Ifc4_SampleHouse.mesh.vrifc.json`: 45 emitted elements, 45 representation elements, 0 type proxies, quality score 94/good. It now resolves polyline/composite-curve arbitrary extrudes and uses clipping-base extrudes for simple boolean clipping cases. Two skipped curtain-wall aggregate containers are reported as informational because child elements carry the geometry.
- `V157-V-test.ifc` converts to `samples/V157-V-test.mesh.vrifc.json`: 15,028 elements, 1,963 reusable mesh geometries, about 192k triangles, 100% styled colors.
- `W150-V-test.ifc` now converts with real MEP runtime classes (`linear-mep`, `mep-node`, `box-mep`) instead of relying on a permanent overview-box replacement.
- Large, very thin MEP models get adaptive runtime geometry so they remain visible in table-scale VR overview while preserving the original IFC element metadata.
- The reader can load W150 and V157 together from one packaged VRIFC project and filter by source model, discipline, system, type, and runtime layer.
- The full `TEST IFCer/fastighet` source set is 43 IFC files and about 2.19 GB on disk. The current VR-safe package is about 36 MB gzip with 195,676 elements, 50,973 geometries, 706 materials, 42 included models, 1 excluded extreme-bounds source model, 99.845% geometry coverage, and 303 type-proxy elements.
- The experimental JSON render-batch package is about 95 MB gzip. It proves that 37k detailed mesh draw objects can be represented by about 133 render batches, but the JSON payload is too large to be the final answer.
- `Ifc4_Revit_MEP.ifc` converts to `samples/Ifc4_Revit_MEP.mesh.vrifc.json`: 5,151 products, 5,114 representation elements, 0 type proxies, quality score 86/good. It reads indexed colour maps on tessellated face sets; current authored IFC colour coverage is about 16%, while visual material coverage is about 88% through IFC/type fallback materials. The 37 skipped curtain-wall/stair aggregate containers are now classified separately from missing geometry.

## Quest 3 Budget Thinking

Quest 3-class browser VR has to pay for download, gzip inflate, JSON parse, JavaScript object allocation, GPU buffer upload, and WebXR rendering. A 100-200 MB compressed file can be plausible on storage and network, but it is not automatically safe for WebXR because the in-memory representation can be many times larger.

Current target envelope for `v0.0.2`:

- Keep gzip payloads below roughly 200 MB for very large projects.
- Prefer the 30-80 MB range for normal project packages.
- Keep interactive all-model VR view under roughly 15k visible render objects, with heavy detail mesh represented by prebuilt batches.
- Move geometry arrays out of JSON and into binary buffers before optimizing more visual details.

## Quest Browser Preflight

Run a desktop Quest-like preflight before headset testing:

```powershell
cd VR-IFC
python -m http.server 8088 --bind 127.0.0.1
cd ..
node tools\vr-ifc-quest-browser-sim.js
```

The script starts a headless Edge/Chrome session with a Quest Browser-style user agent and tall mobile viewport, then loads the largest available VRIFC packages. It checks load time, payload size, draw-object budget, canvas non-blank rendering, console warnings/errors, WebXR fallback state, and core controls such as IFCSPACE toggle and presets. Outputs are written to `VR-IFC/.scratch/quest-sim/`.

This is a preflight, not a replacement for a real Quest 3 test. Desktop browser automation cannot prove immersive WebXR session support, controller tracking, headset thermal behavior, or real VR framerate.
