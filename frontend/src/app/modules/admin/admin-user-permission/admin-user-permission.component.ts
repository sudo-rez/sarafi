import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/user.service';
import { User } from 'src/app/interfaces/user';

interface getFeaturesResponse {
  result: Array<string>,
}
@Component({
  selector: 'admin-user-permission',
  templateUrl: './admin-user-permission.component.html',
  styles: [],
  animations: [
    trigger('toggle-modal', [
      state('invisible', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('visible', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('invisible <=> visible', animate('100ms ease-in'))
    ])
  ]
})
export class AdminUserPermissionComponent implements OnInit {
  @Input() set user(user: User) {
    if (!user) return;
    this.userInfo = user
    this._openModal();
  };
  @Output() flag = new EventEmitter<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    public _userService:UserService
  ) {
    this._migrateForm();
  }

  public userInfo :User 
  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "permissions": [{}],
    });
  }

  ngOnInit() {
    this.getFeatures()
   }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this.modalState = 'visible';
    this.checkCheckbox = this.userInfo.permissions || {}
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this._userService.updateUserStorage()
    this.flag.emit(true)

  }
  public checkCheckbox = {}
  public selectFeature(feature:string){
    this.checkCheckbox[feature] = !this.checkCheckbox[feature] ;
  }

  public submit(): void {
    
    this._api.set(`user/perm?id=${this.userInfo._id}`, "POST", {
      id: "addPerm",
      body: {"permissions":this.checkCheckbox}
    }, (res: any): void => {
      this._translate.get("notify.user.update").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }
  public features: Array<string> = []
  public getFeatures(){
    this._api.set("user/roles", "GET", {}, (res: getFeaturesResponse): void => {
      this.features = res.result || [];
    });
  }
  ngOnDestroy() {
    this._api.remove('addPerm');
  }
}
