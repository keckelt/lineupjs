import { IGroupData, IGroupItem, isGroup } from '../model';
import { IExceptionContext, setTransform } from 'lineupengine';
import { cssClass, SELECTED_COLOR } from '../styles';
import { everyIndices } from '../model/internal';

interface ISelectionBlock {
  rawY: number;
  y: number;
  height: number;
  firstRow: IGroupItem | IGroupData;
}

function isGroupSelected(group: IGroupData, selection: Set<number>) {
  let selected = 0;
  let unselected = 0;
  const total = group.order.length;
  everyIndices(group.order, (i) => {
    const s = selection.has(i);
    if (s) {
      selected++;
    } else {
      unselected++;
    }
    if (selected * 2 > total || unselected * 2 > total) {
      // more than half already, can abort already decided
      return false;
    }
    return true;
  });

  // more than 50%
  return selected * 2 > total;
}

const INDICATOR_WIDTH = 4;

export default class SelectionIndicator {
  readonly node: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private readonly scrollerNode: HTMLElement;
  private readonly scroller: {
    push(type: 'animation', cb: (act: { left: number; top: number; width: number; height: number }) => void);
    asInfo(): { left: number; top: number; width: number; height: number };
  };

  private selection: Set<number>;
  private data: readonly (IGroupItem | IGroupData)[];
  private rowContext: IExceptionContext;
  private blocks: ISelectionBlock[] = [];

  constructor(body: HTMLElement) {
    const node = body.ownerDocument.createElement('div');
    this.node = node;
    node.classList.add(cssClass('selection-indicator'));
    const canvas = body.ownerDocument.createElement('canvas');
    node.appendChild(canvas);
    this.canvas = canvas;
    this.canvas.width = INDICATOR_WIDTH;

    //sync scrolling of header and body
    // use internals from lineup engine
    this.scrollerNode = body;
    this.scroller = (body as any).__le_scroller__;
    this.scroller.push('animation', (act: { top: number; height: number; left: number; width: number }) => {
      this.updatePosition(act);
    });

    this.canvas.addEventListener('click', (e) => {
      this.onClick(e.clientY - this.node.getBoundingClientRect().top);
    });
  }

  updatePosition(act: { top: number; height: number; left: number; width: number } = this.scroller.asInfo()) {
    if (this.canvas.height !== act.height) {
      this.canvas.height = act.height;
    }
    setTransform(this.node, act.left + act.width - INDICATOR_WIDTH, act.top);
  }

  private toSelectionBlocks(
    data?: readonly (IGroupItem | IGroupData)[],
    rowContext?: IExceptionContext,
    selection?: Set<number>,
    height?: number
  ): ISelectionBlock[] {
    if (!data || !rowContext || !selection || selection.size === 0 || !height) {
      return [];
    }

    const posOf = (index: number) => {
      if (rowContext.exceptions.length === 0 || index < rowContext.exceptions[0].index) {
        // fast pass
        return index * rowContext.defaultRowHeight;
      }
      const before = rowContext.exceptions
        .slice()
        .reverse()
        .find((d) => d.index <= index);
      if (!before) {
        return -1;
      }
      if (before.index === index) {
        return before.y;
      }
      const regular = index - before.index - 1;
      return before.y2 + regular * rowContext.defaultRowHeight;
    };
    const blocks: ISelectionBlock[] = [];
    let currentBlock: ISelectionBlock | null = null;
    let currentBlockLastIndex = -1;
    data.forEach((row, i) => {
      const isSelected = isGroup(row) ? isGroupSelected(row, selection) : selection.has(row.dataIndex);
      if (!isSelected) {
        return;
      }
      if (currentBlock && currentBlockLastIndex + 1 === i) {
        // concat the selection block
        currentBlock.height += rowContext.exceptionsLookup.get(i) ?? rowContext.defaultRowHeight;
        currentBlockLastIndex = i;
        return;
      }
      // create a new block
      currentBlock = {
        firstRow: row,
        height: rowContext.exceptionsLookup.get(i) ?? rowContext.defaultRowHeight,
        y: 0,
        rawY: posOf(i),
      };
      blocks.push(currentBlock);
      currentBlockLastIndex = i;
    });

    // scale blocks
    const scaleFactor = height / rowContext.totalHeight;
    for (const block of blocks) {
      block.y = block.rawY * scaleFactor;
      block.height = Math.max(1, block.height * scaleFactor);
    }
    return blocks;
  }

  updateData(data: readonly (IGroupItem | IGroupData)[], rowContext: IExceptionContext) {
    this.data = data;
    this.rowContext = rowContext;
  }

  updateSelection(selection: Set<number>) {
    this.selection = selection;
    this.render();
  }

  private onClick(y: number) {
    if (!this.blocks || this.blocks.length === 0 || !this.rowContext) {
      return;
    }
    const block = this.blocks.find((d) => y >= d.y && y <= d.y + d.height);
    if (!block) {
      return;
    }
    const targetY = block.rawY - this.rowContext.defaultRowHeight;
    this.scrollerNode.scrollTo({
      behavior: 'auto',
      top: Math.max(targetY, 0),
    });
  }

  private render() {
    if (!this.selection || !this.data || !this.rowContext) {
      return;
    }
    this.blocks = this.toSelectionBlocks(this.data, this.rowContext, this.selection, this.canvas.height);
    this.node.classList.toggle(cssClass('some-selection'), this.blocks.length > 0);
    if (this.blocks.length === 0) {
      return;
    }
    const ctx = this.canvas.getContext('2d');
    ctx.resetTransform();
    ctx.clearRect(0, 0, INDICATOR_WIDTH, this.canvas.height);
    ctx.fillStyle = SELECTED_COLOR;
    for (const block of this.blocks) {
      ctx.fillRect(0, block.y, INDICATOR_WIDTH, block.height);
    }
  }
}
