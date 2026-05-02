import { useEffect, useState } from 'react';

interface ProbPoint {
  t: number;
  yes: number;
}

export default function ProbabilityChart({ history }: { history?: ProbPoint[] }) {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    if (!history || history.length < 2) {
      setSvg('');
      return;
    }

    const sorted = [...history].sort((a, b) => a.t - b.t);
    const w = 300;
    const h = 100;
    const padding = 10;
    const innerW = w - 2 * padding;
    const innerH = h - 2 * padding;

    const minY = 0;
    const maxY = 100;
    const yRange = maxY - minY;

    let path = '';
    sorted.forEach((p, i) => {
      const x = padding + (i / Math.max(1, sorted.length - 1)) * innerW;
      const normalizedY = Math.max(0, Math.min(100, p.yes || 50));
      const y = padding + innerH - (normalizedY - minY) / yRange * innerH;
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    // Fill area under curve
    const firstY = padding + innerH - ((sorted[0].yes || 50) - minY) / yRange * innerH;
    const lastY = padding + innerH - ((sorted[sorted.length - 1].yes || 50) - minY) / yRange * innerH;
    const firstX = padding;
    const lastX = padding + innerW;
    const areaPath = `M ${firstX} ${firstY} ${path.slice(1)} L ${lastX} ${innerH + padding} L ${firstX} ${innerH + padding} Z`;

    const svgString = `
      <svg width="100%" height="100" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: rgba(99, 102, 241, 0.3); stop-opacity: 1" />
            <stop offset="100%" style="stop-color: rgba(99, 102, 241, 0); stop-opacity: 1" />
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#grad)" />
        <path d="${path}" fill="none" stroke="rgba(99, 102, 241, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="${padding}" y1="${padding + innerH / 2}" x2="${padding + innerW}" y2="${padding + innerH / 2}" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="2" />
      </svg>
    `;

    setSvg(svgString);
  }, [history]);

  if (!svg) return <div className="text-xs text-gray-600 py-8 text-center">Недостаточно данных для графика</div>;

  return (
    <div className="w-full" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
