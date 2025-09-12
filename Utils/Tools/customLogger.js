import chalk from 'chalk';

/**
 * @param {"INFO"|"WARN"|"ERROR"|"DEBUG"} level
 * @param {string} message
 */
export function logger(level, message) {
    const currentTimestamp = `[${new Date().toISOString()}]`;
    switch (level) {
        case "INFO":
            console.log(chalk.blue(`${currentTimestamp} [INFO]: ${message}`));
            break;
        case "WARN":
            console.warn(chalk.yellow(`${currentTimestamp} [WARN]: ${message}`));
            break;
        case "ERROR":
            console.error(chalk.red(`${currentTimestamp} [ERROR]: ${message}`));
            break;
        case "DEBUG":
            console.debug(chalk.gray(`${currentTimestamp} [DEBUG]: ${message}`));
            break;
        default:
            console.log(`${currentTimestamp} [UNKNOWN]: ${message}`);
    }
}