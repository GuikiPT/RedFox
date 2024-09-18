const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

module.exports = async function (client) {
    let numberOfLoadedSlashs = 0;
    console.log(colors.yellow('Loading Slash Commands Handler . . .'));

    const commandFolders = fs.readdirSync(path.join(__dirname, '/../commands/slashs'));

    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(path.join(__dirname, '/../commands/slashs', folder)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const command = require(path.join(__dirname, '/../commands/slashs', folder, file));
                client.slashsCmds.set(command.data.name, command);

                numberOfLoadedSlashs++;
            } catch (err) {
                console.error(colors.red(`Failed to load slash command: ${file}`));
                console.error(colors.red(err.stack || err));
            }
        }
    }

    console.log(colors.green(`Loaded ${numberOfLoadedSlashs} slash commands`));
};
