import { MediaFile } from "./media_files";

export class Entry {
  public id!: number;
  public title: string = '';
  public content?: string;
  public created_at: string = '';
  public updated_at: string = '';
  public location_name?: string;
  public mood?: string;
  public is_synced: boolean = false;
  public offline_id?: string;
  public mediaFiles: MediaFile[] = [];
}