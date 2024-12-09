import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Entry } from 'src/app/data/entry';
import { Location } from 'src/app/data/location';
import { MediaFile } from 'src/app/data/media_files';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntriesService {
  private entries = new BehaviorSubject<Entry[]>([]);
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.SUPABASE_URL,
      environment.SUPABASE_KEY
    );
  }

  async loadEntries(): Promise<void> {
    try {
      const { data: entries, error } = await this.supabase
        .from('entries')
        .select(`
          *,
          media_files (*),
          locations (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', entries);

      const formattedEntries = entries.map(entry => {
        const entryObj = new Entry();
        
        // Copy basic entry properties
        Object.assign(entryObj, {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          mood: entry.mood,
          is_synced: entry.is_synced,
          offline_id: entry.offline_id,
          location_id: entry.location_id
        });
        
        // Format media files
        entryObj.mediaFiles = entry.media_files?.map((file: any) => {
          const mediaFile = new MediaFile();
          Object.assign(mediaFile, file);
          return mediaFile;
        }) || [];

        // Format location if it exists (handling array)
        if (entry.locations && entry.locations.length > 0) {
          const locationData = entry.locations[0]; // Take the first location
          const locationObj = new Location();
          Object.assign(locationObj, {
            id: locationData.id,
            name: locationData.name
          });
          entryObj.location = locationObj;
        }

        return entryObj;
      });

      console.log('Formatted entries with locations:', formattedEntries);
      this.entries.next(formattedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }

  getEntries(): Observable<Entry[]> {
    return this.entries.asObservable();
  }
}