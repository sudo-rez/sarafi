import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateCustomerComponent } from './create-customer/create-customer.component';


import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerViewComponent } from './customer-view/customer-view.component';

const routes: Routes = [
  {
    path: '',
    component: CustomerListComponent,
    data: {
      title: 'customer.list.title'
    }
  },
  // {
  //   path: 'view/:customerID',
  //   component: CustomerViewComponent,
  //   data: {
  //    // title: 'customer.view.title'
  //   }
  // },
  {
    path: 'create',
    component: CreateCustomerComponent,
    data: {
      title: 'customer.create.title'
    }
  },
  {
    path: 'edit/:customerID',
    component: CreateCustomerComponent,
    data: {
      title: 'customer.edit.title'
    }
  },
  {
    path: 'customer-view/:customerID',
    component: CustomerViewComponent,
    data: {
      title: 'customer.view.title'
    }
  } 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
