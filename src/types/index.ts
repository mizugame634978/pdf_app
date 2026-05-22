export type ToolType = 'merge' | 'split' | 'rotate' | 'compress' | 'reorder' | 'imageconvert' | 'watermark';

export type AppState = 'idle' | 'configuring' | 'processing' | 'done' | 'error';

export interface PdfFile {
  id: string;
  file: File;
  name: string;
}

export interface PageRange {
  start: number;
  end: number;
}

export type RotationAngle = 90 | 180 | 270;
