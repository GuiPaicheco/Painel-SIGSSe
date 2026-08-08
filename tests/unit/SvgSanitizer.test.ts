import { describe, it, expect } from 'vitest';
import { SvgSanitizer } from '../../src/utils/svgSanitizer';

describe('SvgSanitizer', () => {
  it('deve preservar um SVG válido e inofensivo', () => {
    const validSvg = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#0288D1"/></svg>';
    const sanitized = SvgSanitizer.sanitize(validSvg);

    expect(sanitized).toContain('<circle');
    expect(sanitized).toContain('fill="#0288D1"');
  });

  it('deve remover tags <script> de um SVG malicioso', () => {
    const maliciousSvg = '<svg viewBox="0 0 64 64"><script>alert("XSS")</script><circle cx="32" cy="32" r="20"/></svg>';
    const sanitized = SvgSanitizer.sanitize(maliciousSvg);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('<circle');
  });

  it('deve remover manipuladores de evento inline como onload, onclick, onmouseover', () => {
    const maliciousSvg = '<svg viewBox="0 0 64 64" onload="alert(1)"><circle cx="32" cy="32" r="20" onclick="alert(2)"/></svg>';
    const sanitized = SvgSanitizer.sanitize(maliciousSvg);

    expect(sanitized).not.toContain('onload');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('alert');
  });

  it('deve remover links javascript: em atributos href', () => {
    const maliciousSvg = '<svg viewBox="0 0 64 64"><a href="javascript:alert(1)"><circle cx="32" cy="32" r="20"/></a></svg>';
    const sanitized = SvgSanitizer.sanitize(maliciousSvg);

    expect(sanitized).not.toContain('javascript:');
  });
});
