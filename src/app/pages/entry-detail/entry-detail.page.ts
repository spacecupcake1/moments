import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { Entry } from 'src/app/data/entry';
import { EntriesService } from 'src/services/entries.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.page.html',
  styleUrls: ['./entry-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonText,
  ]
})
export class EntryDetailPage implements OnInit {
  entry: Entry | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entriesService: EntriesService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ createOutline, trashOutline });
  }

  ionViewWillEnter() {
    // This will be called every time the view is about to enter
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEntry(id);
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEntry(id);
    }
  }

  async loadEntry(id: string) {
    const numericId = parseInt(id, 10);
    try {
      const loadedEntry = await this.entriesService.getEntry(numericId);
      if (loadedEntry && loadedEntry.id) {  // Add null check
        this.entry = loadedEntry;
      } else {
        console.error('Entry not found or invalid');
        // Optionally navigate back or show error message
        this.router.navigate(['/tabs/tab1']);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      // Optionally handle error (show alert, navigate back, etc.)
    }
  }

  async deleteEntry() {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Are you sure you want to delete this entry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            if (this.entry?.id) {
              await this.entriesService.deleteEntry(this.entry.id);
              // Show toast message
              const toast = await this.toastController.create({
                message: 'Entry deleted successfully',
                duration: 2000,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
              this.router.navigate(['/tabs/tab1']);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  editEntry() {
    if (this.entry?.id) {
      this.router.navigate(['/edit-entry', this.entry.id]);
    }
  }
}
