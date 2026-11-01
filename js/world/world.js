'use strict';

const SOLIDS = [];

const WORLD = {
  seed: 1,
  chunks: [],
  nextIndex: 0,
  groundY: GROUND_Y,

  reset(seed) {
    this.seed = (seed == null ? Math.floor(Math.random() * 1e9) : seed) >>> 0;
    this.chunks = [];
    this.nextIndex = 0;
    SOLIDS.length = 0;
  },

  ensure(untilX) {
    const created = [];
    while (this.nextIndex * CHUNK_W < untilX) {
      const chunk = generateChunk(this.nextIndex, this.seed);
      this.chunks.push(chunk);
      created.push(chunk);
      this.nextIndex++;
    }
    if (created.length) rebuildSolids();
    return created;
  },

  cull(cameraX) {
    const cutoff = cameraX - 3400;
    let removed = false;
    while (this.chunks.length && this.chunks[0].endX < cutoff) {
      this.chunks.shift();
      removed = true;
    }
    if (removed) rebuildSolids();
  },

  groundAt(x) {
    for (const chunk of this.chunks) {
      if (x < chunk.startX || x >= chunk.endX) continue;
      for (const seg of chunk.ground) {
        if (x >= seg.x && x <= seg.x + seg.w) return seg;
      }
      return null;
    }
    return null;
  },

  platformAt(x, feetY) {
    for (const chunk of this.chunks) {
      if (x < chunk.startX || x >= chunk.endX) continue;
      for (const p of chunk.platforms) {
        if (x >= p.x && x <= p.x + p.w && Math.abs(p.y - feetY) < 4) return p;
      }
    }
    return null;
  },

  solidBelow(x, y) {
    let best = null;
    for (const s of SOLIDS) {
      if (x >= s.x && x <= s.x + s.w && s.y >= y - 12 && s.y <= y + 56) {
        if (!best || s.y < best.y) best = s;
      }
    }
    return best;
  },

  findGroundNear(x, maxDelta) {
    if (this.groundAt(x)) return x;
    for (let d = 40; d <= maxDelta; d += 40) {
      if (this.groundAt(x - d)) return x - d;
      if (this.groundAt(x + d)) return x + d;
    }
    return null;
  }
};

function rebuildSolids() {
  SOLIDS.length = 0;
  for (const chunk of WORLD.chunks) {
    for (const seg of chunk.ground) {
      SOLIDS.push({ x: seg.x, y: GROUND_Y, w: seg.w, h: 240, kind: 'ground' });
    }
    for (const p of chunk.platforms) {
      SOLIDS.push({ x: p.x, y: p.y, w: p.w, h: 18, kind: 'platform', oneWay: true });
    }
  }
}
