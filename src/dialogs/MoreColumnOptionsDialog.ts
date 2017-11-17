import Column from '../model/Column';
import ADialog from './ADialog';
import {addIconDOM, createToolbarMenuItems} from '../ui/engine/header';
import {IRankingHeaderContext} from '../ui/engine/interfaces';


export default class MoreColumnOptionsDialog extends ADialog {

  /**
   * opens a rename dialog for the given column
   * @param column the column to rename
   * @param header the visual header element of this column
   * @param title optional title
   * @param ctx
   */
  constructor(readonly column: Column, header: HTMLElement, title = 'More', private ctx: IRankingHeaderContext) {
    super(header, title);
  }

  openDialog() {
    const popup = this.makeMenuPopup('');
    popup.classList.add('lu-more-options');

    createToolbarMenuItems(<any>addIconDOM(popup, this.column, true), this.column, this.ctx);
  }
}