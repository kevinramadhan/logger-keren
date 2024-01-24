import { Injectable } from '@nestjs/common';
import { LoggerKeren } from './utils/logger';

@Injectable()
export class AppService {
    constructor(private loggerKeren: LoggerKeren) {}

    getHello(): Record<string, any> {
        this.loggerKeren.log(null, 'this log is from AppService');
        return {
            message: 'Hello World!',
        };
    }
}
