declare namespace NodeJS {
  interface Global {
    debug: any
  }
}
declare interface Array<T> {
  includes (args: T[]): boolean
}

declare interface Object {
  assign (...args: any[]): any
}

declare var Promise: any;
