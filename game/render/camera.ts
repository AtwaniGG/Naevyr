// Camera: holds the iso-world point at screen center, plus zoom. Smoothly
// follows a target. Provides world<->screen conversions for render & picking.

export class Camera {
  // iso-world coordinates the camera is centered on
  x = 0;
  y = 0;
  // follow target
  tx = 0;
  ty = 0;
  zoom = 1;
  targetZoom = 1;

  viewW = 0;
  viewH = 0;

  readonly minZoom = 0.5;
  readonly maxZoom = 2.2;

  setViewport(w: number, h: number) {
    this.viewW = w;
    this.viewH = h;
  }

  follow(isoX: number, isoY: number) {
    this.tx = isoX;
    this.ty = isoY;
  }

  snapTo(isoX: number, isoY: number) {
    this.x = this.tx = isoX;
    this.y = this.ty = isoY;
  }

  zoomBy(delta: number, _sx: number, _sy: number) {
    const factor = delta > 0 ? 0.9 : 1.1;
    this.targetZoom = clamp(this.targetZoom * factor, this.minZoom, this.maxZoom);
  }

  update(dt: number) {
    const k = 1 - Math.pow(0.0001, dt); // smooth, framerate-independent
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k;
    this.zoom += (this.targetZoom - this.zoom) * k;
  }

  /** iso-world -> canvas pixel */
  worldToScreen(ix: number, iy: number): { x: number; y: number } {
    return {
      x: (ix - this.x) * this.zoom + this.viewW / 2,
      y: (iy - this.y) * this.zoom + this.viewH / 2,
    };
  }

  /** canvas pixel -> iso-world */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.viewW / 2) / this.zoom + this.x,
      y: (sy - this.viewH / 2) / this.zoom + this.y,
    };
  }
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
