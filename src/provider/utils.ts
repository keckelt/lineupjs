/**
 * Created by Samuel Gratzl on 15.08.2017.
 */
import {default as Column, IColumnDesc} from '../model/Column';
import {extent} from 'd3';
import {isNumberColumn, isSupportType} from '../model';
import Ranking from '../model/Ranking';


export interface IDeriveOptions {
  /**
   * maximal percentage of unique values to be treated as a categorical column
   */
  categoricalThreshold: number;
}


function deriveType(label: string, value: any, column: number | string, data: any[], options: IDeriveOptions): IColumnDesc {
  const base: any = {
    type: 'string',
    label,
    column,
  };
  if (typeof value === 'number') {
    base.type = 'number';
    base.domain = extent(data, (d) => d[column]);
    return base;
  }
  if (typeof value === 'boolean') {
    base.type = 'boolean';
    return base;
  }
  if (typeof value === 'string') {
    //maybe a categorical
    const categories = new Set(data.map((d) => d[column]));
    if (categories.size < data.length * options.categoricalThreshold) { // 70% unique guess categorical
      base.type = 'categorical';
      base.categories = categories;
    }
    return base;
  }
  //unknown type
  return base;
}

export function deriveColumnDescriptions(data: any[], options: Partial<IDeriveOptions> = {}) {
  const config = Object.assign({
    categoricalThreshold: 0.7,
  }, options);
  const r: IColumnDesc[] = [];
  if (data.length === 0) {
    // no data to derive something from
    return r;
  }
  const first = data[0];
  if (Array.isArray(first)) {
    //array of arrays
    return first.map((v, i) => deriveType(`Col${i}`, v, i, data, config));
  }
  //objects
  return Object.keys(first).map((key) => deriveType(key, first[key], key, data, config));
}


export interface IExportOptions {
  /**
   * export separator, default: '\t'
   */
  separator: string;
  /**
   * new line character, default: '\n'
   */
  newline: string;
  /**
   * should a header be generated, default: true
   */
  header: boolean;
  /**
   * quote strings, default: false
   */
  quote: boolean;
  /**
   * quote string to use, default: '"'
   */
  quoteChar: string;
  /**
   * filter specific column types, default: exclude all support types (selection, action, rank)
   * @param col the column description to filter
   */
  filter: (col: IColumnDesc) => boolean; //!isSupportType

  /**
   * whether the description should be part of the column header
   */
  verboseColumnHeaders: boolean;
}

/**
 * utility to export a ranking to a table with the given separator
 * @param ranking
 * @param data
 * @param options
 * @returns {Promise<string>}
 */
export function exportRanking(ranking: Ranking, data: any[], options: Partial<IExportOptions> = {}) {
  const opts = <IExportOptions>Object.assign({
    separator: '\t',
    newline: '\n',
    header: true,
    quote: false,
    quoteChar: '"',
    filter: (c: IColumnDesc) => !isSupportType(c),
    verboseColumnHeaders: false
  }, options);

  //optionally quote not numbers
  const escape = new RegExp(`[${opts.quoteChar}]`, 'g');

  function quote(l: string, c?: Column) {
    if ((opts.quote || l.indexOf('\n') >= 0) && (!c || !isNumberColumn(c))) {
      return `${opts.quoteChar}${l.replace(escape, opts.quoteChar + opts.quoteChar)}${opts.quoteChar}`;
    }
    return l;
  }

  const columns = ranking.flatColumns.filter((c) => opts.filter!(c.desc));
  const order = ranking.getOrder();

  const r: string[] = [];
  if (opts.header) {
    r.push(columns.map((d) => quote(`${d.label}${opts.verboseColumnHeaders && d.description ? `\n${d.description}` : ''}`)).join(opts.separator));
  }
  data.forEach((row, i) => {
    r.push(columns.map((c) => quote(c.getLabel(row, order[i]), c)).join(opts.separator));
  });
  return r.join(opts.newline);
}