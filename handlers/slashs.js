const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const { logMessage } = require('../functions/logs');

module.exports = async function (client) {
    let numberOfLoadedSlashs = 0;
    logMessage('Loading Slash Commands Handler . . .', colors.yellow);

    const commandsPath = path.join(__dirname, '/../commands/slashs');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const commandPath = path.join(commandsPath, folder, file);
                const command = require(commandPath);
                
                if (command && command.data && command.data.name) {
                    client.slashsCmds.set(command.data.name, command);
                    numberOfLoadedSlashs++;
                } else {
                    console.error(colors.red(`Invalid command structure in: ${folder}/${file}`));
                }
            } catch (error) {
                console.error(colors.red(`Failed to load slash command: ${folder}/${file}`));
                console.error(colors.red(error.message));
            }
        }
    }

    logMessage(`Loaded ${numberOfLoadedSlashs} slash commands`, colors.green);
};
