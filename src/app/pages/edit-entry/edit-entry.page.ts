import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { IonicModule, ToastController } from '@ionic/angular';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { addIcons } from 'ionicons';
import { camera, image, locate, mic, stopCircle, trash } from 'ionicons/icons';
import { Entry } from 'src/app/data/entry';
import { MediaFile } from 'src/app/data/media_files';
import { EntriesService } from 'src/services/entries.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-edit-entry',
  templateUrl: './edit-entry.page.html',
  styleUrls: ['./edit-entry.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EditEntryPage implements OnInit {
  entry: Entry = new Entry();
  currentLocation: string = '';
  isGettingLocation: boolean = false;
  mediaFiles: MediaFile[] = [];
  moodOptions = ['Happy', 'Sad', 'Excited', 'Tired', 'Anxious', 'Calm'];
  isRecording: boolean = false;
  recordingDuration: number = 0;
  recordingInterval: any;

  constructor(
    private entriesService: EntriesService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({ camera, image, locate, mic, stopCircle, trash });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEntry(parseInt(id, 10));
    }
  }

  async loadEntry(id: number) {
    try {
      const loadedEntry = await this.entriesService.getEntry(id);
      if (loadedEntry) {
        this.entry = loadedEntry;
        if (loadedEntry.location?.name) {
          this.currentLocation = loadedEntry.location.name;
        }
        if (loadedEntry.mediaFiles) {
          this.mediaFiles = [...loadedEntry.mediaFiles];
        }
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  }

  async getCurrentLocation() {
    this.isGettingLocation = true;
    try {
      const position = await Geolocation.getCurrentPosition();

      // Use Nominatim reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
      );
      const data = await response.json();

      // Extract city and country from the response
      const locationName = data.address.city || data.address.town || data.address.village || 'Unknown location';
      this.currentLocation = locationName;

    } catch (error) {
      console.error('Error getting location:', error);
      this.currentLocation = 'Location unavailable';
    } finally {
      this.isGettingLocation = false;
    }
  }

  base64ToFile(base64String: string, filename: string): File {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
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
        const mediaFile = new MediaFile();
        mediaFile.file_type = 'image';
        mediaFile.tempFile = this.base64ToFile(
          image.base64String,
          `photo_${Date.now()}.${image.format}`
        );
        // Create temporary URL for preview
        mediaFile.file_url = `data:image/${image.format};base64,${image.base64String}`;
        this.mediaFiles.push(mediaFile);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  }

  async choosePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      if (image.base64String) {
        const mediaFile = new MediaFile();
        mediaFile.file_type = 'image';
        mediaFile.tempFile = this.base64ToFile(
          image.base64String,
          `photo_${Date.now()}.${image.format}`
        );
        // Create temporary URL for preview
        mediaFile.file_url = `data:image/${image.format};base64,${image.base64String}`;
        this.mediaFiles.push(mediaFile);
      }
    } catch (error) {
      console.error('Error choosing picture:', error);
    }
  }

  async toggleRecording() {
    try {
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission) {
        await VoiceRecorder.requestAudioRecordingPermission();
      }

      if (this.isRecording) {
        // Stop recording
        const result = await VoiceRecorder.stopRecording();
        this.isRecording = false;
        clearInterval(this.recordingInterval);
        this.recordingDuration = 0;

        if (result.value && result.value.recordDataBase64) {
          const mediaFile = new MediaFile();
          mediaFile.file_type = 'audio';
          mediaFile.tempFile = this.base64ToFile(
            `data:audio/mp3;base64,${result.value.recordDataBase64}`,
            `audio_${Date.now()}.mp3`
          );
          // Create temporary URL for preview
          mediaFile.file_url = `data:audio/mp3;base64,${result.value.recordDataBase64}`;
          this.mediaFiles.push(mediaFile);
        }
      } else {
        // Start recording
        await VoiceRecorder.startRecording();
        this.isRecording = true;
        this.recordingInterval = setInterval(() => {
          this.recordingDuration++;
        }, 1000);
      }
    } catch (error) {
      console.error('Error with recording:', error);
      this.isRecording = false;
      this.recordingDuration = 0;
    }
  }

  // edit-entry.page.ts
  async removeMediaFile(index: number) {
    const mediaFile = this.mediaFiles[index];
    
    // If the file has an ID (existing file), delete it from the database
    if (mediaFile.id) {
      try {
        await this.entriesService.deleteMediaFile(mediaFile.id);
        this.mediaFiles.splice(index, 1);

        const toast = await this.toastController.create({
          message: 'Media file deleted successfully',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } catch (error) {
        console.error('Error deleting media file:', error);
        const toast = await this.toastController.create({
          message: 'Error deleting media file',
          duration: 2000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    } else {
      // If it's a new file that hasn't been saved yet, just remove it from the array
      this.mediaFiles.splice(index, 1);
    }
  }

  async saveEntry() {
    try {
      if (this.currentLocation) {
        const locationId = this.entry.location?.id;
        this.entry.location = {
          id: locationId || 0,
          name: this.currentLocation
        };
      }

      this.entry.mediaFiles = this.mediaFiles;

      await this.entriesService.updateEntry(this.entry);

      const toast = await this.toastController.create({
        message: 'Entry updated successfully',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      // Use Location back() to return to the previous page
      window.history.back();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error updating entry',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      console.error('Error updating entry:', error);
    }
  }

  // Clean up when leaving the page
  ngOnDestroy() {
    if (this.isRecording) {
      VoiceRecorder.stopRecording();
      this.isRecording = false;
      clearInterval(this.recordingInterval);
    }
  }
}
