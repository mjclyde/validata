import { isIssue, Issue, IssueResult, Next, Result, ValueProcessor } from './types';

export interface WithDefault<T> {
  default?: T;
}

export interface MaybeOptions {
  incorrectTypeToUndefined?: boolean;
  strictParsing?: boolean;
}

export type UndefinedHandler<T> = () => Result<T> | undefined;
export type Definitely<T> = (next: Next<unknown, T>) => (value: unknown) => Result<T>;
export type IsAs<T> = (next: Next<T, T>) => (value: unknown) => Result<T>;
export type Maybe<T> = (next: Next<unknown, T>) => (value: unknown) => Result<T | undefined>;
export type Empty = (value: unknown) => boolean;
export type Check<T> = (value: unknown) => value is T;
export type Convert<T> = (value: unknown) => T | undefined;
export type Coerce<T, O> = (options?: O) => (next: Next<T, T>) => (value: T) => Result<T>;
export type Validate<T, O> = (value: T, options?: O) => IssueResult | undefined;

export const withDefault = <T>(options?: WithDefault<T>): UndefinedHandler<T> => (): Result<T> | undefined => {
  if (options && 'default' in options) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { value: options.default! };
  }
  return undefined;
};

export const definitely = <T>(undefinedHandler?: UndefinedHandler<T>): Definitely<T> => (next) => (value) => {
  if (value === undefined || value === null) {
    return (undefinedHandler && undefinedHandler()) ?? { issues: [Issue.from(value, 'not-defined')] };
  }
  return next(value);
};

export const nullOrUndefined: Empty = (value) => {
  return value === null || value === undefined;
};

export const maybe = <T>(empty: Empty, check: Check<T>, options?: MaybeOptions, undefinedHandler?: UndefinedHandler<T>): Maybe<T> => (next) => (value) => {
  if (empty(value)) {
    return (undefinedHandler && undefinedHandler()) ?? { value: undefined };
  }

  if (options?.incorrectTypeToUndefined) {
    if (!check(value)) {
      return { value: undefined };
    }
  }

  const result = next(value);
  if (isIssue(result) && result.issues.length === 1 && result.issues[0].reason === 'no-conversion') {
    if (options?.strictParsing) return result;
    return { value: undefined };
  }
  return result;
};

export const is = <T>(check: Check<T>, typeName: string): IsAs<T> => (next) => (value) => {
  if (!check(value)) {
    return { issues: [Issue.from(value, 'incorrect-type', { expectedType: typeName })] };
  }
  return next(value);
};

export const as = <T>(convert: Convert<T>, typeName: string, undefinedHandler?: UndefinedHandler<T>): IsAs<T> => (next) => (value) => {
  const converted = convert(value);
  if (converted === undefined || converted === null) {
    return (undefinedHandler && undefinedHandler()) ?? { issues: [Issue.from(value, 'no-conversion', { toType: typeName })] };
  }
  return next(converted);
};

export const createIsCheck = <T, TCoerceOptions, TValidationOptions>(
  typeName: string,
  check: Check<T>,
  coerce: Coerce<T, TCoerceOptions>,
  validate: (value: T, options?: TValidationOptions) => IssueResult | undefined,
) => (options?: TCoerceOptions & TValidationOptions): ValueProcessor<T> => {
  return {
    process: definitely<T>()(is(check, typeName)(coerce(options)((value) => {
      const result = validate(value, options);
      return result ?? { value };
    }))),
  };
};

export const createMaybeCheck = <T, TCoerceOptions, TValidationOptions>(
  typeName: string,
  check: Check<T>,
  coerce: Coerce<T, TCoerceOptions>,
  validate: (value: T, options?: TValidationOptions) => IssueResult | undefined,
  empty = nullOrUndefined,
) => (options?: MaybeOptions & TCoerceOptions & TValidationOptions): ValueProcessor<T | undefined> => {
  return {
    process: maybe(empty, check, options)(is(check, typeName)(coerce(options)((value) => {
      const result = validate(value, options);
      return result ?? { value };
    }))),
  };
};

export const createAsCheck = <T, TCoerceOptions, TValidationOptions>(
  typeName: string,
  convert: Convert<T>,
  coerce: Coerce<T, TCoerceOptions>,
  validate: (value: T, options?: TValidationOptions) => IssueResult | undefined,
) => (options?: WithDefault<T> & TCoerceOptions & TValidationOptions): ValueProcessor<T> => {
  return {
    process: definitely<T>(withDefault(options))(as(convert, typeName, withDefault(options))(coerce(options)((value) => {
      const result = validate(value, options);
      return result ?? { value };
    }))),
  };
};

export const createMaybeAsCheck = <T, TCoerceOptions, TValidationOptions>(
  typeName: string,
  check: Check<T>,
  convert: Convert<T>,
  coerce: Coerce<T, TCoerceOptions>,
  validate: (value: T, options?: TValidationOptions) => IssueResult | undefined,
  empty = nullOrUndefined,
) => (options?: MaybeOptions & WithDefault<T> & TCoerceOptions & TValidationOptions): ValueProcessor<T | undefined> => {
  return {
    process: maybe(empty, check, options, withDefault(options))(
      as(convert, typeName, withDefault(options))(coerce(options)((value) => {
        const result = validate(value, options);
        return result ?? { value };
      })),
    ),
  };
};
