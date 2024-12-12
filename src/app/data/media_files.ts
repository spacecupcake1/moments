export class MediaFile {
  public id!: number;
  public entry!: number;
  public file_type!: 'image' | 'audio';
  public file_url?: string;
  public file_path?: string;
  public created_at: string = '';
  public tempFile?: File;
}
