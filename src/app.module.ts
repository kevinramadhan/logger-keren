import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { LoggerMiddleware } from './middleware/logger.middleware';
import { CorrelationModule } from './correlation/correlation.module';
import { LoggerKeren } from './utils/logger';

@Module({
    imports: [CorrelationModule],
    controllers: [AppController],
    providers: [AppService, LoggerKeren],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
