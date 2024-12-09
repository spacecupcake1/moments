import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Entry } from '../data/entry';
import { EntriesService } from 'src/services/entries.service';
import { 
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
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
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

  constructor(private entriesService: EntriesService) {}

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
}