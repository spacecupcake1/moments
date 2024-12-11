import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
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
  {
    path: 'entry-detail',
    loadComponent: () => import('./pages/entry-detail/entry-detail.page').then( m => m.EntryDetailPage)
  },
  {
    path: 'entry/:id',
    loadComponent: () => import('./pages/entry-detail/entry-detail.page').then(m => m.EntryDetailPage)
  },
  {
    path: 'edit-entry',
    loadComponent: () => import('./pages/edit-entry/edit-entry.page').then( m => m.EditEntryPage)
  },
  {
    path: 'entry-detail/:id',
    loadComponent: () => import('./pages/entry-detail/entry-detail.page').then(m => m.EntryDetailPage)
  },
  {
    path: 'edit-entry/:id',
    loadComponent: () => import('./pages/edit-entry/edit-entry.page').then(m => m.EditEntryPage)
  },

];
