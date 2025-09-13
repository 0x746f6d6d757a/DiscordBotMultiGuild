import chalk from 'chalk'

/**
 * @param {"INFO"|"WARN"|"ERROR"|"DEBUG"} level
 * @param {string} message
 */
export function logger(level, message) {
    const currentTimestamp = `[${new Date().toISOString()}]`
    switch (level) {
        case "INFO":
            console.log(`${chalk.white(`${currentTimestamp} [INFO]`)} ${chalk.whiteBright(`${message}`)}`)
            break
        case "WARN":
            console.log(`${chalk.yellow(`${currentTimestamp} [WARN]`)} ${chalk.yellowBright(`${message}`)}`)
            break
        case "ERROR":
            console.log(`${chalk.red(`${currentTimestamp} [ERROR]`)} ${chalk.redBright(`${message}`)}`)
            break
        case "DEBUG":
            console.log(`${chalk.gray(`${currentTimestamp} [DEBUG] ${message}`)}`)
            break
        default:
            console.log(`${currentTimestamp} [UNKNOWN] ${message}`)
    }
}