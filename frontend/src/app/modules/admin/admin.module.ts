import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxSmartModalModule } from "ngx-smart-modal";

import { AdminBrandListComponent } from './admin-brand-list/admin-brand-list.component';
import { AdminBrandCreateComponent } from './admin-brand-create/admin-brand-create.component';
import { AdminBrandDeleteComponent } from './admin-brand-delete/admin-brand-delete.component';
import { AdminBrandEditComponent } from './admin-brand-edit/admin-brand-edit.component';
import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminResetUserPassComponent } from './admin-reset-user-pass/admin-reset-user-pass.component';
import { AdminUserCreateComponent } from './admin-user-create/admin-user-create.component';
import { AdminUserDeleteComponent } from './admin-user-delete/admin-user-delete.component';
import { AdminUserPermissionComponent } from './admin-user-permission/admin-user-permission.component';
import { AdminCustomerListComponent } from './admin-customer-list/admin-customer-list.component';
import {AdminWalletListComponent} from './wallet/wallet-list/admin-wallet-list.component'
import { NgSelectModule } from '@ng-select/ng-select';
import { AdminWalletChargeComponent } from './wallet/wallet-charge/admin-wallet-charge.component';
import { AdminWalletHistoryComponent } from './wallet/wallet-history/admin-wallet-history.component';
@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    NgxSmartModalModule.forRoot(),
    NgSelectModule
  ],
  declarations: [
    AdminUserListComponent,
    AdminResetUserPassComponent,
    AdminCustomerListComponent,
    AdminUserCreateComponent,
    AdminUserDeleteComponent,
    AdminBrandListComponent,
    AdminBrandCreateComponent,
    AdminBrandDeleteComponent,
    AdminUserPermissionComponent,
    AdminBrandEditComponent,
    AdminWalletListComponent,
    AdminWalletChargeComponent,
    AdminWalletHistoryComponent
  ]
})
export class AdminModule { }
