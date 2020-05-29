import { isArray, maybeArray } from './array';
import { isNumber } from './number';
// import { AsString, IsString } from './string';
import { expectIssue, expectSuccess, expectValue } from './test-helpers';

// interface MyObject {
//   a: number;
//   b: string;
// }

// interface ParentObject {
//   o: MyObject;
//   s: string;
// }

describe('isArray', () => {
  it('will fail non-array', () => {
    const fut = isArray();
    expectIssue(fut, null, 'not-defined');
    expectIssue(fut, undefined, 'not-defined');
    expectIssue(fut, 0, 'incorrect-type');
    expectIssue(fut, new Date(), 'incorrect-type');
    expectIssue(fut, {}, 'incorrect-type');
    expectIssue(fut, 'test', 'incorrect-type');
  });

  it('will accept array', () => {
    const fut = isArray();
    expectSuccess(fut, []);
    expectSuccess(fut, [{ a: 47 }]);
    expectSuccess(fut, [12]);
    expectSuccess(fut, [1, 2, 3, 4, 5, 'a', 'c']);
  });

  it('will give issue if range outside expected', () => {
    const fut = isArray(undefined, { minLength: 1, maxLength: 2 });
    expectIssue(fut, [], 'min-length');
    expectSuccess(fut, [{ a: 47 }]);
    expectSuccess(fut, [12]);
    expectSuccess(fut, [12, 34]);
    expectIssue(fut, [1, 2, 3, 4, 5, 'a', 'c'], 'max-length');
  });

  it('will process items', () => {
    const fut = isArray(isNumber({ coerceMax: 500, min: 25 }));
    expectSuccess(fut, []);
    expectSuccess(fut, [87]);
    expectValue(fut, [87, 223, 543, 56], [87, 223, 500, 56]);
    expectIssue(fut, [87, 2, 45], 'min', [1]);
    expectIssue(fut, [87, test, 45], 'incorrect-type', [1]);
  });
});

describe('maybeArray', () => {
  it('will fail non-array', () => {
    const fut = maybeArray();
    expectValue(fut, null, undefined);
    expectValue(fut, undefined, undefined);
    expectIssue(fut, 0, 'incorrect-type');
    expectIssue(fut, new Date(), 'incorrect-type');
    expectIssue(fut, {}, 'incorrect-type');
    expectIssue(fut, 'test', 'incorrect-type');
  });

  it('will accept array', () => {
    const fut = maybeArray();
    expectSuccess(fut, []);
    expectSuccess(fut, [{ a: 47 }]);
    expectSuccess(fut, [12]);
    expectSuccess(fut, [1, 2, 3, 4, 5, 'a', 'c']);
  });

  it('will give issue if range outside expected', () => {
    const fut = maybeArray(undefined, { minLength: 1, maxLength: 2 });
    expectIssue(fut, [], 'min-length');
    expectSuccess(fut, [{ a: 47 }]);
    expectSuccess(fut, [12]);
    expectSuccess(fut, [12, 34]);
    expectIssue(fut, [1, 2, 3, 4, 5, 'a', 'c'], 'max-length');
  });
});
