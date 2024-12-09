export class MediaFile {
  public id!: number;
  public entry!: number;
  public file_type!: 'image' | 'audio';
  public file_url?: string;
  public file_path?: string;
  public created_at: string = '';
  public is_synced: boolean = false;
  public offline_storage_path?: string;
}
