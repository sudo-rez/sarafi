import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'excerpt'
})
export class ExcerptPipe implements PipeTransform {

  transform(text: string, limit?: number){
    if(!text) return null;
    let desiredLimit = (limit) ? limit : 50;
    return text.substr(0, desiredLimit) + (text.length > 7 ? '...' : '');
  }

}
