import type { CertificateDesignConfig } from './types';

export function renderTemplateText(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

export function extractTemplateVariables(...texts: string[]): string[] {
  const found = new Set<string>();
  texts.forEach(text => {
    const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
    matches.forEach(token => found.add(token.replace(/[{}]/g, '')));
  });
  return [...found];
}

export function buildContentFromDesign(design: CertificateDesignConfig): string {
  const parts = [
    design.fields.heading,
    design.fields.subtitle,
    design.fields.body,
    design.fields.footer,
  ].filter(Boolean);
  return parts.join('\n\n');
}

export function collectDesignVariables(design: CertificateDesignConfig): string[] {
  return extractTemplateVariables(
    design.fields.heading,
    design.fields.subtitle,
    design.fields.body,
    design.fields.footer,
  );
}

export function renderDesignFields(
  design: CertificateDesignConfig,
  variables: Record<string, string>,
): CertificateDesignConfig['fields'] {
  return {
    heading: renderTemplateText(design.fields.heading, variables),
    subtitle: renderTemplateText(design.fields.subtitle, variables),
    body: renderTemplateText(design.fields.body, variables),
    footer: renderTemplateText(design.fields.footer, variables),
  };
}
