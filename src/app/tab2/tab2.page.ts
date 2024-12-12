import { Component, OnInit } from '@angular/core';
import { Entry } from '../data/entry';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { EntriesService } from 'src/services/entries.service';
import { WeeklyChartComponent, MediaChartComponent, LocationChartComponent } from '../components/statistics-charts/statistics-charts.component';


interface ChartDataItem {
  day?: string;
  name?: string;
  area?: string;
  entries?: number;
  value?: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    WeeklyChartComponent, 
    MediaChartComponent, 
    LocationChartComponent
  ]
})

export class Tab2Page implements OnInit {
  // Existing properties
  totalEntries: number = 0;
  entriesThisWeek: number = 0;
  mostActiveDay: string = '';
  photoCount: number = 0;
  audioCount: number = 0;
  entriesWithMediaPercentage: number = 0;
  entriesWithLocation: number = 0;
  locationPercentage: number = 0;
  mostCommonArea: string = '';

  // New properties for charts
  weeklyData: ChartDataItem[] = [];
  mediaData: ChartDataItem[] = [];
  locationData: ChartDataItem[] = [];

  constructor(private entriesService: EntriesService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  ionViewWillEnter() {
    this.loadAnalytics();
  }

  private async loadAnalytics() {
    this.entriesService.getEntries().subscribe(entries => {
      this.calculateStatistics(entries);
      this.calculateMediaStats(entries);
      this.calculateLocationStats(entries);
      this.prepareChartData(entries);
    });
  }

  private calculateStatistics(entries: Entry[]) {
    // Existing code remains the same
    this.totalEntries = entries.length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    this.entriesThisWeek = entries.filter(entry => 
      new Date(entry.created_at) > oneWeekAgo
    ).length;

    const entriesByDay = entries.reduce((acc, entry) => {
      const day = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});

    if (Object.keys(entriesByDay).length > 0) {
      const [day, count] = Object.entries(entriesByDay)
        .sort((a, b) => b[1] - a[1])[0];
      this.mostActiveDay = `${day} (${count} entries)`;
    } else {
      this.mostActiveDay = 'No entries yet';
    }
  }

  private calculateMediaStats(entries: Entry[]) {
    // Existing code remains the same
    let photoCount = 0;
    let audioCount = 0;
    let entriesWithMedia = 0;

    entries.forEach(entry => {
      if (entry.mediaFiles?.length > 0) {
        entriesWithMedia++;
        entry.mediaFiles.forEach(file => {
          if (file.file_type === 'image') photoCount++;
          if (file.file_type === 'audio') audioCount++;
        });
      }
    });

    this.photoCount = photoCount;
    this.audioCount = audioCount;
    this.entriesWithMediaPercentage = this.totalEntries ? 
      Math.round((entriesWithMedia / this.totalEntries) * 100) : 0;
  }

  private calculateLocationStats(entries: Entry[]) {
    // Existing code remains the same
    const entriesWithLocation = entries.filter(entry => entry.location?.name).length;
    this.entriesWithLocation = entriesWithLocation;
    this.locationPercentage = this.totalEntries ? 
      Math.round((entriesWithLocation / this.totalEntries) * 100) : 0;

    const locationCounts = entries.reduce((acc, entry) => {
      if (entry.location?.name) {
        const [lat, lng] = entry.location.name.split(',').map(n => parseFloat(n.trim()));
        const area = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {} as {[key: string]: number});

    const mostCommonArea = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])[0];
      
    this.mostCommonArea = mostCommonArea ? 
      `Area around (${mostCommonArea[0]}) - ${mostCommonArea[1]} entries` : 
      'No locations recorded';
  }

  private prepareChartData(entries: Entry[]) {
    // Prepare weekly data
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.weeklyData = days.map(day => ({
      day: day,
      entries: entries.filter(entry => 
        new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' }) === day
      ).length
    }));

    // Prepare media data
    const entriesWithMedia = entries.filter(entry => entry.mediaFiles?.length > 0).length;
    this.mediaData = [
      { name: 'Photos', value: this.photoCount },
      { name: 'Audio', value: this.audioCount },
      { name: 'No Media', value: this.totalEntries - entriesWithMedia }
    ];

    // Prepare location data
    const locationCounts = entries.reduce((acc, entry) => {
      if (entry.location?.name) {
        const [lat, lng] = entry.location.name.split(',').map(n => parseFloat(n.trim()));
        const area = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {} as {[key: string]: number});

    this.locationData = Object.entries(locationCounts)
      .map(([area, count]) => ({
        area: area,
        entries: count
      }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 5); // Top 5 locations
  }
}