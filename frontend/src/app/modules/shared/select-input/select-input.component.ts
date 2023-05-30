import { Component, OnInit, Input, Output, SimpleChanges, EventEmitter, HostBinding, HostListener, ViewChild, ElementRef } from '@angular/core';

interface Item {
  name: string,
  id: string
}

@Component({
  selector: 'select-input',
  templateUrl: './select-input.component.html',
  styles: [],
  host: {
    '[class.is-empty]': '!this.items.length'
  }
})
export class SelectInputComponent implements OnInit {

  @Input() public placeholder: string = '';
  @Input() public inputid: string = 'select-input';
  @Input() public disabled: boolean = false;
  @Input() public list: any[] = [];
  @Input() public translate: string = undefined;
  @Input() public itemkey: string = 'name';
  @Input() public itemvalue: string = 'id';
  @Input() set defaults(defaults: any[]) {
    if (!defaults.length) return;
    let newItemsValue: object[] = [];
    defaults.forEach((item: {[name: string]: string}) => {
      let newItem: Item = {
        name: item[this.itemkey],
        id: item[this.itemvalue]
      };
      this.items.push(newItem);
      newItemsValue.push(newItem);
      this.added.emit(newItem);
    });
    if (newItemsValue.length)
      this.changed.emit(newItemsValue);
  };

  @Input() public multi: boolean = false;
  @Input() public maxLength: number = 20;
  @Input() public allowDuplicate: boolean = false;
  @Input() public apiSearch: boolean = false;
  @Input() public forceSearch: number = 0;
  @Input() public caseSensetive: boolean = false;
  @Input() public matchFirst: boolean = false;

  @HostBinding('class.inputref-focused') public inputRefFocused: boolean = false;
  @HostBinding('class.input-focused') public inputFocused: boolean = false;
  @HostBinding('class.input-disabled') public inputDisabled: boolean = false;

  @ViewChild('selectInputRef') private _inputElement: ElementRef;
  @HostListener('click') private _focus(): void {
    this._inputElement.nativeElement.focus();
  }

  public focused(event): void {
    this.inputValue = "";
    this.inputRefFocused = true;
    this.inputFocused = true;
  }

  public _blurTimeout: any;
  public blured(event): void {
    let newItem = {name: event.target.value, id: ""};

    this.inputRefFocused = false;
    this.selectedItemIndex = null;

    if (this._blurTimeout)
      clearTimeout(this._blurTimeout);

    this._blurTimeout = setTimeout(() => {

      if (!this.inputRefFocused) {
        this.inputFocused = false;
      }
      if (!this.inputFocused && !this.inputRefFocused) {
        if (!this.allowDuplicate && this.isExist(newItem)) {
          return;
        }
        if(newItem.name != ""){
          this.items.push(newItem);
          this.added.emit(newItem);
          this.changed.emit(this.items);
          this._limitCheck();
        }
      }

    }, 200);
  }

  @Output() public changed: EventEmitter<object[]> = new EventEmitter<object[]>();
  @Output() public added: EventEmitter<Item> = new EventEmitter<Item>();
  @Output() public removed: EventEmitter<Item> = new EventEmitter<Item>();
  @Output() public query: EventEmitter<string> = new EventEmitter<string>();

  public inputValue: string = '';
  public items: Item[] = [];
  public filteredList: Item[] = [];
  public selectedItemIndex: number;

  constructor() { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this._filterList();
    this._limitCheck();
  }

  private _limitCheck(): void {
    this.inputDisabled = this.disabled || (!this.multi && this.items.length >= 1) || (this.maxLength && this.items.length >= this.maxLength);
  }

