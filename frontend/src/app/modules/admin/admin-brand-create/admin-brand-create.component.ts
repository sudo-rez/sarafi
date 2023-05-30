import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';
import { QueryService } from '../../../services/query.service';

import { ApiService } from '../../../services/api.service';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from '../../../interfaces/user';
import { Subject } from 'rxjs';

interface getUsersResponse {
  result: Array<User>,
  page: number,
  total_pages: number
}

interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number
}

@Component({
  selector: 'admin-brand-create',
  templateUrl: './admin-brand-create.component.html',
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

export class AdminBrandCreateComponent implements OnInit {
  @Input() set open(flag: boolean) {
    if (!flag) return;
    this._openModal();
  };
  @Output() flag = new EventEmitter<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    public query: QueryService

  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "name": ["", Validators.compose([Validators.required])],
      "wage": [0, Validators.compose([Validators.required])],
      "adminuser": ["", Validators.compose([Validators.required])],
      "adminpassword": ["", Validators.compose([Validators.required,Validators.minLength(6), Validators.maxLength(12)])],
      "key": [""],
      "logo": [""],
    });
  }

  ngOnInit() { 
  }

  public modalState: 'invisible' | 'visible' = 'invisible';
  userPage = 1;
  userSearch = "";
  userTotalCount = 0;
  loadingUser = false;
  inputUser$ = new Subject<string>();

  
  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'created_at',
    ...this.query.params()
  }
  private _openModal(): void {
    this.modalState = 'visible';
    this.getUsers()
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
    this.flag.emit(false)

  }
  public users: Array<User> = [];
  public getUsers(search: string = this.filters.search) {
    this._api.set("user/l", "GET", { params: this.filters }, (res: getUsersResponse): void => {
      this.users = res.result || [];
      this.filters.page = res.page;
      this.query.set(this.filters);
    });
  }

  private timeout_searchUsers?: number;
  public onSearchUsers(value: string) {

    window.clearTimeout(this.timeout_searchUsers);

    this.timeout_searchUsers = window.setTimeout(() => this.getUsers(value), 1000);

  }
  trackByUserFn(item) {
    return item.id;
  }
  openUsers() {
    setTimeout(() => {
      if (this.userSearch) {
        this.userSearch = "";
        this.userPage = 1;
        this.getUsers();
      }
    }, 100);

  }

  onScrollToEndUser() {
    if (this.loadingUser || this.userTotalCount <= this.users.length) {
      return;
    } else {
      this.fetchMoreUser();
    }
  }

  fetchMoreUser() {
    this.userPage += 1;
    this.loadingUser = true;

    this.getUsers();
  }

  public setUser(event) {
    if(event) {
      this.form.get('adminuser').patchValue(event['username']);
    } else {
      this.form.get('adminuser').patchValue("");
    }
  }

  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
  
    this._api.set(`brand/c`, "POST", {
      id: "createBrand",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.brand.create").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  onFileSelected(event) {
    this.convertFile(event.target.files[0]).subscribe(base64 => {
      this.form.controls['logo'].setValue("data:image/png;base64, "+base64)
    });
  }

  convertFile(file : File) : Observable<string> {
    const result = new ReplaySubject <string>(1);
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (event) => result.next(btoa(event.target.result.toString()));
    return result;
  }
  ngOnDestroy() {
    this._api.remove('createBrand');
  }
}
