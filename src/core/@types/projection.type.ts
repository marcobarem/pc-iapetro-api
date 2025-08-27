export type Projection<T> = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof T]?: 0 | 1
}
