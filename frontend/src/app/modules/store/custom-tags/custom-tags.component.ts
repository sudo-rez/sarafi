import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';

import { CustomMetaTag } from '../../../interfaces/store';

@Component({
  selector: 'store-custom-tags',
  templateUrl: './custom-tags.component.html',
  styles: []
})
export class CustomTagsComponent implements OnInit, OnChanges {

  @Input("form") public form: FormGroup;
  public customTagsFormArray: FormArray;

  @Input("customTags") set customTags(customTags: Array<CustomMetaTag>) {
    for (const customTag of customTags)
      this.customTagsFormArray.push(this._makeCustomTag(customTag));
  };

  constructor(
    private _fb: FormBuilder,
  ) { }

  public newCustomTag: FormGroup = this._makeCustomTag();

  private _makeCustomTag(customTag?: CustomMetaTag): FormGroup {
    return this._fb.group({
      "name": [customTag ? customTag.name : "", Validators.required],
      "content": [customTag ? customTag.content : "", Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.form && changes.form.firstChange)
      this.customTagsFormArray = <FormArray>this.form.get(['seoanddomine', 'custom_meta_tags']);
  }

  ngOnInit() { }

  public preSubmit(event): void {
    if (!this.newCustomTag.dirty)
      return;
    if (this.newCustomTag.invalid) {
      event.preventDefault();
      return;
    }
    this.customTagsFormArray.push(this.newCustomTag);
    this.newCustomTag = this._makeCustomTag();
  }

  public editCustomTag(customTag: FormGroup, itemIndex: number): void {
    this.newCustomTag = customTag;
    this.newCustomTag.updateValueAndValidity();
    this.removeCustomTag(itemIndex);
  }

  public removeCustomTag(itemIndex: number): void {
    this.customTagsFormArray.removeAt(itemIndex);
  }
}
