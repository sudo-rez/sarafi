import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from '../../services/user.service';
import { ApiService } from '../../services/api.service';

import { LoginResult } from '../../interfaces/user-storage';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: []
})
export class AuthComponent implements OnInit {

  constructor(
    private _router: Router,
    private _userService: UserService,
    private _api: ApiService
  ) {
    if (this._userService.isLoggedIn())
      this._router.navigate(['/']);
  }

  ngOnInit() { }

  ngOnDestroy() {
    this._api.remove('auth/oauth/google');
  }
}
