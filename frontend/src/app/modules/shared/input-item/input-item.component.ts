import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'input-item',
  templateUrl: './input-item.component.html',
  styles: []
})
export class InputItemComponent {
  @Input() public disabled: boolean = false;
  @Input() public label: string;
  @Input() public index: number;

  @Output() public itemRemoved: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  public removeItem() {
    this.itemRemoved.emit(this.index);
  }
}
