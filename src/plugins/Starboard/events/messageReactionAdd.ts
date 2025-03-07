import {
    Events,
    MessageReaction,
    User,
    TextChannel,
    EmbedBuilder,
} from 'discord.js';
import StarboardModel from '../../../database/models/Starboard';
import StarboardMessage from '../../../database/models/StarboardMessage';
import { PluginEvent } from '../../../types/pluginTypes';

const messageReactionAdd: PluginEvent<[MessageReaction, User]> = {
    name: Events.MessageReactionAdd,
    once: false,
    execute: async (reaction: MessageReaction, user: User) => {

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        if (user.bot) return;

        const guild = reaction.message.guild;
        if (!guild) return;

        const starboard = await StarboardModel.findOne({
            where: { serverId: guild.id },
        });

        if (!starboard) return;

        const isCustomEmoji = starboard.emoji.startsWith('<');
        const isMatch = isCustomEmoji
            ? reaction.emoji.toString() === starboard.emoji
            : reaction.emoji.name === starboard.emoji;

        if (!isMatch) return;

        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Error fetching message:', error);
                return;
            }
        }

        const message = reaction.message;

        const existingStarboardMessage = await StarboardMessage.findOne({
            where: {
                guildId: guild.id,
                originalMessageId: message.id,
            },
        });

        if (existingStarboardMessage) return;

        const starReaction = message.reactions.cache.find((r) =>
            isCustomEmoji
                ? r.emoji.toString() === starboard.emoji
                : r.emoji.name === starboard.emoji,
        );

        const reactionCount = starReaction?.count || 0;

        if (reactionCount >= starboard.reactionsToStar) {
            try {
                const starboardChannel = (await guild.channels.fetch(
                    starboard.channelId,
                )) as TextChannel;
                if (!starboardChannel) return;

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: message.author?.username ?? 'Unknown User',
                        iconURL: message.author?.displayAvatarURL() ?? '',
                    })
                    .setColor(0xffac33)
                    .setTimestamp(message.createdAt)
                    .setFooter({ text: `ID: ${message.id}` });

                if (message.content) {
                    embed.setDescription(message.content);
                }

                const image = message.attachments.find((att) =>
                    att.contentType?.startsWith('image/'),
                );
                if (image) {
                    embed.setImage(image.url);
                }

                embed.addFields({
                    name: 'Original',
                    value: `[Jump to message](${message.url})`,
                    inline: false,
                });

                const starboardMessage = await starboardChannel.send({
                    content: `${starboard.emoji} **${reactionCount}** | <#${message.channelId}>`,
                    embeds: [embed],
                });

                await StarboardMessage.create({
                    guildId: guild.id,
                    originalMessageId: message.id,
                    starboardMessageId: starboardMessage.id,
                });
            } catch (error) {
                console.error('Error posting to starboard:', error);
            }
        }
    },
};

export default messageReactionAdd;
