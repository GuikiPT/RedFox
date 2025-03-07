import { ChatInputCommandInteraction } from 'discord.js';
import { PluginEvent } from '../../../types/pluginTypes';
import { getCommand } from '../../../common/commandRegistry';
import chalk from 'chalk';

const interactionCreate: PluginEvent<[ChatInputCommandInteraction]> = {
    name: 'interactionCreate',
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = getCommand(interaction.commandName);
        if (!command) {
            console.warn(
                chalk.yellow(`No command found for ${interaction.commandName}`),
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error(
                chalk.red(
                    `Error executing command ${interaction.commandName}: ${errorMessage}`,
                ),
            );

            const response = {
                content: 'There was an error while executing that command!',
                ephemeral: true,
            };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(response);
                } else {
                    await interaction.reply(response);
                }
            } catch (replyError) {
                console.error(
                    chalk.red(
                        `Failed to send error response for ${interaction.commandName}: ${replyError}`,
                    ),
                );
            }
        }
    },
};

export default interactionCreate;
