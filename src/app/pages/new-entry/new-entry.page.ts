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
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { EntriesService } from 'src/services/entries.service';
import { Entry } from 'src/app/data/entry';
import { Location } from 'src/app/data/location';
import { 
  cameraOutline, 
  micOutline, 
  imageOutline,
  locationOutline 
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

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
    IonIcon,
    IonText
  ]
})
export class NewEntryPage {
  entry: Entry = new Entry();
  currentLocation: string = '';
  mediaFiles: { type: 'image' | 'audio', path?: string }[] = [];
  moodOptions = ['Happy', 'Sad', 'Excited', 'Thoughtful', 'Anxious', 'Calm'];
  isGettingLocation = false;

  constructor(
    private entriesService: EntriesService,
    private router: Router
  ) {
    addIcons({
      'camera': cameraOutline,
      'mic': micOutline,
      'image': imageOutline,
      'locate': locationOutline  // Changed to 'locate' to avoid duplicate
    });
  }

  async getCurrentLocation() {
    try {
      this.isGettingLocation = true;

      // Request permission
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          throw new Error('Location permission not granted');
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition();
      
      // Use reverse geocoding to get address (you might want to use a service like Google Maps Geocoding API)
      const locationName = `${position.coords.latitude}, ${position.coords.longitude}`;
      
      if (this.entry.location) {
        this.entry.location.name = locationName;
      } else {
        const location = new Location();
        location.name = locationName;
        this.entry.location = location;
      }
      
      this.currentLocation = locationName;
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      this.isGettingLocation = false;
    }
  }

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
      
      if (this.entry.location) {
        const location = new Location();
        location.name = this.entry.location.name;
        entryToSave.location = location;
      }

      await this.entriesService.addEntry(entryToSave);
      this.router.navigate(['/tabs/tab1']);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  }
}