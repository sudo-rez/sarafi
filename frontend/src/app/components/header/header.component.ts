import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styles: []
})
export class HeaderComponent implements OnInit {
  @Output() public sidebarToggle: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private _translate: TranslateService,
    public userService: UserService
  ) { }

  ngOnInit(): void { }

  public checked: boolean = this._translate.currentLang == 'fa';
  public toggleLanguage(event) {
    this._translate.use(event.target.checked ? 'fa' : 'en').subscribe(() => {
    });
  }

  public logout(event): void {
    event.preventDefault();
    this.userService.logout();
  }

}
