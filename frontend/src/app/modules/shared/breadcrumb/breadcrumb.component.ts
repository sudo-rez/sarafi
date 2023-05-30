import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: []
})
export class BreadcrumbComponent implements OnInit {
  @Input() public title: string;

  constructor() { }
  ngOnInit() { }

  ngOnDestroy() { }
}
