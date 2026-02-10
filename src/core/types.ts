export interface GeneratedFile {
  path: string;
  content: string;
  type: string;
  absolutePath?: string;
  binaryContent?: Buffer;
}
