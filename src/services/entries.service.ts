import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, retry } from 'rxjs';
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
      environment.SUPABASE_KEY,
      {
        db: {
          schema: 'public'
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storage: undefined
        }
      }
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
        if (entry.locations && Array.isArray(entry.locations) && entry.locations.length > 0) {
          const locationData = entry.locations[0];
          const locationObj = new Location();
          Object.assign(locationObj, {
            id: locationData.id,
            name: locationData.name
          });
          entryObj.location = locationObj;
        } else if (entry.locations && !Array.isArray(entry.locations)) {
          // Handle case where locations is a single object
          const locationObj = new Location();
          Object.assign(locationObj, {
            id: entry.locations.id,
            name: entry.locations.name
          });
          entryObj.location = locationObj;
        }

        return entryObj;
      });

      console.log('Formatted entries with locations:', formattedEntries);
      this.entries.next(formattedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      setTimeout(() => this.loadEntries(), 1000);
    }
  }

  getEntries(): Observable<Entry[]> {
    return this.entries.asObservable().pipe(
      retry(3)
    );
  }

  async addEntry(entry: Entry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('entries')
        .insert([
          {
            title: entry.title,
            content: entry.content,
            mood: entry.mood,
            location_id: entry.location_id,
            is_synced: true
          }
        ]);

      if (error) throw error;
      await this.loadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }

  async updateEntry(entry: Entry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('entries')
        .update({
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          location_id: entry.location_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (error) throw error;
      await this.loadEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }

  async deleteEntry(entryId: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      await this.loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }

  async getEntry(entryId: number): Promise<Entry | null> {
    try {
      const { data, error } = await this.supabase
        .from('entries')
        .select(`
          *,
          media_files (*),
          locations (
            id,
            name
          )
        `)
        .eq('id', entryId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const entryObj = new Entry();
      Object.assign(entryObj, {
        id: data.id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        mood: data.mood,
        is_synced: data.is_synced,
        offline_id: data.offline_id,
        location_id: data.location_id
      });

      // Format location
      if (data.locations) {
        const locationObj = new Location();
        const locationData = Array.isArray(data.locations) ? data.locations[0] : data.locations;
        Object.assign(locationObj, {
          id: locationData.id,
          name: locationData.name
        });
        entryObj.location = locationObj;
      }

      // Format media files
      entryObj.mediaFiles = data.media_files?.map((file: any) => {
        const mediaFile = new MediaFile();
        Object.assign(mediaFile, file);
        return mediaFile;
      }) || [];

      return entryObj;
    } catch (error) {
      console.error('Error getting entry:', error);
      throw error;
    }
  }
}