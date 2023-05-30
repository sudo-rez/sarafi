import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

@Component({
  selector: 'pagination',
  templateUrl: './pagination.component.html',
  styleUrls: []
})
export class PaginationComponent implements OnInit {
  @Input() currentPage: number;
  @Input() totalPages: number;
  @Output() callback: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  public visibility: boolean;

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this._generateList();
  }

  public pages: number[];
  private _generateList(): void {
    if (!this.totalPages || this.totalPages <= 1 || !this.currentPage || this.currentPage <= 0 || this.currentPage > this.totalPages) {
      this.visibility = false;
      return;
    };
    this.visibility = true;

    this.pages = [];
    let index: number;

    if (this.totalPages > 5 && this.currentPage >= 3)
      if (this.currentPage + 2 <= this.totalPages)
        index = this.currentPage - 2;
      else
        index = this.totalPages - 4;
    else
      index = 1;

    while (index <= this.totalPages && this.pages.length < 5) {
      this.pages.push(index);
      index++;
    }
  }

  public changePage(pageNumber: number): void {
    if (pageNumber == this.currentPage)
      return;
    if (pageNumber < 1)
      this.callback.emit(1);
    else if (pageNumber > this.totalPages)
      this.callback.emit(this.totalPages);
    else
      this.callback.emit(pageNumber);
  }
}
