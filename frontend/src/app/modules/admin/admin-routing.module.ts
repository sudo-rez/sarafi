import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminBrandListComponent } from './admin-brand-list/admin-brand-list.component';
import { AdminCustomerListComponent } from './admin-customer-list/admin-customer-list.component';
import { AdminWalletListComponent } from './wallet/wallet-list/admin-wallet-list.component';

const routes: Routes = [
    // Admin brand List
    {
      path: 'brand',
      component: AdminBrandListComponent,
      data: {
        title: 'admin.brand-list'
      }
    },
  // Admin user List
  {
    path: 'user',
    component: AdminUserListComponent,
    data: {
      title: 'admin.user-list'
    }
  },
  // Admin Customer List
  {
    path: 'customer',
    component: AdminCustomerListComponent,
    data: {
      title: 'admin.customer-list'
    }
  },
  // Wallet route
  {
    path: 'wallet',
    component: AdminWalletListComponent,
    data: {
      title: 'admin.wallet-list'
    }
  },
  // Other Routes
  {
    path: '',
    pathMatch: 'prefix',
    redirectTo: 'user'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
