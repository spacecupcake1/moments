import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonBackButton,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { EntriesService } from 'src/services/entries.service';
import { Entry } from 'src/app/data/entry';
import { Location } from 'src/app/data/location';

@Component({
  selector: 'app-new-entry',
  templateUrl: './new-entry.page.html',
  styleUrls: ['./new-entry.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonBackButton,
    IonButtons,
    IonIcon
  ]
})
export class NewEntryPage {
  entry: Entry = new Entry();
  locationName: string = '';
  mediaFiles: { type: 'image' | 'audio', path?: string }[] = [];
  moodOptions = ['Happy', 'Sad', 'Excited', 'Thoughtful', 'Anxious', 'Calm'];

  constructor(
    private entriesService: EntriesService,
    private router: Router
  ) {}

  async addMediaFile(type: 'image' | 'audio') {
    // Here you would implement file selection/capture
    // For now, we'll just add a placeholder
    this.mediaFiles.push({ type });
  }

  async saveEntry() {
    try {
      const entryToSave = new Entry();
      entryToSave.title = this.entry.title;
      entryToSave.content = this.entry.content;
      entryToSave.mood = this.entry.mood;
      
      if (this.locationName) {
        const location = new Location();
        location.name = this.locationName;
        entryToSave.location = location;
      }

      await this.entriesService.addEntry(entryToSave);
      this.router.navigate(['/tabs/tab1']);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  }
}