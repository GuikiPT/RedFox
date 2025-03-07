import {
    ChatInputCommandInteraction,
    ChannelType,
    TextChannel,
    MessageFlags,
    ApplicationCommandOptionType,
    EmbedBuilder,
} from 'discord.js';
import { PluginSubCommand } from '../../../types/pluginTypes';
import StarboardModel from '../../../database/models/Starboard';

const setSubcommand: PluginSubCommand = {
    name: 'set',
    description: 'Set the starboard channel',
    options: [
        {
            name: 'channel',
            description: 'The channel to use for starboard messages',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: 'emoji',
            description:
                'The emoji to use for starring messages (standard emoji or custom server emoji)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reactions',
            description: 'The number of reactions needed to star a message',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 1000,
        },
    ],
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.memberPermissions?.has('ManageChannels')) {
            await interaction.reply({
                content:
                    'You need "Manage Channels" permission to set up the starboard.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const channel = interaction.options.getChannel('channel', true);

        if (channel.type !== ChannelType.GuildText) {
            await interaction.reply({
                content: 'Starboard channel must be a text channel.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const textChannel = channel as TextChannel;

        const botMember = await interaction.guild?.members.fetchMe();
        const botPermissions = textChannel.permissionsFor(botMember!);

        if (
            !botPermissions?.has([
                'SendMessages',
                'EmbedLinks',
                'ReadMessageHistory',
            ])
        ) {
            await interaction.reply({
                content:
                    'I need permissions to send messages, embed links, and read message history in that channel.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const emoji = interaction.options.getString('emoji', true);
        const reactionsToStar = interaction.options.getInteger(
            'reactions',
            true,
        );

        const customEmojiRegex = /<a?:(\w+):(\d+)>/;
        const customEmojiMatch = emoji.match(customEmojiRegex);

        const unicodeEmojiRegex =
            /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
        const isUnicodeEmoji = unicodeEmojiRegex.test(emoji);

        if (customEmojiMatch) {
            const emojiId = customEmojiMatch[2];
            const serverEmoji = interaction.guild?.emojis.cache.get(emojiId);

            if (!serverEmoji) {
                await interaction.reply({
                    content:
                        "The custom emoji you provided does not exist in this server or I don't have access to it.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        } else if (!isUnicodeEmoji) {
            await interaction.reply({
                content:
                    'Please provide a valid emoji. You can use a standard emoji (like ⭐) or a custom server emoji (<:name:id>).',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            const [starboard, created] = await StarboardModel.findOrCreate({
                where: { serverId: interaction.guildId! },
                defaults: {
                    channelId: channel.id,
                    emoji,
                    serverId: interaction.guildId!,
                    reactionsToStar,
                },
            });

            if (!created) {
                starboard.channelId = channel.id;
                starboard.emoji = emoji;
                starboard.reactionsToStar = reactionsToStar;
                await starboard.save();
            }

            const successEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Starboard Setup Success')
                .setDescription(`Starboard channel has been set to ${channel}.`)
                .addFields(
                    { name: 'Channel', value: `${channel}`, inline: true },
                    {
                        name: 'Required Reactions',
                        value: `${reactionsToStar}`,
                        inline: true,
                    },
                    {
                        name: 'Reaction Emoji',
                        value: `${emoji}`,
                        inline: true,
                    },
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [successEmbed],
                flags: MessageFlags.Ephemeral,
            });
        } catch (error: unknown) {
            console.error(
                'Error setting starboard:',
                error instanceof Error ? error.stack : error,
            );
            await interaction.reply({
                content: 'An error occurred while setting up the starboard.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};

export default setSubcommand;
