const Discord = require('discord.js');
const { Poru } = require('poru');
const { formatDuration } = require('../functions/functions');
const colors = require('colors/safe');
const axios = require('axios');

async function updateVoiceStatus(channelId, botToken, status) {
    try {
        const url = `https://discord.com/api/v10/channels/${channelId}/voice-status`;
        
        const response = await axios({
            method: 'put',
            url: url,
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                status: status
            }
        });
    } catch (error) {
        console.error(`Error updating voice status: ${error.response ? error.response.status : error.message}`);
    }
}

const Nodes = [
    {
        name: process.env.LavalinkName,
        host: process.env.LavalinkHost,
        port: process.env.LavalinkPort,
        password: process.env.LavalinkPassword
    }
];

const equalizer = [
    { band: 0, gain: 0.10 },
    { band: 1, gain: 0.08 },
    { band: 2, gain: 0.06 },
    { band: 3, gain: 0.04 },
    { band: 4, gain: 0.02 },
    { band: 5, gain: 0.0 },
    { band: 6, gain: -0.02 },
    { band: 7, gain: -0.04 },
    { band: 8, gain: -0.06 },
    { band: 9, gain: -0.08 }
];

const PoruOptions = {
    library: "discord.js",
    defaultPlatform: "youtube",
    reconnectTries: 10,
    reconnectInterval: 5000,
};

const playerVolumes = new Map();

module.exports = async function (client) {
    client.poru = new Poru(client, Nodes, PoruOptions);

    client.on("ready", () => {
        client.poru.init(client.user.id);
    });

    client.poru.on("nodeConnect", (node) => {
        const consoleTextNodeConnect = colors.blue('Node ') + colors.red(`"${node.name}" `) + colors.blue('is now connected.')
        console.log(consoleTextNodeConnect);
    });

    client.poru.on("nodeError", (node, error) => {
        console.error(`Node ${node.name} encountered an error: ${error.message}`);
    });

    const setPlayerVolume = async (client, player) => {
        const playerGuildVolume = client.poru.playerVolumes.get(player.guildId);

        if (!playerGuildVolume) {
            await player.setVolume(35);
        } else {
            await player.setVolume(playerGuildVolume);
        }
    };

    client.poru.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);

        await updateVoiceStatus(player.voiceChannel, process.env.DiscordToken, `<a:redfox_music:1286282725124472842> Playing: ${track.info.author} - ${track.info.title}`);

        await setPlayerVolume(client, player);
        player.filters.setEqualizer(equalizer);

        const thumbnail = track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/mqdefault.jpg`;

        const trackEmbed = new Discord.EmbedBuilder()
            .setColor('Blue')
            .setTitle(track.info.title)
            .setURL(track.info.uri)
            .setAuthor({
                iconURL: 'https://i.gifer.com/5RT9.gif',
                name: `Now Playing . . .`,
            })
            .addFields(
                { name: '**Author**', value: `\`\`\`${track.info.author}\`\`\``, inline: false },
                { name: '**Music Name**', value: `\`\`\`${track.info.author + " - " + track.info.title}\`\`\``, inline: false },
                { name: '**Duration**', value: `\`\`\`${formatDuration(track.info.length)}\`\`\``, inline: false },
                { name: '**Volume**', value: `\`\`\`${player.volume}%\`\`\``, inline: false },
            )
            .setThumbnail(thumbnail)
            .setFooter({
                text: `Requested by ${track.info.requester.username}`,
                iconURL: track.info.requester.displayAvatarURL()
            })
            .setTimestamp();

        let message = await channel.send({ embeds: [trackEmbed] });

        let resolvedYoutubeLink = '';
        const sourceName = track.info.sourceName;

        if (sourceName === 'spotify') {
            const query = `${track.info.author} ${track.info.title}`;
            try {
                const resolve = await client.poru.resolve({ query });
                const { tracks } = resolve;

                if (tracks.length > 0) {
                    resolvedYoutubeLink = tracks[0].info.uri;
                }
            } catch (error) {
                console.error('Error resolving Spotify to YouTube:', error);
            }
        } else if (sourceName === 'youtube') {
            resolvedYoutubeLink = track.info.uri;
        }

        const actionRow = new Discord.ActionRowBuilder();

        if (resolvedYoutubeLink) {
            actionRow.addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Open on YouTube')
                    .setStyle(Discord.ButtonStyle.Link)
                    .setURL(resolvedYoutubeLink)
            );
        }

        if (sourceName === 'spotify') {
            actionRow.addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Open on Spotify')
                    .setStyle(Discord.ButtonStyle.Link)
                    .setURL(track.info.uri)
            );
        }

        if (actionRow.components.length > 0) {
            await message.edit({ components: [actionRow] });
        }
    });

    client.poru.on("queueEnd", async (player) => {
        const channel = client.channels.cache.get(player.textChannel);

        await updateVoiceStatus(player.voiceChannel, process.env.DiscordToken, null);

        if (channel) {
            channel.send("🛑 Queue has ended.");
        }
        player.destroy();
    });

    client.poru.on("nodeDisconnect", (node, reason) => {
        console.warn(`Node ${node.name} disconnected: ${reason}`);
    });

    client.poru.playerVolumes = playerVolumes;
};
