/**
 * Sanitizador Rígido para Strings SVG Remotas — Painel SIGSSe 2.0
 * Bloqueia injeções XSS, tags perigosas e scripts inline.
 */

export class SvgSanitizer {
  private static DANGEROUS_TAGS = ['script', 'iframe', 'embed', 'object', 'foreignobject', 'base', 'form', 'input', 'meta', 'link'];

  public static sanitize(svgContent: string): string {
    if (!svgContent || typeof svgContent !== 'string') {
      return '';
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');

      // Se houver erro de parsing XML, limpa via regex básico
      if (doc.querySelector('parsererror')) {
        return this.regexFallbackSanitize(svgContent);
      }

      const svgNode = doc.querySelector('svg');
      if (!svgNode) {
        return '';
      }

      // Remover tags perigosas recursivamente
      this.DANGEROUS_TAGS.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.parentNode?.removeChild(el));
      });

      // Inspecionar e sanitizar todos os nós e atributos
      const allElements = doc.querySelectorAll('*');
      allElements.forEach(el => {
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => {
          const attrName = attr.name.toLowerCase();
          const attrValue = attr.value.toLowerCase();

          // Remover manipuladores de evento inline (on*)
          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
          }

          // Remover URLs javascript: e data: HTML perigosas
          if (
            (attrName === 'href' || attrName === 'xlink:href' || attrName === 'src') &&
            (attrValue.includes('javascript:') || attrValue.includes('data:text/html'))
          ) {
            el.removeAttribute(attr.name);
          }
        });
      });

      return svgNode.outerHTML;
    } catch (e) {
      return this.regexFallbackSanitize(svgContent);
    }
  }

  private static regexFallbackSanitize(raw: string): string {
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      .replace(/href\s*=\s*['"]javascript:.*?['"]/gi, '');
  }
}
