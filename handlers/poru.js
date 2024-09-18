const Discord = require('discord.js');
const { Poru } = require('poru');
const { formatDuration } = require('../functions/functions');

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
    reconnectTries: 10,  // Increase the number of reconnect attempts
    reconnectInterval: 5000, // Wait 5 seconds between retries
};

module.exports = async function (client) {
    client.poru = new Poru(client, Nodes, PoruOptions);

    client.on("ready", () => {
        console.log(`${client.user.tag} is ready!`);
        client.poru.init(client.user.id);
    });

    client.poru.on("nodeConnect", (node) => {
        console.log(`Node ${node.name} is now connected.`);
    });

    client.poru.on("nodeError", (node, error) => {
        console.error(`Node ${node.name} encountered an error: ${error.message}`);
        
        // Notify an admin or specific channel that the node is down
        const errorChannel = client.channels.cache.get('YOUR_CHANNEL_ID'); // Replace with your channel ID
        if (errorChannel) {
            errorChannel.send(`❌ Node ${node.name} encountered an error: \`${error.message}\``);
        }
    });

    client.poru.on("trackStart", (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);

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
                { name: '**Music Name**', value: `\`\`\`${track.info.title}\`\`\``, inline: false },
                { name: '**Duration**', value: `\`\`\`${formatDuration(track.info.length)}\`\`\``, inline: false },
            )
            .setThumbnail(thumbnail)
            .setFooter({
                text: `Requested by ${track.info.requester.username}`,
                iconURL: track.info.requester.displayAvatarURL()
            })
            .setTimestamp();
        
        if (channel) {
            channel.send({ embeds: [trackEmbed] });
        }

        player.filters.setEqualizer(equalizer);
        player.setVolume(35);
    });

    client.poru.on("trackEnd", (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("⏹ Track has ended.");
        }
    });

    client.poru.on("queueEnd", (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("🛑 Queue has ended.");
        }
        player.destroy();
    });

    // Gracefully handle when the Lavalink node is disconnected
    client.poru.on("nodeDisconnect", (node, reason) => {
        console.warn(`Node ${node.name} disconnected: ${reason}`);
    });
};
