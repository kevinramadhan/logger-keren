import { Injectable, Logger } from '@nestjs/common';
import { CorrelationService } from 'src/correlation/correlation.service';

@Injectable()
export class LoggerKeren {
    logger: Logger;

    constructor(private correlationService: CorrelationService) {
        this.logger = new Logger(LoggerKeren.name);
    }

    dataLog(data: Record<string, any>, message: string = '', severity: string = '') {
        return JSON.stringify({
            severity,
            correlationId: this.correlationService.get<string>('correlation-id'),
            message,
            data,
        });
    }

    log(data: Record<string, any>, message: string = '') {
        this.logger.log(this.dataLog(data, message, 'log'));
    }

    debug(data: Record<string, any>, message: string = '') {
        this.logger.debug(this.dataLog(data, message, 'debug'));
    }

    error(data: Record<string, any>, message: string = '') {
        this.logger.error(this.dataLog(data, message, 'error'));
    }

    fatal(data: Record<string, any>, message: string = '') {
        this.logger.fatal(this.dataLog(data, message, 'fatal'));
    }

    verbose(data: Record<string, any>, message: string = '') {
        this.logger.verbose(this.dataLog(data, message, 'verbose'));
    }

    warn(data: Record<string, any>, message: string = '') {
        this.logger.warn(this.dataLog(data, message, 'warn'));
    }
}
