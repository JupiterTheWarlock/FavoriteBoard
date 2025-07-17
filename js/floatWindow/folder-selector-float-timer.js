/**
 * CountdownRing - SVG环形倒计时组件
 * 用于FavoriteBoard悬浮窗自动关闭倒计时
 *
 * 用法：
 *   const ring = new CountdownRing({
 *     duration: 5, // 秒
 *     size: 28,    // px
 *     stroke: 3,   // px
 *     color: '#f66',
 *     bgColor: '#eee',
 *     onComplete: () => { ... }
 *   });
 *   dom.appendChild(ring.svg);
 *   ring.start();
 *   ring.pause();
 *   ring.resume();
 *   ring.destroy();
 */
export class CountdownRing {
  constructor({ duration = 5, size = 28, stroke = 3, color = '#f66', bgColor = '#eee', onComplete = null } = {}) {
    this.duration = duration;
    this.size = size;
    this.stroke = stroke;
    this.color = color;
    this.bgColor = bgColor;
    this.onComplete = onComplete;
    this.radius = (size - stroke) / 2;
    this.svg = this._createSVG();
    this._rafId = null;
    this._start = null;
    this._pausedAt = null;
    this._elapsed = 0;
    this._running = false;
  }

  // ==================== 公共API ====================

  start() {
    this._start = Date.now();
    this._running = true;
    this._update();
  }

  pause() {
    if (!this._running || this._pausedAt) return;
    this._pausedAt = Date.now();
    cancelAnimationFrame(this._rafId);
  }

  resume() {
    if (!this._running || !this._pausedAt) return;
    this._start += Date.now() - this._pausedAt;
    this._pausedAt = null;
    this._update();
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    this._running = false;
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }

  // ==================== 私有方法 ====================

  _createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.size);
    svg.setAttribute('height', this.size);
    svg.style.display = 'block';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.transform = 'rotate(-90deg)';
    svg.style.pointerEvents = 'none';

    // 背景环
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', this.size / 2);
    bg.setAttribute('cy', this.size / 2);
    bg.setAttribute('r', this.radius);
    bg.setAttribute('stroke', this.bgColor);
    bg.setAttribute('stroke-width', this.stroke);
    bg.setAttribute('fill', 'none');
    svg.appendChild(bg);

    // 前景环
    this.fg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.fg.setAttribute('cx', this.size / 2);
    this.fg.setAttribute('cy', this.size / 2);
    this.fg.setAttribute('r', this.radius);
    this.fg.setAttribute('stroke', this.color);
    this.fg.setAttribute('stroke-width', this.stroke);
    this.fg.setAttribute('fill', 'none');
    this.fg.setAttribute('stroke-linecap', 'round');
    this.fg.setAttribute('stroke-dasharray', 2 * Math.PI * this.radius);
    this.fg.setAttribute('stroke-dashoffset', 0);
    svg.appendChild(this.fg);

    return svg;
  }

  _update() {
    if (!this._running) return;
    const now = Date.now();
    const elapsed = this._pausedAt ? this._elapsed : (now - this._start) / 1000;
    const left = Math.max(0, this.duration - elapsed);
    const percent = left / this.duration;
    this.fg.setAttribute('stroke-dashoffset', (1 - percent) * 2 * Math.PI * this.radius);
    if (left > 0) {
      this._rafId = requestAnimationFrame(this._update.bind(this));
    } else {
      this._running = false;
      if (typeof this.onComplete === 'function') this.onComplete();
    }
  }
} 