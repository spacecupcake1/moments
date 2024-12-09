import { MediaFile } from "./media_files";
import { Location } from "./location";

export class Entry {
    public id!: number;
    public title: string = '';
    public content?: string;
    public created_at: string = '';
    public updated_at: string = '';
    public mood?: string;
    public is_synced: boolean = false;
    public offline_id?: string;
    public location_id?: number;
    public location?: Location;
    public mediaFiles: MediaFile[] = [];
}