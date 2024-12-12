import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircleOutline,
  imageOutline,
  locationOutline,
  micOutline,
  stopCircleOutline,
  trashOutline,
  warningOutline, locate } from 'ionicons/icons';
import { Entry } from 'src/app/data/entry';
import { Location } from 'src/app/data/location';
import { MediaFile } from 'src/app/data/media_files';
import { EntriesService } from 'src/services/entries.service';

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
  isRecording = false;
  recordingDuration = 0;
  recordingInterval: any;

  constructor(
    private entriesService: EntriesService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({'camera':cameraOutline,'image':imageOutline,'locate':locationOutline,'trash':trashOutline,'checkmarkCircle':checkmarkCircleOutline,'warning':warningOutline,'mic':micOutline,'stopCircle':stopCircleOutline});
  }

  async showSuccessToast(message: string = 'Entry saved successfully!') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  async showErrorAlert(error: any) {
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Failed to save entry',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      buttons: ['OK'],
      cssClass: 'error-alert'
    });
    await alert.present();
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


 async removeMediaFile(index: number) {
    try {
      const mediaFile = this.mediaFiles[index];
      if (mediaFile.id) {
        await this.entriesService.deleteMediaFile(mediaFile.id);
      }
      this.mediaFiles.splice(index, 1);
    } catch (error) {
      console.error('Error removing media file:', error);
      await this.showErrorAlert(error);
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true
      });

      if (image.base64String) {
        // Create proper MIME type
        const mimeType = `image/${image.format.toLowerCase()}`;
        const blob = this.base64ToBlob(image.base64String, mimeType);

        const timestamp = new Date().getTime();
        const fileName = `photo_${timestamp}.${image.format.toLowerCase()}`;

        // Create file with proper MIME type
        const file = new File([blob], fileName, {
          type: mimeType,
          lastModified: timestamp
        });

        const mediaFile = new MediaFile();
        mediaFile.file_type = 'image';
        mediaFile.file_path = fileName;
        mediaFile.tempFile = file;

        this.mediaFiles.push(mediaFile);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      await this.showErrorAlert(error);
    }
  }

  // Updated base64ToBlob method
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

  async choosePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos // This will open the photo gallery
      });

      if (image.base64String) {
        const blob = this.base64ToBlob(
          image.base64String,
          `image/${image.format}`
        );

        const timestamp = new Date().getTime();
        const file = new File([blob], `photo_${timestamp}.${image.format}`, {
          type: `image/${image.format}`
        });

        const mediaFile = new MediaFile();
        mediaFile.file_type = 'image';
        mediaFile.file_path = file.name;
        mediaFile.tempFile = file;

        this.mediaFiles.push(mediaFile);
      }
    } catch (error) {
      console.error('Error choosing picture:', error);
      await this.showErrorAlert(error);
    }
  }

  async checkAudioPermissions(): Promise<boolean> {
    try {
      const { value } = await VoiceRecorder.hasAudioRecordingPermission();
      if (!value) {
        const { value: permissionValue } = await VoiceRecorder.requestAudioRecordingPermission();
        return permissionValue;
      }
      return value;
    } catch (error) {
      console.error('Error checking audio permissions:', error);
      return false;
    }
  }

  async toggleRecording() {
    if (!this.isRecording) {
      // Start recording
      const hasPermission = await this.checkAudioPermissions();
      if (!hasPermission) {
        await this.showErrorAlert('Microphone permission is required to record audio.');
        return;
      }

      try {
        await VoiceRecorder.startRecording();
        this.isRecording = true;
        this.recordingDuration = 0;

        // Update duration every second
        this.recordingInterval = setInterval(() => {
          this.recordingDuration++;
        }, 1000);

      } catch (error) {
        console.error('Error starting recording:', error);
        await this.showErrorAlert(error);
      }
    } else {
      // Stop recording
      try {
        const { value } = await VoiceRecorder.stopRecording();
        this.isRecording = false;
        clearInterval(this.recordingInterval);

        // Convert base64 to File
        const base64Sound = value.recordDataBase64;

        const byteCharacters = atob(base64Sound);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }

        // Use WAV format for better compatibility
        const blob = new Blob(byteArrays, { type: 'audio/wav' });

        const timestamp = new Date().getTime();
        const file = new File([blob], `audio_${timestamp}.wav`, {
          type: 'audio/wav'
        });

        // Create media file
        const mediaFile = new MediaFile();
        mediaFile.file_type = 'audio';
        mediaFile.file_path = file.name;
        mediaFile.tempFile = file;

        this.mediaFiles.push(mediaFile);
        await this.showSuccessToast('Voice message recorded successfully');

      } catch (error) {
        console.error('Error stopping recording:', error);
        await this.showErrorAlert(error);
      }
    }
  }

  async ionViewWillLeave() {
    if (this.isRecording) {
      await VoiceRecorder.stopRecording();
      this.isRecording = false;
      clearInterval(this.recordingInterval);
    }
  }

  async saveEntry() {
    try {
      if (!this.entry.title) {
        throw new Error('Title is required');
      }

      if (!this.entry.content) {
        throw new Error('Content is required');
      }

      const entryToSave = new Entry();
      entryToSave.title = this.entry.title;
      entryToSave.content = this.entry.content;
      entryToSave.mood = this.entry.mood;
      entryToSave.mediaFiles = [...this.mediaFiles];

      if (this.currentLocation) {
        const location = new Location();
        location.name = this.currentLocation;
        entryToSave.location = location;
      }

      await this.entriesService.addEntry(entryToSave);
      await this.showSuccessToast();
      this.router.navigate(['/tabs/tab1']);
    } catch (error) {
      console.error('Error saving entry:', error);
      await this.showErrorAlert(error);
    }
  }
}
