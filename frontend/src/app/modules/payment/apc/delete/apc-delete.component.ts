import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../../services/api.service';
import { APC } from 'src/app/interfaces/apc';

@Component({
  selector: 'apc-delete',
  templateUrl: './apc-delete.component.html',
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
export class APCDeleteComponent implements OnInit {
  @Input() set apc(apc: APC) {
    if (!apc) return;
    this.apcInfo = apc
    this._openModal();
  };
  
  @Output() deleteFlag = new EventEmitter<boolean>();
  public apcInfo: APC;

  constructor(
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService
  ) {}



  ngOnInit() { }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.deleteFlag.emit(true)
  }

  public formSubmited: boolean = false;
  public submit(): void {    
    this._api.set(`brand/apc/d?id=`+this.apcInfo._id, "DELETE", {
      id: "deleteAPC",
    }, (res: any): void => {
      this._translate.get("notify.apc.delete").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  ngOnDestroy() {
    this._api.remove('deleteAPC');
  }
}
