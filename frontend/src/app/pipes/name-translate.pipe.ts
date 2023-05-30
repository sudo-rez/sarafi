import { Pipe, PipeTransform, OnDestroy } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

interface Item {
  base_name_fa: string,
  base_name_en: string
}

@Pipe({
  name: 'nameTranslate',
  pure: false
})
export class NameTranslatePipe implements PipeTransform, OnDestroy {

  private $onLangChange;
  public currentLang: string = this._translate.currentLang;

  constructor(
    private _translate: TranslateService
  ) {
    this.$onLangChange = this._translate.onLangChange.subscribe(data => {
      this.currentLang = data.lang;
    });
  }

  transform(item: { [key: string]: any }, args: { [key: string]: string } = { fa: "base_name_fa", en: "base_name_en" }): any {
    for (const key in args)
      if (this.currentLang == key)
        return item[args[key]];
    return "";
  }

  ngOnDestroy() {
    this.$onLangChange.unsubscribe();
  }

}
