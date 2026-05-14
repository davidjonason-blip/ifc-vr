'use strict';

function extractRenderBatchBinary(doc, options = {}) {
  const batches = doc?.renderBatches || [];
  const uri = options.uri || 'geometry.bin';
  const chunks = [];
  let byteOffset = 0;
  let converted = 0;

  const nextDoc = {
    ...doc,
    renderBatches: batches.map((batch) => {
      if (!Array.isArray(batch.positions) || !Array.isArray(batch.indices)) return batch;
      const positions = Float32Array.from(batch.positions);
      const indices = Uint32Array.from(batch.indices);
      const positionBuffer = Buffer.from(positions.buffer);
      const indexBuffer = Buffer.from(indices.buffer);
      const positionView = {
        buffer: 0,
        byteOffset,
        byteLength: positionBuffer.byteLength,
        componentType: 'FLOAT32',
        itemSize: 3,
        count: positions.length / 3
      };
      chunks.push(positionBuffer);
      byteOffset += positionBuffer.byteLength;
      const indexView = {
        buffer: 0,
        byteOffset,
        byteLength: indexBuffer.byteLength,
        componentType: 'UINT32',
        itemSize: 1,
        count: indices.length
      };
      chunks.push(indexBuffer);
      byteOffset += indexBuffer.byteLength;
      converted++;
      const { positions: _positions, indices: _indices, ...rest } = batch;
      return {
        ...rest,
        bufferViews: {
          positions: positionView,
          indices: indexView
        }
      };
    })
  };

  const binary = Buffer.concat(chunks);
  const qualityReport = doc.qualityReport
    ? {
      ...doc.qualityReport,
      summary: {
        ...(doc.qualityReport.summary || {}),
        binaryGeometryBytes: binary.byteLength,
        binaryRenderBatchCount: converted,
        renderBatchTransport: converted ? 'binary-sidecar' : 'json'
      }
    }
    : doc.qualityReport;
  const conversion = doc.conversion
    ? {
      ...doc.conversion,
      geometryPayload: converted ? 'json-manifest-binary-render-batches' : doc.conversion.geometryPayload
    }
    : doc.conversion;
  nextDoc.binaryGeometry = {
    schema: 'vrifc-binary-geometry-v1',
    buffers: binary.length ? [{ uri, byteLength: binary.byteLength }] : [],
    renderBatchCount: converted
  };
  nextDoc.qualityReport = qualityReport;
  nextDoc.conversion = conversion;

  return { doc: nextDoc, binary };
}

module.exports = {
  extractRenderBatchBinary
};
