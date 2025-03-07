import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { PluginSubCommand } from '../../../types/pluginTypes';
import StarboardModel from '../../../database/models/Starboard';

const removeSubcommand: PluginSubCommand = {
    name: 'remove',
    description: 'Remove the starboard configuration for this server',
    options: [],
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.memberPermissions?.has('ManageChannels')) {
            await interaction.reply({
                content:
                    'You need "Manage Channels" permission to remove the starboard.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            const starboard = await StarboardModel.findOne({
                where: { serverId: interaction.guildId! },
            });

            if (!starboard) {
                await interaction.reply({
                    content:
                        'No starboard configuration found for this server.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await starboard.destroy();

            await interaction.reply({
                content: 'Starboard configuration has been removed.',
                flags: MessageFlags.Ephemeral,
            });
        } catch (error: unknown) {
            console.error(
                'Error removing starboard:',
                error instanceof Error ? error.stack : String(error),
            );
            await interaction.reply({
                content:
                    'An error occurred while removing the starboard configuration.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};

export default removeSubcommand;
