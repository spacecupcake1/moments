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
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { EntriesService } from 'src/services/entries.service';
import { Entry } from 'src/app/data/entry';
import { Location } from 'src/app/data/location';
import { MediaFile } from 'src/app/data/media_files';
import { 
  cameraOutline, 
  micOutline, 
  imageOutline,
  locationOutline,
  trashOutline, locate } from 'ionicons/icons';
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
  mediaFiles: MediaFile[] = [];
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
      'locate': locationOutline,
      'trash': trashOutline
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

  

  async takePicture() {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera
        });

        if (image.base64String) {
            const blob = this.base64ToBlob(
                image.base64String,
                `image/${image.format}`
            );
            const file = new File([blob], `photo.${image.format}`, {
                type: `image/${image.format}`
            });

            const mediaFile = new MediaFile();
            mediaFile.file_type = 'image';
            mediaFile.file_path = file.name;
            mediaFile.tempFile = file;

            this.mediaFiles.push(mediaFile);
        }
    } catch (error) {
        console.error('Error taking picture:', error);
    }
}

// Add the base64ToBlob method here
private base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type });
}

  async saveEntry() {
    try {
      const entryToSave = new Entry();
      entryToSave.title = this.entry.title;
      entryToSave.content = this.entry.content;
      entryToSave.mood = this.entry.mood;
      entryToSave.mediaFiles = this.mediaFiles;
      
      if (this.currentLocation) {
        const location = new Location();
        location.name = this.currentLocation;
        entryToSave.location = location;
      }

      await this.entriesService.addEntry(entryToSave);
      this.router.navigate(['/tabs/tab1']);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  }
}