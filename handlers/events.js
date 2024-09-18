const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

module.exports = async function (client) {
    let numberOfLoadedEvents = 0;
    console.log(colors.yellow('Loading Events Handler . . .'));

    const eventFolders = fs.readdirSync(path.join(__dirname, '/../events'));

    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(path.join(__dirname, '/../events', folder)).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            try {
                const event = require(path.join(__dirname, '/../events', folder, file));

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args));
                } else {
                    client.on(event.name, (...args) => event.execute(...args));
                }

                numberOfLoadedEvents++;
            } catch (err) {
                console.error(colors.red(`Failed to load event: ${file}`));
                console.error(colors.red(err.stack || err));
            }
        }
    }

    console.log(colors.green(`Loaded ${numberOfLoadedEvents} events`));
};
