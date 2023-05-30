import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localSearch'
})
export class LocalSearchPipe implements PipeTransform {

  transform(items: any[], term: string, properties: string[]): any {
    if (!term || !items) return items;

    return items.filter((item: any) => {
      for (let property of properties) {
        if (item[property] && item[property].toString().toLowerCase().includes(term.toLowerCase()))
          return true;
      }
      return false;
    });
  }

}
