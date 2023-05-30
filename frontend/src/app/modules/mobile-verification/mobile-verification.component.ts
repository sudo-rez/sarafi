import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {UserService} from "../../services/user.service";
import {ApiService} from "../../services/api.service";
import {Ent, NotifyService, Opr} from "../../services/notify.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {UserStorage} from "../../interfaces/user-storage";
import {Router} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {NotificationType} from "angular2-notifications";
import {TranslateService} from "@ngx-translate/core";
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-mobile-verification',
  templateUrl: './mobile-verification.component.html',
  styles: []
})
export class MobileVerificationComponent implements OnInit {

  @ViewChild('cellphone') cellphone: ElementRef;
  @ViewChild('key') key: ElementRef;
  @ViewChild('mobile') mobile: ElementRef;

  public codeSent = false;
  public mobile_verify: boolean;
  public phone = "";

  constructor(
    private _userService: UserService,
    private _api: ApiService,
    private _translate: TranslateService,
    private _notify: NotifyService,
    private _fb: FormBuilder,
    private _router: Router
  ) {
    this._migrateForm();
  }



  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "fullname": "",
      "email": "",
      "martial": "",
      "sex": "",
      "cellphone": ""
    });
  }

  private _getUser(): void {
    this._api.set('user', "GET", {}, (res: { user: User }): void => {
      this.form.patchValue(res.user);
    });
  }

  ngOnInit() {
    this._getUser();
    if (this.mobile_verify) {
      this.timeToNavigate = 8;
      let t = setInterval(() => {
        this.timeToNavigate = this.timeToNavigate - 1;
        if (this.timeToNavigate == 0) {
          this._router.navigateByUrl('/main');
          clearInterval(t);
        }
      }, 1000);
    }
  }

  public timeToNavigate = 8;
  public formSubmitted: boolean = false;
  public sendPhoneNumber() {
    this.phone = this.cellphone.nativeElement.value;
    this.formSubmitted = true;
    if (this.form.invalid) return;
    this.form.controls['cellphone'].setValue(this.phone);
    this._api.set("user/profile", "POST", {
      body: this.form.value
    }, (res: { user: User }): void => {
      // TODO: We can Use "this._userService.updateUserStorage()" instead of following lines
      let userStorage: UserStorage = this._userService.userStorage();
      userStorage.user = res.user;
      this._userService.setUserStorage(userStorage);
      this.codeSent = true;
      this._notify.status(Opr.Send, Ent.Send_to_Mobile);
    },(err: HttpErrorResponse) => {
      let msg = err.error['err'];
      switch (msg) {
        case 'otp limitation error': {
          this._translate.get("verify-mobile.otp-limitation-error").subscribe( text => {
            this._notify.create(text.title, text.text, NotificationType.Error);
          });
          break;
        }
        case 'mobile is duplicate': {
          this._translate.get("verify-mobile.mobile-is-duplicate").subscribe( text => {
            this._notify.create(text.title, text.text, NotificationType.Error);
          });
          break;
        }
      }
    })


  }

  public sendApproveCode() {
    let code = this.key.nativeElement.value;
    this._api.set("auth/verify_cellphone?cellphone=" + this.phone + "&key=" + code, "GET", {},
      (res): void => {
        this._api.set('user', "GET", {}, (res: { user: User }): void => {
          let userStorage: UserStorage = this._userService.userStorage();
          userStorage.user = res.user;
          this._userService.setUserStorage(userStorage);
        });
        this.timeToNavigate = 8;
        let t = setInterval(() => {
          this.timeToNavigate = this.timeToNavigate - 1;
          if (this.timeToNavigate == 0) {
            this._router.navigate(['/main']);
            clearInterval(t);
          }
        }, 1000);
        this.mobile_verify = true;
      },
      (err: HttpErrorResponse) => {
      let msg = err.error['err'];
      switch (msg) {
        case 'invalid otp': {
          this._translate.get("verify-mobile.invalid-otp").subscribe( text => {
            this._notify.create(text.title, text.text, NotificationType.Error);
          });
          break;
        }
        case 'key has been expired': {
          this._translate.get("verify-mobile.key-has-been-expired").subscribe( text => {
            this._notify.create(text.title, text.text, NotificationType.Error);
          });
          break;
        }
      }
      });
  }

}
