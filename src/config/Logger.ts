import { WinstonModuleOptions, utilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize({ all: true }),
                winston.format.printf(({ level, message, timestamp }) => {
                    const colorizer = winston.format.colorize();
                    return `[${timestamp}] ${colorizer.colorize(level, level)}: ${message}`;
                }),
            ),
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            ),
        }),
    ],
};
