import { Component, OnInit, Input, Output, SimpleChanges, EventEmitter, HostBinding, HostListener, ViewChild, ElementRef, AfterContentInit } from '@angular/core';

@Component({
  selector: 'tag-input',
  templateUrl: './tag-input.component.html',
  styles: [],
  host: {
    '[class.is-empty]': '!this.items.length',
    '[class.input-disabled]': 'this.disabled'
  }
})
export class TagInputComponent implements OnInit, AfterContentInit {

  @Input() public placeholder: string = '';
  @Input() public inputid: string = 'tag-input';
  @Input() public disabled: boolean = false;
  @Input() set defaults(defaults: string[]) {
    if (defaults && defaults.length)
      this._addItems(defaults);
  };

  @Input() public delimiter: string = ',';
  @Input() public delimiterCode: number;
  @Input() public item: string[] = [];
  @Input() public addOnBlur: boolean = true;
  @Input() public addOnEnter: boolean = true;
  @Input() public addOnTab: boolean = true;
  @Input() public addOnSpace: boolean = false;
  @Input() public addOnPaste: boolean = true;
  @Input() public allowedItemsPattern: RegExp = /.+/;

  // TODO: Max limit

  @HostBinding('class.inputref-focused') private _inputRefFocused: boolean = false;

  @ViewChild('tagInputRef') private _inputElement: ElementRef;
  @HostListener('click') private _focus(): void {
    this._inputElement.nativeElement.focus();
  }

  @Output() public changed: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() public added: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() public removed: EventEmitter<string> = new EventEmitter<string>();


  public inputValue: string = '';
  public items: string[] = [];

  constructor() { 
    
  }

  ngOnInit() {
    this.items = this.item || [];
  }

  ngAfterContentInit(){
    
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.delimiterCode)
      this.delimiter = String.fromCharCode(this.delimiterCode);
    else
      this.delimiterCode = this.delimiter.charCodeAt(0);
  }

  public keyDown(event): void {
    switch (event.keyCode) {
      case 8: // Backspace
        this._handleBackspace();
        break;
      case 46: // Delete
        this._handleBackspace();
        break;

      case 9: // Tab
        if (this.addOnTab) {
          this._addItems([this.inputValue]);
          event.preventDefault();
        }
        break;
      case 13: // Enter
        this.addOnEnter && this._addItems([this.inputValue]);
        event.preventDefault();
        break;
      case 32: // Space
        if (this.addOnSpace) {
          this._addItems([this.inputValue]);
          event.preventDefault();
        }
        break;

      default:
        break;
    }
  }

  public keyPress(event): void {
    if (event.keyCode == this.delimiterCode) {
      this._addItems([this.inputValue]);
      event.preventDefault();
    }
  }

  public inputPaste(event): void {
    let clipboardData = event.clipboardData || (event.originalEvent && event.originalEvent.clipboardData);
    let pastedString = clipboardData.getData('text/plain');
    let items = this._splitString(pastedString);
    this._addItems(items);
    setTimeout(() => this.inputValue = '');
  }

  private _splitString(itemsString: string): string[] {
    itemsString = itemsString.trim();
    let items = itemsString.split(this.delimiter);
    return items.filter((item) => item && this._isItemValid(item));
  }

  private _isItemValid(item: string): boolean {
    return this.allowedItemsPattern.test(item);
  }

  public blured(event): void {
    this.inputValue.length && this.addOnBlur && this._addItems([this.inputValue]);
    this._inputRefFocused = false;
  }

  public focused(event): void {
    this._inputRefFocused = true;
  }

  private _addItems(items: string[]): void {
    let validItems = items.filter((item) => this._isItemValid(item));
    Array.prototype.push.apply(this.items, validItems);
    this._resetInput();
    this.added.emit(validItems);
    this.changed.emit(this.items);
  }

  public removeItem(itemIndex: number): void {
    this.removed.emit(this.items[itemIndex]);
    this.items.splice(itemIndex, 1);
    this.changed.emit(this.items);
  }

  public removaAllItems(): void {
    for (const item of this.items)
      this.removed.emit(item);
    this.items = [];
    this.changed.emit([]);
  }

  private _handleBackspace(): void {
    if (!this.inputValue.length && this.items.length) {
      this.removed.emit(this.items[this.items.length - 1]);
      this.items.length = this.items.length - 1;
      this.changed.emit(this.items);
    }
  }

  private _resetInput(): void {
    this.inputValue = '';
  }
}