  public keyUp(event): void {
    this.inputFocused = true;
    switch (event.keyCode) {
      case 38: // Up
        if (this.filteredList.length)
          this.selectedItemIndex = !this.selectedItemIndex ? this.filteredList.length - 1 : this.selectedItemIndex - 1;
        return;
      case 40: // Down
        if (this.filteredList.length)
          this.selectedItemIndex = this.selectedItemIndex == null || this.selectedItemIndex == this.filteredList.length - 1 ? 0 : this.selectedItemIndex + 1;
        return;
      case 13: // Enter
        if (this.selectedItemIndex != null){
          this.addItem(this.filteredList[this.selectedItemIndex]);
        } else {
          this.addItem({name: event.target.value, id: ""})
        }
        return;

      case 32: // Space
        break;

      case 27: // Escape
        this.inputFocused = false;
        this.selectedItemIndex = null;
        break;

      default:
        this.inputChanged();
        break;
    }
  }

  public keyDown(event): void {
    switch (event.keyCode) {
      case 8: // Backspace
        this._handleBackspace();
        break;
      case 46: // Delete
        this._handleBackspace();
        break;
      case 32: // Space
        if (this.selectedItemIndex != null) {
          this.addItem(this.filteredList[this.selectedItemIndex]);
          event.preventDefault();
        } else
          this.inputChanged();
        break;
    }
  }

  public keyPress(event): void { }

  public inputChanged(event?): void {
    if (this.apiSearch)
      this.query.emit(this.converToEnDigit(this.inputValue));
    else
      this._filterList();
  }

  public converToEnDigit(str) {
    return str
      .replace(/۰/g, "0")
      .replace(/۱/g, "1")
      .replace(/۲/g, "2")
      .replace(/۳/g, "3")
      .replace(/۴/g, "4")
      .replace(/۵/g, "5")
      .replace(/۶/g, "6")
      .replace(/۷/g, "7")
      .replace(/۸/g, "8")
      .replace(/۹/g, "9")
      .replace(/٠/g, "0")
      .replace(/١/g, "1")
      .replace(/٢/g, "2")
      .replace(/٣/g, "3")
      .replace(/٤/g, "4")
      .replace(/٥/g, "5")
      .replace(/٦/g, "6")
      .replace(/٧/g, "7")
      .replace(/٨/g, "8")
      .replace(/٩/g, "9");
  };

  private _filterList(): void {
    this.filteredList = this.list.map((item: any): Item => {
      return {
        name: this.converToEnDigit(item[this.itemkey]),
        id: item[this.itemvalue]
      };
    }).filter((item: Item) => {
      if (!this.inputValue.length) return true;
      let text = this.caseSensetive ? item.name : item.name.toLowerCase(),
        phrase = this.caseSensetive ? this.inputValue : this.converToEnDigit(this.inputValue.toLowerCase());
      if (this.matchFirst)
        return text.substring(0, phrase.length) === phrase;
      else
        return text.includes(phrase);
    });
  }

  public addItem(newItem: Item): void {
    this._focus();
    if (!this.allowDuplicate && this.isExist(newItem)) {
      let itemIndex: number = this.items.map((item: Item) => (item.name + item.id).toString())
        .indexOf((newItem.name + newItem.id).toString());
      this.removeItem(itemIndex);
      return;
    }
    this.inputValue = "";
    this.items.push(newItem);
    this.added.emit(newItem);
    this.changed.emit(this.items);
    this._limitCheck();
  }

  public isExist(newItem: Item): boolean {
    return this.items.map((item: Item) => (item.name + item.id).toString())
      .includes((newItem.name + newItem.id).toString());
  }

  public removeItem(itemIndex: number): void {
    this.removed.emit(this.items[itemIndex]);
    this.items.splice(itemIndex, 1);
    this.changed.emit(this.items);
    this._limitCheck();
  }

  public removaAllItems(): void {
    for (const item of this.items)
      this.removed.emit(item);
    this.items = [];
    this.changed.emit([]);
    this._limitCheck();
  }

  private _handleBackspace(): void {
    if (!this.inputValue.length && this.items.length) {
      this.removed.emit(this.items[this.items.length - 1]);
      this.items.length = this.items.length - 1;
      this.changed.emit(this.items);
      this._limitCheck();
    }
  }
}