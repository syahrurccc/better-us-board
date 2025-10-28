import 'express-serve-static-core';

declare module 'http' {
  interface IncomingHttpHeaders {
    'x-user-id'?: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}