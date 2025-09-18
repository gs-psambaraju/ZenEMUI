// Utility to convert snake_case object keys to camelCase recursively

const toCamel = (str: string): string =>
  str.replace(/[_-](\w)/g, (_, c) => (c ? c.toUpperCase() : ''));

export const toCamelCaseKeys = <T = any>(input: unknown): T => {
  if (Array.isArray(input)) {
    return input.map((item) => toCamelCaseKeys(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    Object.keys(obj).forEach((key) => {
      const camelKey = toCamel(key);
      result[camelKey] = toCamelCaseKeys(obj[key]);
    });
    return result as T;
  }
  return input as T;
};

export const buildQueryString = (params: Record<string, unknown> = {}): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};


