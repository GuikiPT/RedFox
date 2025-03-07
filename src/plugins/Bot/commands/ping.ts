import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { PluginCommand } from '../../../types/pluginTypes';
import chalk from 'chalk';

const latencyCommand: PluginCommand<ChatInputCommandInteraction> = {
    name: 'latency',
    description: 'Displays latency information for the bot and Discord API.',
    data: {
        name: 'latency',
        description:
            'Displays latency information for the bot and Discord API.',
        options: [],
    },
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            const startTime = Date.now();
            await interaction.deferReply();

            const botPing = Date.now() - startTime;
            const apiPing = Math.round(interaction.client.ws.ping);

            const embed = new EmbedBuilder()
                .setTitle('Latency Information')
                .setColor(0xffa500)
                .addFields(
                    {
                        name: 'Bot Latency',
                        value: `${botPing}ms`,
                        inline: true,
                    },
                    {
                        name: 'API Latency',
                        value: `${apiPing}ms`,
                        inline: true,
                    },
                )
                .setTimestamp();

            const clientUser = interaction.client.user;
            if (clientUser) {
                try {
                    const fetchedUser = await interaction.client.users.fetch(
                        clientUser.id,
                        { force: true },
                    );
                    const avatarURL = fetchedUser.displayAvatarURL({
                        size: 1024,
                    });
                    embed.setThumbnail(avatarURL);

                    const bannerURL = fetchedUser.bannerURL
                        ? fetchedUser.bannerURL({ size: 1024 })
                        : null;
                    if (bannerURL) {
                        embed.setImage(bannerURL);
                    }
                } catch (fetchError) {
                    console.error(
                        chalk.red('Error fetching client user details:'),
                        fetchError,
                    );
                }
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(
                chalk.red('Error executing latency command:'),
                error instanceof Error ? error.stack : String(error),
            );
            const errorResponse = {
                content: 'There was an error while executing that command!',
                ephemeral: true,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorResponse);
            } else {
                await interaction.reply(errorResponse);
            }
        }
    },
};

export default latencyCommand;
