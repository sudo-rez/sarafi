import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';

import { CardVerificationComponent } from './cardverification/cardverification.component';


const routes: Routes = [
  {
    path: 'verify',
    component: CardVerificationComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'cardverification',
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
export class CardVerificationRoutingModule { }
