const { loadFiles } = require('../Tools/fileReader')

async function loadEvents(client) {

    client.events = new Map()

    const Files = await loadFiles('Events');
    for(const file of Files) {

        const event = require(file)
        const execute = (...args) => event.execute(...args, client)
        const target = event.rest ? client.rest : client

        target[event.once ? "once" : "on"](event.name, execute)
        client.events.set(event.name, execute)

    }

    console.log(`Events loaded: ${Files.length}`)

}

module.exports = { loadEvents }