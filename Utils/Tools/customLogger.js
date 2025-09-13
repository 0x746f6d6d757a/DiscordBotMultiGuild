import chalk from 'chalk'

/**
 * @param {"INFO"|"WARN"|"ERROR"|"DEBUG"} level
 * @param {string} message
 */
export function logger(level, message) {
    const currentTimestamp = dateFormatter()
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

function dateFormatter(date = new Date()) {

    const pad = (n) => n.toString().padStart(2, '0')
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `[${day}/${month}/${year} - ${hours}:${minutes}:${seconds}]`;
}