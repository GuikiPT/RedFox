const Discord = require('discord.js');
const colors = require('colors/safe');
const { logMessage } = require('../../functions/logs');

module.exports = {
    name: Discord.Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
            const command = getCommand(interaction);
            if (!command) return;

            try {
                if (interaction.isChatInputCommand()) {
                    await command.execute(interaction);
                } else if (interaction.isAutocomplete() && command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                logMessage(`Error in ${interaction.isChatInputCommand() ? 'command' : 'autocomplete'}: ${error.stack || error}`, colors.red);
                await handleInteractionError(interaction, 'There was an error while executing this command!');
            }
        }
    },
};

function getCommand(interaction) {
    const command = interaction.client.slashsCmds.get(interaction.commandName);
    if (!command) {
        logMessage(`Command ${interaction.commandName} not found.`, colors.yellow);
    } else if (interaction.isAutocomplete() && !command.autocomplete) {
        logMessage(`Autocomplete handler for ${interaction.commandName} not found.`, colors.yellow);
    }
    return command;
}

async function handleInteractionError(interaction, errorMessage) {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
    }
}
