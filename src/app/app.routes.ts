import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () => import('./component/home/home').then(module => module.HomeComponent),
    title: 'Strategium',
    },
    {
    path: 'tabletop-match',
    loadComponent: () => import('./component/tabletop-match/tabletop-match').then(module => module.TabletopMatchComponent),
    title: 'Tabletop Match | Strategium',
    },
    {
    path: 'fab-match',
    loadComponent: () => import('./component/fab-match/fab-match').then(module => module.FabMatchComponent),
    title: 'FAB Match | Strategium',
    },
    {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
    },
    { path: '**', redirectTo: '' },
];
