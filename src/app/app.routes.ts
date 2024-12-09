import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'new-entry',
    loadComponent: () => import('./pages/new-entry/new-entry.page').then(m => m.NewEntryPage)
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full'
  },
  {
    path: 'new-entry',
    loadComponent: () => import('./pages/new-entry/new-entry.page').then( m => m.NewEntryPage)
  },
];
