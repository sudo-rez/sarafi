import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'jalali-moment';

@Pipe({
  name: 'jalali'
})
export class JalaliPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let MomentDate = moment(value);
    try {
      if (args == "short") {
        return MomentDate.locale('fa').format('jYYYY-jMM-jDD');
      }else if(args == "middle"){
        return MomentDate.locale('fa').format('jYYYY/jMM/jDD-HH:mm');
      }
      return MomentDate.locale('fa').format('ddd jD jMMMM jYYYY - HH:mm');
    }
    catch {
      return "-";
    }
  }

}
