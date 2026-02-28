import winston from 'winston';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

const { combine, timestamp, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp }) => {
  const ts = (timestamp as string).slice(11, 19);
  switch (level) {
    case 'error':
      return `${chalk.gray(ts)} ${chalk.red('ERR')} ${message}`;
    case 'warn':
      return `${chalk.gray(ts)} ${chalk.yellow('WRN')} ${message}`;
    case 'info':
      return `${chalk.gray(ts)} ${chalk.blue('INF')} ${message}`;
    case 'debug':
      return `${chalk.gray(ts)} ${chalk.gray('DBG')} ${message}`;
    default:
      return `${chalk.gray(ts)} ${message}`;
  }
});

export function createLogger(verbose: boolean = false): winston.Logger {
  return winston.createLogger({
    level: verbose ? 'debug' : 'info',
    transports: [
      new winston.transports.Console({
        format: combine(timestamp(), consoleFormat),
      }),
    ],
  });
}

export function createProgressBar(total: number): cliProgress.SingleBar {
  return new cliProgress.SingleBar(
    {
      format: `  {bar} {percentage}% | {value}/{total} | {status}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic,
  );
}

export type Logger = winston.Logger;
