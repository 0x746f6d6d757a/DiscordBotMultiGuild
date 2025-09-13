import chalk from 'chalk'

/**
 * @param {"INFO"|"WARN"|"ERROR"|"DEBUG"|1|2|3|4} level
 * @param {string} message
 */
export function logger(level, message) {
    const currentTimestamp = `[${new Date().toISOString()}]`
    switch (level) {
        case "INFO" | 1:
            console.log(`${chalk.white(`${currentTimestamp} [INFO]`)} ${chalk.whiteBright(`${message}`)}`)
            break
        case "WARN" | 2:
            console.log(`${chalk.yellow(`${currentTimestamp} [WARN]`)} ${chalk.yellowBright(`${message}`)}`)
            break
        case "ERROR" | 3:
            console.log(`${chalk.red(`${currentTimestamp} [ERROR]`)} ${chalk.redBright(`${message}`)}`)
            break
        case "DEBUG" | 4:
            console.log(`${chalk.gray(`${currentTimestamp} [DEBUG] ${message}`)}`)
            break
        default:
            console.log(`${currentTimestamp} [UNKNOWN] ${message}`)
    }
}