import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response, Request } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger();

  public use(req: Request, res: Response, next: NextFunction): void {
    // Gets the request log

    res.on('finish', () => {
      if (process.env.NODE_ENV === 'development') {
        Logger.log(`${res.statusCode} ${req.originalUrl}`, req.method);
      } else {
        const data = {
          url: req.originalUrl,
          method: req.method,
          status: res.statusCode,
          body: req.body,
          headers: JSON.stringify(req.headers),
        };

        this.logger.log('Http request', {
          payload: JSON.stringify(data),
          url: req.originalUrl,
        });
      }
    });

    next();
  }
}
