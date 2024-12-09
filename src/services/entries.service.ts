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
        db: { schema: 'public' },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storage: undefined
        }
      }
    );
  }

  async uploadFile(file: File, entryId: number, fileType: 'image' | 'audio'): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const filePath = `${entryId}/${fileType}_${timestamp}_${file.name}`;
      
      const { data, error } = await this.supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async addMediaFile(entryId: number, fileUrl: string, fileType: 'image' | 'audio'): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('media_files')
        .insert({
          entry: entryId,
          file_type: fileType,
          file_url: fileUrl,
          is_synced: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding media file:', error);
      throw error;
    }
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
      // Create the entry
      const { data: newEntry, error: entryError } = await this.supabase
        .from('entries')
        .insert({
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          is_synced: true
        })
        .select()
        .single();
  
      if (entryError) {
        console.error('Entry insertion error:', entryError);
        throw entryError;
      }
  
      if (!newEntry) {
        throw new Error('No entry data returned after insertion');
      }
  
      // Add location if it exists
      if (entry.location?.name) {
        const { error: locationError } = await this.supabase
          .from('locations')
          .insert({
            name: entry.location.name,
            entry: newEntry.id
          });
  
        if (locationError) {
          console.error('Location insertion error:', locationError);
          throw locationError;
        }
      }
  
      // Add media files if they exist
      if (entry.mediaFiles && entry.mediaFiles.length > 0) {
        for (const mediaFile of entry.mediaFiles) {
          if (mediaFile.tempFile) {
            const fileUrl = await this.uploadFile(
              mediaFile.tempFile,
              newEntry.id,
              mediaFile.file_type
            );
  
            await this.addMediaFile(
              newEntry.id,
              fileUrl,
              mediaFile.file_type
            );
          }
        }
      }
  
      await this.loadEntries();
    } catch (error) {
      console.error('Error in addEntry:', error);
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
      // First delete any associated files from storage
      const { data: mediaFiles } = await this.supabase
        .from('media_files')
        .select('file_url')
        .eq('entry', entryId);

      if (mediaFiles) {
        for (const mediaFile of mediaFiles) {
          const filePath = mediaFile.file_url.split('/').pop();
          if (filePath) {
            await this.supabase.storage
              .from('media')
              .remove([`${entryId}/${filePath}`]);
          }
        }
      }

      // Then delete the entry (cascade will handle related records)
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

  async deleteMediaFile(mediaFileId: number): Promise<void> {
    try {
      const { data: mediaFile } = await this.supabase
        .from('media_files')
        .select('file_url')
        .eq('id', mediaFileId)
        .single();

      if (mediaFile) {
        // Delete from storage
        const filePath = mediaFile.file_url.split('/').pop();
        if (filePath) {
          await this.supabase.storage
            .from('media')
            .remove([filePath]);
        }

        // Delete from database
        const { error } = await this.supabase
          .from('media_files')
          .delete()
          .eq('id', mediaFileId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting media file:', error);
      throw error;
    }
  }
}