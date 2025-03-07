import betterLogging from 'better-logging';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '/../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

betterLogging(console, {
    format: (ctx) => {
        const now = moment();
        const time = `${chalk.gray('[')}${chalk.keyword('orange')(now.format('HH:mm:ss'))}${chalk.gray(']')}`;
        const date = `${chalk.gray('[')}${chalk.keyword('orange')(now.format('YYYY-MM-DD'))}${chalk.gray(']')}`;
        return `${time} ${date} ${ctx.type} >> ${ctx.msg}`;
    },
    saveToFile: path.join(logsDir, `${moment().format('YYYY-MM-DD')}.log`),
    color: {
        base: chalk.gray,
        type: {
            debug: chalk.cyan,
            info: chalk.blue,
            log: chalk.keyword('orange'),
            error: chalk.red,
            warn: chalk.yellow,
        },
    },
});
