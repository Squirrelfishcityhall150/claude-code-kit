/**
 * Logger utility for colored console output
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  log(message: string): void {
    console.log(message);
  }

  header(message: string): void {
    console.log();
    console.log(chalk.bold.cyan('┌' + '─'.repeat(message.length + 4) + '┐'));
    console.log(chalk.bold.cyan('│  ' + message + '  │'));
    console.log(chalk.bold.cyan('└' + '─'.repeat(message.length + 4) + '┘'));
    console.log();
  }

  section(title: string): void {
    console.log();
    console.log(chalk.bold(title));
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  list(items: string[], bullet = '•'): void {
    items.forEach((item) => {
      console.log(chalk.gray(`  ${bullet}`), item);
    });
  }

  keyValue(key: string, value: string): void {
    console.log(chalk.gray(`  ${key}:`), chalk.white(value));
  }

  box(title: string, content: string[]): void {
    const maxLength = Math.max(title.length, ...content.map((c) => c.length));
    const width = maxLength + 4;

    console.log();
    console.log(chalk.cyan('┌' + '─'.repeat(width) + '┐'));
    console.log(
      chalk.cyan('│') +
        '  ' +
        chalk.bold(title) +
        ' '.repeat(width - title.length - 2) +
        chalk.cyan('│')
    );
    console.log(chalk.cyan('└' + '─'.repeat(width) + '┘'));
    content.forEach((line) => {
      console.log('  ' + line);
    });
    console.log();
  }

  newLine(): void {
    console.log();
  }
}

export const logger = new Logger();
