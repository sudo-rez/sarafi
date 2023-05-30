import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '../../guards/auth.guard';

import { AuthComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        component: LoginComponent,
        data: {
          title: 'auth.login'
        }
      },
    ]
  },
  {
    path: 'password/reset',
    component: ResetPasswordComponent,
    data: {
      title: 'auth.reset-pass'
    }
  },
  {
    path: 'user/profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'auth.user-profile'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
