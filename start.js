const figlet = require('figlet-promised');
const colors = require('colors/safe');
require('dotenv').config();
const Discord = require('discord.js');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const package = require('./package.json');

let client;

figlet('RedFox').then(async function (figletResult) {
    try {
        await console.log(colors.bold(colors.red(figletResult)));

        const plainVersionString = `Version: ${package.version} | By: ${package.author}`;
        const figletLines = figletResult.split("\n");
        const maxFigletWidth = Math.max(...figletLines.map(line => line.length));

        const padding = Math.floor((maxFigletWidth - plainVersionString.length) / 2);
        
        const styledVersionString = ' '.repeat(padding) + `${colors.bold('Version:')} ${package.version} | ${colors.bold('By:')} ${package.author}`;

        await console.log(colors.red(`${styledVersionString}\n`));

        await ConfigureBetterLoggingSystem();
        await CheckEnvironmentVariables();

        console.log(colors.yellow('Starting the Bot . . .'));

        await StartBot();
    } catch (error) {
        console.error(colors.red(`Error: ${error.message}`));
        process.exit(1);
    }
}).catch(error => {
    console.error(colors.red(`Figlet error: ${error.message}`));
    process.exit(1);
});

async function ConfigureBetterLoggingSystem() {
    const logToFile = process.env.LogToFile === 'true';
    require('better-logging')(console, {
        format: ctx => `[${moment().format('HH:mm:ss')}] [${moment().format('L')}] ${ctx.type} >> ${ctx.msg}`,
        saveToFile: logToFile ? `${__dirname}/logs/${moment().format('YYYY')}/${moment().format('M')}/${moment().format('D')}.log` : null,
        color: {
            base: colors.grey,
            type: {
                debug: colors.green,
                info: colors.white,
                log: colors.grey,
                error: colors.red,
                warn: colors.yellow,
            },
        },
    });
}

async function CheckEnvironmentVariables() {
    const requiredEnvVars = ['DiscordToken'];
    requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
            console.error(colors.red(`Environment variable ${varName} is missing.`));
            process.exit(0);
        }
    });
}

async function StartBot() {
    client = new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.AutoModerationConfiguration,
            Discord.GatewayIntentBits.AutoModerationExecution,
            Discord.GatewayIntentBits.DirectMessageReactions,
            Discord.GatewayIntentBits.DirectMessages,
            Discord.GatewayIntentBits.GuildEmojisAndStickers,
            Discord.GatewayIntentBits.GuildIntegrations,
            Discord.GatewayIntentBits.GuildInvites,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildMessageReactions,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.GuildModeration,
            Discord.GatewayIntentBits.GuildPresences,
            Discord.GatewayIntentBits.GuildScheduledEvents,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildWebhooks,
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.MessageContent,
        ],
        partials: [
            Discord.Partials.Channel,
            Discord.Partials.GuildMember,
            Discord.Partials.GuildScheduledEvent,
            Discord.Partials.Message,
            Discord.Partials.Reaction,
            Discord.Partials.ThreadMember,
            Discord.Partials.User,
        ],
    });

    client.slashsCmds = new Discord.Collection();

    try {
        const handlerFiles = fs.readdirSync(path.join(__dirname, 'handlers')).filter(file => file.endsWith('.js'));
        for (const file of handlerFiles) {
            const handler = require(`./handlers/${file}`);
            await handler(client);
        }

        await client.login(process.env.DiscordToken);
    } catch (err) {
        console.error(colors.red(err.stack || err));
    }
}

process.on('SIGINT', async () => {
    console.log(colors.yellow('Shutting down bot...'));
    await client.destroy();
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log(colors.yellow('Received termination signal, shutting down bot...'));
    await client.destroy();
    process.exit();
});

setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.debug(colors.blue(`Memory Usage: RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`));
}, 60000);
