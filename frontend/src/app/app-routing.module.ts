import {
  NgModule
} from '@angular/core';
import {
  Routes,
  RouterModule
} from '@angular/router';

import {
  AuthGuard
} from './guards/auth.guard';
import {
  AdminAccessGuard
} from './guards/admin-access.guard';

const routes: Routes = [
  // Dashboard
  {
    path: 'main',
    loadChildren: () => import('../app/modules/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  // Auth
  {
    path: 'auth',
    loadChildren: () => import('../app/modules/auth/auth.module').then(m => m.AuthModule)
  },
  // Store Manager
  {
    path: 'store/manager',
    loadChildren: () => import('../app/modules/store-manager/store-manager.module').then(m => m.StoreManagerModule),
    canActivate: [AuthGuard, AdminAccessGuard]
  },
  // txn
  {
    path: 'txn',
    loadChildren: () => import('../app/modules/txn/txn.module').then(m => m.TxnModule),
    canActivate: [AuthGuard]
  },
   // withdraw
   {
    path: 'withdraw',
    loadChildren: () => import('../app/modules/withdraw/withdraw.module').then(m => m.WithdrawModule),
    canActivate: [AuthGuard]
  },
  // card verification
  {
    path: 'card',
    loadChildren: () => import('../app/modules/cardverification/cardverification.module').then(m => m.TxnModule),
    canActivate: [AuthGuard]
  },
  // Customer
  {
    path: 'customer',
    loadChildren: () => import('../app/modules/customer/customer.module').then(m => m.CustomerModule),
    canActivate: [AuthGuard, AdminAccessGuard]
  },
  // Admin
  {
    path: 'management',
    loadChildren: () => import('../app/modules/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  // Payment
  {
    path: 'payment',
    loadChildren: () => import('../app/modules/payment/payment.module').then(m => m.PaymentModule),
    canActivate: [AuthGuard]
  },
  // Setting
  {
    path: 'setting',
    loadChildren: () => import('../app/modules/setting/setting.module').then(m => m.SettingModule),
    canActivate: [AuthGuard]
  },
  // Other
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/main'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false,
    relativeLinkResolution: 'legacy'
  })],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {}