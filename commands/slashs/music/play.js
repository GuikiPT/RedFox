const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../../../functions/functions.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a track or playlist from a supported source')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('The song or playlist to search for')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');
    const { member, guild, channel } = interaction;

    if (!member.voice.channel) {
      return interaction.reply({ content: '❌ | You need to be in a voice channel to use this command!', ephemeral: true });
    }

    const botVoiceChannel = guild.members.me.voice.channel;
    if (botVoiceChannel && botVoiceChannel.id !== member.voice.channel.id) {
      return interaction.reply({ content: '❌ | You need to be in the same voice channel as the bot to use this command!', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const player = interaction.client.poru.createConnection({
        guildId: guild.id,
        voiceChannel: member.voice.channel.id,
        textChannel: channel.id,
        deaf: true,
      });

      const resolve = await interaction.client.poru.resolve({ query });

      const { loadType, tracks, playlistInfo } = resolve;

      if (loadType === 'playlist') {
        for (const track of tracks) {
          track.info.requester = interaction.user;
          player.queue.add(track);
        }

        const playlistEmbed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`🎶 Playlist Loaded: ${playlistInfo.name}`)
          .setDescription(`Added \`${tracks.length}\` tracks to the queue!`);

        await interaction.editReply({ embeds: [playlistEmbed] });

        if (!player.isPlaying && !player.isPaused) {
          player.play();
        }

      } else if (loadType === 'search' || loadType === 'track') {
        const track = tracks.shift();
        track.info.requester = interaction.user;

        const thumbnail = track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/mqdefault.jpg`;

        player.queue.add(track);

        const trackEmbed = new EmbedBuilder()
          .setColor('Green')
          .setAuthor({
            name: '📜 Music added to queue',
          })
          .setTitle(track.info.title)
          .setURL(track.info.uri)
          .setThumbnail(thumbnail)
          .addFields(
            { name: '**Author**', value: `\`\`\`${track.info.author}\`\`\``, inline: false },
            { name: '**Music Name**', value: `\`\`\`${track.info.title}\`\`\``, inline: false },
            { name: '**Duration**', value: `\`\`\`${formatDuration(track.info.length)}\`\`\``, inline: false }
          )
          .setFooter({
              text: `Requested by ${interaction.member.displayName}`,
              iconURL: interaction.member.displayAvatarURL()
          });

        await interaction.editReply({ embeds: [trackEmbed] });

        if (!player.isPlaying && !player.isPaused) {
          const playerGuildVolume = interaction.client.poru.playerVolumes.get(player.guildId);
          if (!playerGuildVolume) {
              await player.setVolume(35);
          } else {
              await player.setVolume(playerGuildVolume);
          }
          player.play();
        }

      } else {
        await interaction.editReply('❌ No results found for your query.');
      }

    } catch (error) {
      console.error('Error while executing play command:', error.stack);

      await interaction.editReply({ content: '❌ | An error occurred while executing this command.' });
    }
  },
};
