import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/user.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';

import { UserStorage } from '../../../interfaces/user-storage';
import { User } from '../../../interfaces/user';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styles: []
})
export class UserProfileComponent implements OnInit {

  @ViewChild('avatar') avatar: ElementRef;

  constructor(
    private _fb: FormBuilder,
    private _api: ApiService,
    private _userService: UserService,
    private _notify: NotifyService,
  ) {
    this._migrateForm();
    this._getUser();
  }

  ngOnInit() { }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "fullname": ["", Validators.required],
      "email": "",
      "martial": "",
      "sex": "",
      "cellphone": ["", Validators.required],
      "desc": "",
      "avatar": ""
    });
  }

  private _getUser(): void {
    this._api.set('user', "GET", {}, (res: { user: User }): void => {
      this.form.patchValue(res.user);
    });
  }

  public formSubmitted: boolean = false;
  public submit(form: FormGroup) {
    this.formSubmitted = true;
    if (form.invalid) return;
    this._api.set("user/profile", "POST", {
      body: form.value
    }, (res: { user: User }): void => {
      // TODO: We can Use "this._userService.updateUserStorage()" instead of following lines
      let userStorage: UserStorage = this._userService.userStorage();
      userStorage.user = res.user;
      this._userService.setUserStorage(userStorage);
      this._notify.status(Opr.Edit, Ent.UserProfile);
    });
  }

  public uploadAvatar(event: Event): void {
    this._api.set('store/upload_images', 'POST', {
      id: "uploadAvatar",
      formData: true,
      body: {
        "images": event.target['files'][0]
      }
    }, (res) => {
      this.avatar.nativeElement.src = res['uploaded_images'][0]['original'];
      this.form.get('avatar').patchValue(res['uploaded_images'][0]['original']);
    });
  }

  ngOnDestroy() {
    this._api.remove("user");
    this._api.remove("user/profile");
    this._api.remove("uploadAvatar");
  }
}
