import {resolveComplex} from '../../src/provider/ACommonDataProvider';

function get(v: any, column: string) {
  return resolveComplex(column, v);
}

test('simple', () => {
  expect(get({a: 5}, 'a')).toBe(5);
  expect(get({a: 'A'}, 'a')).toBe('A');
});

test('complex', () => {
  const object = {a: [{b: {c: 3}}]};
  expect(get(object, 'a[0].b.c')).toBe(3);
});

test('invalid', () => {
  expect(get({a: 5}, 'b')).toBe(undefined);
  expect(get({a: 'A'}, 'a.c')).toBe(undefined);
});
