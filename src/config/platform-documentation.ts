export interface PlatformDocEntry {
  id: string;
  file: string;
  titleKey: string;
  descriptionKey: string;
}

/** Catalog mirrors files under /docs — copied to public/docs by npm run docs:sync */
export const PLATFORM_DOCUMENTATION: PlatformDocEntry[] = [
  {
    id: 'index',
    file: 'README.md',
    titleKey: 'docs.index.title',
    descriptionKey: 'docs.index.desc',
  },
  {
    id: 'brd',
    file: '01-business-requirements.md',
    titleKey: 'docs.brd.title',
    descriptionKey: 'docs.brd.desc',
  },
  {
    id: 'srs',
    file: '02-software-requirements.md',
    titleKey: 'docs.srs.title',
    descriptionKey: 'docs.srs.desc',
  },
  {
    id: 'prd',
    file: '03-product-requirements.md',
    titleKey: 'docs.prd.title',
    descriptionKey: 'docs.prd.desc',
  },
  {
    id: 'user-stories',
    file: '04-user-stories-and-use-cases.md',
    titleKey: 'docs.userStories.title',
    descriptionKey: 'docs.userStories.desc',
  },
  {
    id: 'architecture',
    file: '05-system-architecture.md',
    titleKey: 'docs.architecture.title',
    descriptionKey: 'docs.architecture.desc',
  },
  {
    id: 'database',
    file: '06-database.md',
    titleKey: 'docs.database.title',
    descriptionKey: 'docs.database.desc',
  },
  {
    id: 'api',
    file: '07-api.md',
    titleKey: 'docs.api.title',
    descriptionKey: 'docs.api.desc',
  },
  {
    id: 'ui-ux',
    file: '08-ui-ux.md',
    titleKey: 'docs.uiUx.title',
    descriptionKey: 'docs.uiUx.desc',
  },
  {
    id: 'development',
    file: '09-development.md',
    titleKey: 'docs.development.title',
    descriptionKey: 'docs.development.desc',
  },
  {
    id: 'security',
    file: '10-security.md',
    titleKey: 'docs.security.title',
    descriptionKey: 'docs.security.desc',
  },
  {
    id: 'deployment',
    file: '11-deployment.md',
    titleKey: 'docs.deployment.title',
    descriptionKey: 'docs.deployment.desc',
  },
  {
    id: 'testing',
    file: '12-testing.md',
    titleKey: 'docs.testing.title',
    descriptionKey: 'docs.testing.desc',
  },
  {
    id: 'user-guide',
    file: '13-user-guide.md',
    titleKey: 'docs.userGuide.title',
    descriptionKey: 'docs.userGuide.desc',
  },
];

export const DEFAULT_PLATFORM_DOC_ID = 'index';

export function getPlatformDocById(id: string | undefined): PlatformDocEntry {
  return PLATFORM_DOCUMENTATION.find(d => d.id === id) ?? PLATFORM_DOCUMENTATION[0];
}

export function getPlatformDocUrl(id: string): string {
  return `/platform/documentation/${id}`;
}

export function getDeveloperDocUrl(id: string): string {
  return `/developer/documentation/${id}`;
}
