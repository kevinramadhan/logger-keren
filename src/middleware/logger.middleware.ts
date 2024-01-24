import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CorrelationService } from 'src/correlation/correlation.service';
import { LoggerKeren } from 'src/utils/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(
        private correlationService: CorrelationService,
        private loggerKeren: LoggerKeren,
    ) {}

    use(request: Request, response: Response, next: NextFunction): void {
        // set correlation id
        const uuid = uuidv4();
        this.correlationService.set<string>('correlation-id', uuid);

        // get request logs
        const requestLog = this.getRequestLog(request);
        this.loggerKeren.log(requestLog, 'Request Payload');

        // get response logs
        this.getResponseLog(response);

        next();
    }

    getRequestLog = (req: Request) => {
        return {
            request: {
                method: req.method,
                url: req.originalUrl,
                query: req.query,
                body: req.body,
                headers: req.headers,
                ip: req.ip,
            },
        };
    };

    getResponseLog = (res: Response) => {
        const logger = this.loggerKeren;
        const rawResponse = res.write;
        const rawResponseEnd = res.end;
        const chunkBuffers = [];
        // New chunk passed in as Buffer each time write() is called by stream
        // Take chunks as a rest parameter since it is an array. This allows applying Array methods directly (ref MDN)
        // res.write below is in object mode for write to avoid needing encoding arg (https://nodejs.org/api/stream.html#writable_writevchunks-callback)
        // console.log(`Beginning res.write`);
        res.write = (...chunks) => {
            const resArgs = [];
            for (let i = 0; i < chunks.length; i++) {
                resArgs[i] = chunks[i];
                // This handling comes in when buffer is full, hence rawResponse === false after rawResponse.apply() below
                // Ref: Example under https://nodejs.org/api/stream.html#class-streamwritable
                // Callback (res.write) resumes write stream
                if (!resArgs[i]) {
                    res.once('drain', res.write);
                    // Resume from last falsy iteration
                    --i;
                }
            }
            // Copy buffer to new buffer instance then push into chunks[]
            // resArgs[0] contains the response body
            if (resArgs[0]) {
                chunkBuffers.push(Buffer.from(resArgs[0]));
            }
            // res.write shuold return true if the internal buffer is less than the default highWaterMark. If false is returned, further attempts to write data to the stream should stop until the 'drain' event is emitted.
            // The apply() method accepts two arguments (Ref: https://www.javascripttutorial.net/javascript-apply-method/):
            // thisArg (res) is the value of 'this' provided for function rawResponse
            // The args argument (restArgs) is an array that specifies the arguments of the function rawResponse
            return rawResponse.apply(res, resArgs);
        };
        // console.log(`chunks: `, Buffer.from(chunkBuffers).toJSON());
        // console.log(`Done writing, beginning res.end`);
        res.end = (...chunk) => {
            const resArgs = [];
            for (let i = 0; i < chunk.length; i++) {
                resArgs[i] = chunk[i];
            }
            // Copy buffer to new buffer instance then push into chunks[]
            // resArgs[0] contains the response body
            if (resArgs[0]) {
                chunkBuffers.push(Buffer.from(resArgs[0]));
            }
            // Encode buffer as utf8 JSON string
            let body = Buffer.concat(chunkBuffers).toString('utf8');

            try {
                body = JSON?.parse(body);
            } catch (error) {
                logger.warn(null, 'Warning: Response body is string!');
            }

            // Set custom header for response
            res.setHeader('origin', 'restjs-req-res-logging-repo');
            const responseLog = {
                response: {
                    statusCode: res.statusCode,
                    body: body || {},
                    // Returns a shallow copy of the current outgoing headers
                    headers: res.getHeaders(),
                },
            };

            logger.log(responseLog, 'Response Payload');

            // res.end() is satisfied after passing in restArgs as params
            // Doing so creates 'end' event to indicate that the entire body has been received.
            // Otherwise, the stream will continue forever (ref: https://nodejs.org/api/stream.html#event-end_1)
            rawResponseEnd.apply(res, resArgs);
            return responseLog as unknown as Response;
        };

        return res;
    };
}
