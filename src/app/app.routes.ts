import { Routes } from '@angular/router';
import { HomeComponent } from './component/home/home';
import { TabletopMatchComponent } from './component/tabletop-match/tabletop-match';
import { FabMatchComponent } from './component/fab-match/fab-match';

export const routes: Routes = [
    {
    path: '',
    component: HomeComponent
    },
    {
    path: 'tabletop-match',
    component: TabletopMatchComponent
    },
    {
    path: 'fab-match',
    component: FabMatchComponent
    },
    {
    path: 'home',
    component: HomeComponent
    }
];
