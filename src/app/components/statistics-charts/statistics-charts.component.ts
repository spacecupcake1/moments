import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { 
  Chart,
  ChartConfiguration,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Legend,
  Title,
  Tooltip,
  LineController,
  BarController,
  PieController
} from 'chart.js';

Chart.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Legend,
  Title,
  Tooltip,
  LineController,
  BarController,
  PieController
);

interface ChartDataItem {
  day?: string;
  name?: string;
  area?: string;
  entries?: number;
  value?: number;
}

// Weekly Activity Chart Component
@Component({
  selector: 'app-weekly-chart',
  template: `<canvas #weeklyCanvas></canvas>`,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class WeeklyChartComponent implements AfterViewInit {
  @ViewChild('weeklyCanvas') weeklyCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() weeklyData: ChartDataItem[] = [];
  private chart?: Chart;
  
  private readonly GRADIENT_START = '#ff01ff';
  private readonly GRADIENT_END = '#0f35ff';

  ngAfterViewInit() {
    setTimeout(() => this.initializeChart(), 0);
  }

  private createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, this.GRADIENT_START);
    gradient.addColorStop(1, this.GRADIENT_END);
    return gradient;
  }

  private initializeChart() {
    if (this.weeklyCanvas) {
      const ctx = this.weeklyCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const gradient = this.createGradient(ctx);
        
        const config: ChartConfiguration = {
          type: 'line',
          data: {
            labels: this.weeklyData.map(item => item.day),
            datasets: [{
              label: 'Number of Entries',
              data: this.weeklyData.map(item => item.entries ?? 0),
              borderColor: gradient,
              backgroundColor: 'rgba(255, 1, 255, 0.1)',
              tension: 0.4,
              fill: true,
              borderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 1, 255, 0.1)' }
              },
              x: {
                grid: { color: 'rgba(15, 53, 255, 0.1)' }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        };
        this.chart = new Chart(this.weeklyCanvas.nativeElement, config);
      }
    }
  }
}

// Media Distribution Chart Component
@Component({
  selector: 'app-media-chart',
  template: `<canvas #mediaCanvas></canvas>`,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MediaChartComponent implements AfterViewInit {
  @ViewChild('mediaCanvas') mediaCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() mediaData: ChartDataItem[] = [];
  private chart?: Chart;

  private readonly COLORS = [
    '#ff01ff',
    '#0f35ff',
    '#8018ff',
    '#4f26ff',
    '#cc0dff'
  ];

  ngAfterViewInit() {
    setTimeout(() => this.initializeChart(), 0);
  }

  private initializeChart() {
    if (this.mediaCanvas) {
      const config: ChartConfiguration = {
        type: 'pie',
        data: {
          labels: this.mediaData.map(item => item.name),
          datasets: [{
            data: this.mediaData.map(item => item.value ?? 0),
            backgroundColor: this.COLORS,
            borderColor: 'white',
            borderWidth: 2,

          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      };
      this.chart = new Chart(this.mediaCanvas.nativeElement, config);
    }
  }
}

// Location Distribution Chart Component
@Component({
  selector: 'app-location-chart',
  template: `<canvas #locationCanvas></canvas>`,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LocationChartComponent implements AfterViewInit {
  @ViewChild('locationCanvas') locationCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() locationData: ChartDataItem[] = [];
  private chart?: Chart;

  private readonly COLORS = [
    '#ff01ff',
    '#0f35ff',
    '#8018ff',
    '#4f26ff',
    '#cc0dff'
  ];

  ngAfterViewInit() {
    setTimeout(() => this.initializeChart(), 0);
  }

  private initializeChart() {
    if (this.locationCanvas) {
      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: this.locationData.map(item => item.area),
          datasets: [{
            label: 'Number of Entries',
            data: this.locationData.map(item => item.entries ?? 0),
            backgroundColor: this.COLORS,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 1, 255, 0.1)' }
            },
            x: {
              grid: { color: 'rgba(15, 53, 255, 0.1)' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      };
      this.chart = new Chart(this.locationCanvas.nativeElement, config);
    }
  }
}