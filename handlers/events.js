const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const { logMessage } = require('../functions/logs');

module.exports = async function (client) {
    let numberOfLoadedEvents = 0;
    logMessage('Loading Events Handler . . .', colors.yellow);

    const eventsPath = path.join(__dirname, '/../events');
    const eventFolders = fs.readdirSync(eventsPath);

    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(path.join(eventsPath, folder)).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            try {
                const eventPath = path.join(eventsPath, folder, file);
                const event = require(eventPath);

                if (event.once) {
                    client.once(event.name, async (...args) => {
                        try {
                            await event.execute(...args);
                        } catch (error) {
                            console.error(colors.red(`Error executing event ${event.name} in ${folder}/${file}: ${error.message}`));
                        }
                    });
                } else {
                    client.on(event.name, async (...args) => {
                        try {
                            await event.execute(...args);
                        } catch (error) {
                            console.error(colors.red(`Error executing event ${event.name} in ${folder}/${file}: ${error.message}`));
                        }
                    });
                }

                numberOfLoadedEvents++;
            } catch (err) {
                console.error(colors.red(`Failed to load event: ${folder}/${file}`));
                console.error(colors.red(err.stack || err));
            }
        }
    }

    logMessage(`Loaded ${numberOfLoadedEvents} events`, colors.green);
};
