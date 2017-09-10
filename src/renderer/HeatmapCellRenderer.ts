import {INumberColumn} from '../model/NumberColumn';
import Column from '../model/Column';
import {ICanvasRenderContext} from './RendererContexts';
import IDOMCellRenderer from './IDOMCellRenderers';
import {IDataRow} from '../provider/ADataProvider';
import {clipText, setText} from '../utils';
import ICanvasCellRenderer from './ICanvasCellRenderer';
import {hsl} from 'd3';
import ICellRendererFactory from './ICellRendererFactory';
import {AAggregatedGroupRenderer} from './AAggregatedGroupRenderer';
import {medianIndex, renderMissingValue} from './BarCellRenderer';

export function toHeatMapColor(d: any, index: number, col: INumberColumn & Column) {
  let v = col.getNumber(d, index);
  if (isNaN(v)) {
    v = 0;
  }
  //hsl space encoding, encode in lightness
  const color = hsl(col.color || Column.DEFAULT_COLOR);
  color.l = v;
  return color.toString();
}

export default class HeatmapCellRenderer extends AAggregatedGroupRenderer<INumberColumn & Column> implements ICellRendererFactory {
  createDOM(col: INumberColumn & Column): IDOMCellRenderer {
    return {
      template: `<div title="">
        <div style="background-color: ${col.color}"></div><div> </div>
      </div>`,
      update: (n: HTMLElement, d: IDataRow) => {
        const missing = col.isMissing(d.v, d.dataIndex);
        n.classList.toggle('lu-missing', missing);
        n.title = col.getLabel(d.v, d.dataIndex);
        (<HTMLDivElement>n.firstElementChild!).style.backgroundColor = missing ? null : toHeatMapColor(d.v, d.dataIndex, col);
        setText(<HTMLSpanElement>n.lastElementChild!, col.getCompressed() ? '' : n.title);
      }
    };
  }

  createCanvas(col: INumberColumn & Column, context: ICanvasRenderContext): ICanvasCellRenderer {
    const padding = context.option('rowBarPadding', 1);
    return (ctx: CanvasRenderingContext2D, d: IDataRow, i: number) => {
      const w = context.rowHeight(i) - padding * 2;
      if (col.isMissing(d.v, d.dataIndex)) {
        renderMissingValue(ctx, w, w, padding, padding);
        return;
      }
      ctx.fillStyle = toHeatMapColor(d.v, d.dataIndex, col);
      if (col.getCompressed()) {
        ctx.fillRect(padding, padding, w, w);
        return;
      }
      const cell = Math.min(context.colWidth(col) * 0.3, Math.max(context.rowHeight(i) - padding * 2, 0));
      ctx.fillRect(0, 0, cell, cell);
      ctx.fillStyle = context.option('style.text', 'black');
      clipText(ctx, col.getLabel(d.v, d.dataIndex), cell + 2, 0, context.colWidth(col) - cell - 2, context.textHints);
    };
  }

  protected aggregatedIndex(rows: IDataRow[], col: INumberColumn & Column) {
    return medianIndex(rows, col);
  }
}