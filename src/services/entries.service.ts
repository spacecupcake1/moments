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
      // Log initial attempt
      console.log('Starting file upload process:', {
        fileType,
        fileName: file.name,
        fileSize: file.size,
        entryId
      });

      // First check if bucket exists
      const { data: buckets, error: bucketError } = await this.supabase
        .storage
        .listBuckets();

      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
        throw bucketError;
      }

      console.log('Available buckets:', buckets?.map(b => b.name));

      // Create timestamp and clean filename
      const timestamp = new Date().getTime();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${fileType}_${timestamp}_${cleanFileName}`;

      console.log('Attempting upload with path:', filePath);

      // Create a clean Blob with proper MIME type
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      // Attempt upload
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('Detailed error in uploadFile:', error);
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
          file_url: fileUrl
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
      // Create the entry first
      const { data: newEntry, error: entryError } = await this.supabase
        .from('entries')
        .insert({
          title: entry.title,
          content: entry.content,
          mood: entry.mood
        })
        .select()
        .single();

      if (entryError) throw entryError;
      if (!newEntry) throw new Error('No entry data returned after insertion');

      // Add location if it exists
      if (entry.location?.name) {
        const { error: locationError } = await this.supabase
          .from('locations')
          .insert({
            name: entry.location.name,
            entry: newEntry.id
          });

        if (locationError) throw locationError;
      }

      // Handle media files
      if (entry.mediaFiles && entry.mediaFiles.length > 0) {
        for (const mediaFile of entry.mediaFiles) {
          if (mediaFile.tempFile) {
            try {
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
            } catch (mediaError) {
              console.error('Error processing media file:', mediaError);
              throw mediaError;
            }
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
      // Create update object with only the fields that exist in the table
      const updateData = {
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        updated_at: new Date().toISOString()
      };

      // Update the main entry first
      const { error } = await this.supabase
        .from('entries')
        .update(updateData)
        .eq('id', entry.id);

      if (error) throw error;

      // Handle location if it exists
      if (entry.location?.name) {
        const { error: locationError } = await this.supabase
          .from('locations')
          .upsert({
            name: entry.location.name,
            entry: entry.id
          });

        if (locationError) throw locationError;
      }

      // Handle media files if they exist
      if (entry.mediaFiles && entry.mediaFiles.length > 0) {
        for (const mediaFile of entry.mediaFiles) {
          // Only process new files that have tempFile
          if (mediaFile.tempFile) {
            try {
              // Upload the file
              const fileUrl = await this.uploadFile(
                mediaFile.tempFile,
                entry.id,
                mediaFile.file_type
              );

              // Add the media file record
              await this.addMediaFile(
                entry.id,
                fileUrl,
                mediaFile.file_type
              );
            } catch (mediaError) {
              console.error('Error processing media file:', mediaError);
              throw mediaError;
            }
          }
        }
      }

      await this.loadEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }

  async deleteEntry(entryId: number): Promise<void> {
    try {
      console.log('Starting deletion process for entry:', entryId);

      // First, get the entry to check for associated data
      const { data: entry } = await this.supabase
        .from('entries')
        .select(`
          id,
          media_files (id, file_url),
          locations (id)
        `)
        .eq('id', entryId)
        .single();

      if (entry) {
        // Delete media files from storage and database
        if (entry.media_files && entry.media_files.length > 0) {
          console.log('Deleting media files...');
          for (const mediaFile of entry.media_files) {
            // Delete file from storage
            const filePath = mediaFile.file_url.split('/').pop();
            if (filePath) {
              const { error: storageError } = await this.supabase.storage
                .from('media')
                .remove([filePath]);

              if (storageError) {
                console.error('Error deleting file from storage:', storageError);
              }
            }

            // Delete media file record
            const { error: mediaError } = await this.supabase
              .from('media_files')
              .delete()
              .eq('id', mediaFile.id);

            if (mediaError) {
              console.error('Error deleting media file record:', mediaError);
            }
          }
        }

        // Delete location records
        if (entry.locations) {
          console.log('Deleting location data...');
          const { error: locationError } = await this.supabase
            .from('locations')
            .delete()
            .eq('entry', entryId);

          if (locationError) {
            console.error('Error deleting location:', locationError);
          }

          // Delete geolocation if it exists
          const { error: geoError } = await this.supabase
            .from('geolocations')
            .delete()
            .eq('entry', entryId);

          if (geoError) {
            console.error('Error deleting geolocation:', geoError);
          }
        }

        // Finally, delete the entry itself
        console.log('Deleting main entry...');
        const { error: entryError } = await this.supabase
          .from('entries')
          .delete()
          .eq('id', entryId);

        if (entryError) {
          throw entryError;
        }

        // Refresh the entries list
        await this.loadEntries();
        console.log('Entry and all associated data deleted successfully');
      }
    } catch (error) {
      console.error('Error in deleteEntry:', error);
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

      // Copy basic entry properties
      Object.assign(entryObj, {
        id: data.id || 0,  // Provide default values
        title: data.title || '',
        content: data.content || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        mood: data.mood || '',
        location_id: data.location_id || null
      });

      // Format media files with null check
      entryObj.mediaFiles = data.media_files?.map((file: any) => {
        const mediaFile = new MediaFile();
        Object.assign(mediaFile, {
          id: file.id || 0,
          file_type: file.file_type || '',
          file_url: file.file_url || '',
          entry: file.entry || 0
        });
        return mediaFile;
      }) || [];

      // Format location with null check
      if (data.locations) {
        const locationObj = new Location();
        const locationData = Array.isArray(data.locations) ? data.locations[0] : data.locations;
        if (locationData) {
          Object.assign(locationObj, {
            id: locationData.id || 0,
            name: locationData.name || ''
          });
          entryObj.location = locationObj;
        }
      }

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
