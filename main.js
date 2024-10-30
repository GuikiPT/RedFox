const colors = require('colors/safe');
const Discord = require('discord.js');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { logMessage } = require('./functions/logs');
const { error } = require('console');

let client;

async function startBot() {
    async function initializeBot() {
        try {
            await ConfigureBetterLoggingSystem();
            
            try {
                await CheckEnvironmentVariables();
            } catch (error) {
                console.error(colors.red(error.message));
                process.exit(1);
            }


            logMessage('Starting the Bot . . .', colors.yellow);
            await StartBot();
        } catch (error) {
            console.error(colors.red(`Initialization error: ${error.message}`));
            process.exit(1);
        }
    }

    initializeBot().catch(error => {
        console.error(colors.red(`Initialization error: ${error.message}`));
        process.exit(1);
    });

    async function ConfigureBetterLoggingSystem() {
        const logToFile = process.env.LogToFile === 'true';
        const logDir = path.join(__dirname, 'logs', moment().format('YYYY'), moment().format('M'), moment().format('D'));

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        require('better-logging')(console, {
            format: ctx => `[${moment().format('HH:mm:ss')}] [${moment().format('L')}] ${ctx.type} >> ${ctx.msg}`,
            saveToFile: logToFile ? path.join(logDir, 'log.txt') : null,
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
        for (const varName of requiredEnvVars) {
            if (!process.env[varName]) {
                throw new Error(`Initialization error: Environment variable ${varName} is missing.`);
            }
        }
        return true;
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

            process.on('SIGINT', async () => {
                logMessage('Shutting down bot...', colors.yellow);
                await client.destroy();
                process.exit();
            });

            process.on('SIGTERM', async () => {
                logMessage('Received termination signal, shutting down bot...', colors.yellow);
                await client.destroy();
                process.exit();
            });
        } catch (err) {
            console.error(colors.red(err.stack || err));
        }
    }

    let lastMemoryUsage = 0;

    setInterval(() => {
        const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
        if (Math.abs(memoryUsage - lastMemoryUsage) > 5) {
            console.debug(colors.blue(`Memory Usage: RSS: ${memoryUsage.toFixed(2)} MB`));
            lastMemoryUsage = memoryUsage;
        }
    }, 60000);
}

module.exports = { startBot };
