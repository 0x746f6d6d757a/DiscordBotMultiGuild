import { logger } from '../Tools/customLogger.js'
import { loadFiles } from '../Tools/fileReader.js'
import { pathToFileURL } from 'url'

export async function loadEvents(client) {
    client.events = new Map()
    const Files = await loadFiles('Events')

    for (const file of Files) {
        const event = await import(pathToFileURL(file).href)

        const execute = (...args) => event.default.execute(...args, client)
        const target = event.default.rest ? client.rest : client
        target[event.default.once ? "once" : "on"](event.default.name, execute)

        client.events.set(event.default.name, execute)
    }

    logger('INFO', `Loaded ${Files.length} events.`)
}
