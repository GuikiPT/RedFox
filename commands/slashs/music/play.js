const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../../../functions/functions.js');

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

    // Make sure the user is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    }

    // Defer the reply to give more time for processing
    await interaction.deferReply();

    try {
      // Create or get the player
      const player = interaction.client.poru.createConnection({
        guildId: guild.id,
        voiceChannel: member.voice.channel.id,
        textChannel: channel.id,
        deaf: true,
      });

      // Resolve the query (search or load)
      const resolve = await interaction.client.poru.resolve({
        query: query,
      });

      const { loadType, tracks, playlistInfo } = resolve;

      if (loadType === 'playlist') {
        for (const track of tracks) {
          track.info.requester = interaction.user;
          player.queue.add(track);
        }

        // Playlist Embed
        const playlistEmbed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`🎶 Playlist Loaded: ${playlistInfo.name}`)
          .setDescription(`Added \`${tracks.length}\` tracks to the queue!`);

        await interaction.editReply({ embeds: [playlistEmbed] });

        // Start playing if not already playing
        if (!player.isPlaying && !player.isPaused) {
          return player.play();
        }

      } else if (loadType === 'search' || loadType === 'track') {
        const track = tracks.shift();
        track.info.requester = interaction.user;

        const thumbnail = track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/mqdefault.jpg`;

        // Add the track to the queue
        player.queue.add(track);

        // Track Embed
        const trackEmbed = new EmbedBuilder()
          .setColor('Green')
          .setTitle(`🎶 Added to Queue`)
          .setThumbnail(thumbnail)
          .addFields(
            { name: '**Author**', value: `\`\`\`${track.info.author}\`\`\``, inline: false },
            { name: '**Music Name**', value: `\`\`\`${track.info.title}\`\`\``, inline: false },
            { name: '**Duration**', value: `\`\`\`${formatDuration(track.info.length)}\`\`\``, inline: false },
          )
          .setDescription(`[${track.info.title}](${track.info.uri})`);

        await interaction.editReply({ embeds: [trackEmbed] });

        // Start playing if not already playing
        if (!player.isPlaying && !player.isPaused) {
          return player.play();
        }

      } else {
        await interaction.editReply('❌ No results found for your query.');
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ | An error occurred while executing this command.' });
    }
  },
};
