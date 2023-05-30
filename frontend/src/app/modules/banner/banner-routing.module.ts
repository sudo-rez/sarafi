import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BannerListComponent } from './banner-list/banner-list.component';
import { BannerCreateComponent } from './banner-create/banner-create.component';

import { AdminAccessGuard } from '../../guards/admin-access.guard';

const routes: Routes = [
  {
    path: '',
    component: BannerListComponent,
    canActivate: [AdminAccessGuard],
    canActivateChild: [AdminAccessGuard],
    data: {
      title: 'banner.list.title',
    }
  },
  {
    path: 'create',
    component: BannerCreateComponent,
    canActivate: [AdminAccessGuard],
    canActivateChild: [AdminAccessGuard],
    data: {
      title: 'banner.create.title',
    }
  },
  {
    path: 'edit/:id',
    component: BannerCreateComponent,
    canActivate: [AdminAccessGuard],
    canActivateChild: [AdminAccessGuard],
    data: {
      title: 'banner.create.edit',
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BannerRoutingModule { }
