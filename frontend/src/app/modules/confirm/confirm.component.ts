import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Subject } from 'rxjs';




@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
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

export class ConfirmComponent implements OnInit {
  @Input() set open(flag: boolean) {
    if (!flag) return;
    this._openModal();
  };
  @Input() set data(detail:string){
    this.detail = detail
  }
  @Output() flag = new EventEmitter<boolean>();

  constructor(
  ) {
  }

 

  ngOnInit() { 
  }

  public modalState: 'invisible' | 'visible' = 'invisible';
  detail = "";


  
  private _openModal(): void {
    this.modalState = 'visible';
  }
  public closeModal(flag:boolean = false): void {
    this.modalState = 'invisible';
    this.flag.emit(flag)
  }
  public submit(): void {
    this.closeModal(true)
  }

  ngOnDestroy() {
  }
}
