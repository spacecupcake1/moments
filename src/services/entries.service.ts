import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Entry } from 'src/app/data/entry';
import { MediaFile } from 'src/app/data/media_files';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
  })
  export class EntriesService {
    private entries = new BehaviorSubject<Entry[]>([]);
    private supabase: SupabaseClient;
  
    constructor() {
      // Initialize Supabase client using environment variables
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    }
  
    async loadEntries(): Promise<void> {
      try {
        const { data: entries, error } = await this.supabase
          .from('entries')
          .select(`
            *,
            media_files (*)
          `)
          .order('created_at', { ascending: false });
  
        if (error) throw error;
  
        const formattedEntries = entries.map(entry => {
          const entryObj = new Entry();
          Object.assign(entryObj, entry);
          entryObj.mediaFiles = entry.media_files.map((file: any) => {
            const mediaFile = new MediaFile();
            Object.assign(mediaFile, file);
            return mediaFile;
          });
          return entryObj;
        });
  
        this.entries.next(formattedEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
      }
    }
  
    getEntries(): Observable<Entry[]> {
      return this.entries.asObservable();
    }
  }