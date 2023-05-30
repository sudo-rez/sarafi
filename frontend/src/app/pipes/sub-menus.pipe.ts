import { Pipe, PipeTransform } from '@angular/core';

import { Menu } from '../interfaces/menu';

@Pipe({
  name: 'subMenus'
})
export class SubMenusPipe implements PipeTransform {

  transform(values: Menu[], args?: string[]): any {
    if (!values.length) return values;
    /**
     * Combine child menus (Recursive function)
     */
    let menus: Array<{ id: string, title: string }> = [];
    function pushMenu(children: Menu[], parent: string = ""): void {
      for (const menu of children) {
        let title = `${parent}${menu.title}</span>`;
        menus.push({
          id: menu.id,
          title
        });
        pushMenu(menu.children || [], title + " - <span>");
      }
    }
    pushMenu(values, '<span>');
    return menus;
  }

}
