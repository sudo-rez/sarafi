import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InviteManagerComponent } from './invite-manager/invite-manager.component';

const routes: Routes = [
  {
    path: 'invite',
    component: InviteManagerComponent,
    data: {
      title: 'store.manager.invite'
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreManagerRoutingModule { }
