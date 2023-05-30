import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { APCListComponent } from './apc/list/apc-list.component';
import { SAPCListComponent } from './sapc/list/sapc-list.component';



const routes: Routes = [
  {
    path: 'apc',
    component: APCListComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'sidebar.apc',
    }
  },
  {
    path: 'sapc',
    component: SAPCListComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'sidebar.sapc',
    }
  },
//   {
//     path: 'create',
//     component: BannerCreateComponent,
//     canActivate: [AdminAccessGuard],
//     canActivateChild: [AdminAccessGuard],
//     data: {
//       title: 'banner.create.title',
//     }
//   },
//   {
//     path: 'edit/:id',
//     component: BannerCreateComponent,
//     canActivate: [AdminAccessGuard],
//     canActivateChild: [AdminAccessGuard],
//     data: {
//       title: 'banner.create.edit',
//     }
//   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule { }
