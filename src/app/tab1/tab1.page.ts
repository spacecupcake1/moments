import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { EntriesService } from 'src/services/entries.service';
import { Entry } from '../data/entry';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonItemOptions, IonItemSliding, IonItemOption,
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonList,
    IonFab,
    IonFabButton,
    IonIcon
  ]
})
export class Tab1Page implements OnInit {
  entries: Entry[] = [];
  filteredEntries: Entry[] = [];
  dateFilter: string | null = null;
  locationFilter: string | null = null;
  availableDates: string[] = [];
  availableLocations: string[] = [];

  constructor(
    private entriesService: EntriesService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.entriesService.getEntries().subscribe(entries => {
      console.log('Received entries:', entries);
      this.entries = entries;
      this.updateFilters();
      this.applyFilters();
    });
    this.loadEntries();
  }

  async loadEntries() {
    await this.entriesService.loadEntries();
  }

  updateFilters() {
    // Get unique dates
    this.availableDates = [...new Set(
      this.entries.map(entry =>
        new Date(entry.created_at).toISOString().split('T')[0]
      )
    )].sort().reverse();

    // Get unique locations, filtering out undefined values
    this.availableLocations = [...new Set(
      this.entries
        .map(entry => entry.location?.name)
        .filter((name): name is string => name !== undefined && name !== null)
    )].sort();

    console.log('Available locations:', this.availableLocations);
  }

  applyFilters() {
    this.filteredEntries = this.entries.filter(entry => {
      const dateMatch = !this.dateFilter ||
        entry.created_at.startsWith(this.dateFilter);
      const locationMatch = !this.locationFilter ||
        entry.location?.name === this.locationFilter;
      return dateMatch && locationMatch;
    });
  }

  hasMediaType(entry: Entry, type: 'image' | 'audio'): boolean {
    return entry.mediaFiles.some(file => file.file_type === type);
  }

  async handleSlide(event: any, entry: any) {
    const ratio = event.detail.ratio;

    // When slide is more than 50% complete
    if (ratio === 1) {
      // Create and show alert
      const alert = await this.alertController.create({
        header: 'Confirm',
        message: 'Are you sure you want to delete this entry?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              // Reset the slider
              event.target.closeOpened();
            }
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: async () => {
              try {
                await this.entriesService.deleteEntry(entry.id);

                const toast = await this.toastController.create({
                  message: 'Entry deleted successfully',
                  duration: 2000,
                  position: 'bottom',
                  color: 'success'
                });
                await toast.present();

                // Refresh the entries list
                this.loadEntries();
              } catch (error) {
                console.error('Error deleting entry:', error);

                const toast = await this.toastController.create({
                  message: 'Error deleting entry',
                  duration: 2000,
                  position: 'bottom',
                  color: 'danger'
                });
                await toast.present();
              }
            }
          }
        ]
      });

      await alert.present();
    }
  }

}
