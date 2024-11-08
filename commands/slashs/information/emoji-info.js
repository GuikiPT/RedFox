const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji-info')
        .setDescription('See detailed information about an emoji.')
        .addStringOption(option => 
            option.setName('emoji')
                .setDescription('The emoji you want to get information about')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('private')
                .setDescription('Whether the response should be private (ephemeral)')),
    
    async execute(interaction) {
        const emojiStr = interaction.options.getString('emoji');
        const isPrivate = interaction.options.getBoolean('private') || false;

        const emojiRegex = /<a?:.+:(\d+)>/;
        const match = emojiStr.match(emojiRegex);
        if (!match) {
            return interaction.reply({ content: '❌ Invalid emoji format! Please use a custom emoji from Discord.', ephemeral: true });
        }

        const emojiId = match[1];
        const emoji = interaction.guild.emojis.cache.get(emojiId);

        if (emoji) {
            try {
                const embed = await generateEmojiInfoEmbed(emoji);
                return interaction.reply({ embeds: [embed], ephemeral: isPrivate });
            } catch (error) {
                return handleError(interaction, 'fetching emoji information', error, isPrivate);
            }
        } else {
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${emojiStr.startsWith('<a:') ? 'gif' : 'png'}?v=1`;
            const emojiName = emojiStr.match(/:([^:]+):/)[1];
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('External Emoji Information')
                .setDescription(`This emoji is not part of this server. Click the button below to add it.`)
                .setThumbnail(emojiUrl)
                .addFields({ name: 'Emoji Link', value: `[Click here](${emojiUrl})`, inline: false });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('add_emoji')
                    .setLabel('Add Emoji to Server')
                    .setStyle(ButtonStyle.Primary)
            );

            const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: isPrivate, fetchReply: true });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
            collector.on('collect', async i => handleButtonClick(i, interaction, emojiUrl, emojiName, isPrivate, collector));
            collector.on('end', async () => disableButton(interaction));
        }
    }
};

async function handleButtonClick(i, interaction, emojiUrl, emojiName, isPrivate, collector) {
    if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "You can't interact with this button.", ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.CreateGuildExpressions)) {
        return await i.reply({ content: '❌ You don’t have permission to manage emojis.', ephemeral: true });
    }

    await i.deferUpdate();

    let responseContent;
    try {
        const newEmoji = await interaction.guild.emojis.create({ attachment: emojiUrl, name: emojiName });
        responseContent = `✅ Successfully added the emoji [${newEmoji}](${newEmoji.imageURL()}) to the server!`;
    } catch (error) {
        responseContent = error.code === 30008 
            ? '❌ This server has reached the maximum number of emojis. Please delete an existing emoji and try again.'
            : '❌ Failed to add the emoji due to an unknown error. Please try again later.';
    
        if (error.code !== 30008) {
            console.error(`Error adding emoji: ${error.stack}`);
        }
    }

    await interaction.followUp({ content: responseContent, ephemeral: true });

    collector.stop();
}

async function disableButton(interaction) {
    const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('add_emoji')
            .setLabel('Add Emoji to Server')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
    );
    await interaction.editReply({ components: [disabledRow] }).catch(error => {
        if (error.code !== 10008) {
            console.error(`Error disabling button: ${error.stack}`);
        }
    });
}

async function generateEmojiInfoEmbed(emoji) {
    const author = await emoji.fetchAuthor();
    const checkOrCross = (bool) => bool ? "✅" : "❌";

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Emoji Information - ${emoji.name}`)
        .setThumbnail(emoji.imageURL())
        .addFields(
            { name: 'Emoji ID', value: `\`${emoji.id}\``, inline: true },
            { name: 'Created By', value: `${author.tag} (\`${author.id}\`)`, inline: true },
            { name: 'Creation Date', value: `${moment(emoji.createdTimestamp).format("DD/MM/YYYY | HH:mm:ss")}`, inline: true },
            { name: 'Animated', value: `${checkOrCross(emoji.animated)}`, inline: true },
            { name: 'Requires Colons', value: `${checkOrCross(emoji.requireColons)}`, inline: true },
            { name: 'Managed by Discord', value: `${checkOrCross(emoji.managed)}`, inline: true },
            { name: 'Deletable', value: `${checkOrCross(emoji.deletable)}`, inline: true },
            { name: 'Emoji Link', value: `[Click here](${emoji.imageURL()})`, inline: false }
        );
}

function handleError(interaction, action, error, isPrivate) {
    console.error(`Error ${action}: ${error.stack}`);

    const errorMessage = `❌ An error occurred while ${action}. Please try again later.`;
    
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content: errorMessage, ephemeral: isPrivate });
    } else {
        return interaction.reply({ content: errorMessage, ephemeral: isPrivate });
    }
}
