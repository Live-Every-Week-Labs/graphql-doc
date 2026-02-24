import chalk from 'chalk';
import ora, { Ora } from 'ora';

export function createSpinner(text: string, quiet: boolean): Ora | null {
  if (quiet) {
    return null;
  }

  return ora(text).start();
}

export function spinnerSucceed(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.succeed(message);
    return;
  }

  if (!quiet) {
    console.log(chalk.green(message));
  }
}

export function spinnerFail(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.fail(message);
    return;
  }

  if (!quiet) {
    console.error(chalk.red(message));
  }
}

export function spinnerWarn(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.warn(message);
    return;
  }

  if (!quiet) {
    console.warn(chalk.yellow(message));
  }
}
