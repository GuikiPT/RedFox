const Discord = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    name: Discord.Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.slashsCmds.get(interaction.commandName);

            if (!command) {
                console.warn(colors.yellow(`Command ${interaction.commandName} not found.`));
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(colors.red(error.stack || error));
                await handleCommandError(interaction, 'There was an error while executing this command!');
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.slashsCmds.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(colors.red(error.stack || error));
            }
        }
    },
};

async function handleCommandError(interaction, errorMessage) {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
    }
}
