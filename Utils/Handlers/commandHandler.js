const { loadFiles } = require('../Tools/fileReader')

async function loadCommands(client) {

    await client.commands.clear();
    let commandsArray = [];

    const Files = await loadFiles('Commands');

    Files.forEach((file) => {
        const command = require(file);
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
    });

    client.application.commands.set(commandsArray);
    return console.log(`Loaded ${Files.length} commands.`)
}


module.exports = { loadCommands }