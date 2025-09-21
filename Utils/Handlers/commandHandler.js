import { logger } from '../Tools/customLogger.js'
import { loadFiles } from '../Tools/fileReader.js'
import { pathToFileURL } from 'url'

export async function loadCommands(client) {
    await client.commands.clear()
    let commandsArray = []

    const Files = await loadFiles('Commands')
    for (const file of Files) {
        const commandModule = await import(pathToFileURL(file).href + `?update=${Date.now()}`)
        const command = commandModule.default

        client.commands.set(command.data.name, command)
        commandsArray.push(command.data.toJSON())
    }

    await client.application.commands.set(commandsArray)
    logger("INFO", `Loaded ${Files.length} commands.`)
}
