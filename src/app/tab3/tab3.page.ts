import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonItemDivider, IonLabel, IonItem, IonList, IonHeader, IonToolbar, IonTitle, IonContent, IonToggle],
})
export class Tab3Page {
  darkMode: boolean = false;
  version: string = '1.0.0'; // Replace with your app version

  constructor() {
    // Check if dark mode preference exists in localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      this.darkMode = JSON.parse(savedDarkMode);
      this.applyTheme(this.darkMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.darkMode = prefersDark.matches;
      this.applyTheme(this.darkMode);
    }

    // Listen for system dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mediaQuery) => {
      if (localStorage.getItem('darkMode') === null) {
        this.darkMode = mediaQuery.matches;
        this.applyTheme(this.darkMode);
      }
    });
  }

  onDarkModeToggle(event: any) {
    this.darkMode = event.detail.checked;
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    this.applyTheme(this.darkMode);
  }

  private applyTheme(dark: boolean) {
    // Apply to document body
    document.body.classList.toggle('dark', dark);

    // Apply to all major Ionic components
    const components = document.querySelectorAll(
      'ion-content, ion-toolbar, ion-list, ion-item, ion-tab-bar, ion-tab-button'
    );

    components.forEach(component => {
      component.classList.toggle('dark', dark);
    });
  }
}
