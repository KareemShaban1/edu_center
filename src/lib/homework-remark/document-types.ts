import type { RemarkPage } from './types';

export type RemarkSourceType = 'pdf' | 'image';

export type RemarkDocument = {
  pages: RemarkPage[];
  sourceType: RemarkSourceType;
  originalBytes: Uint8Array;
};

export type RemarkExportInput = RemarkDocument;
