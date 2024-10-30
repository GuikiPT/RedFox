const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const colors = require('colors/safe');
require('dotenv').config();
const { logMessage } = require('./functions/logs');
require('better-logging')(console);
const prompts = require('prompts');

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

async function deploySlashCommands() {
    await ConfigureBetterLoggingSystem();
    console.log(colors.green('Starting Slash Command Deployment System...'));

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    try {
        await client.login(process.env.DiscordToken);
        console.log(colors.green(`Logged in as ${client.user.tag} for Slash Command Deployment.`));

        const actionChoices = [
            { title: 'Register Global Commands', value: 'registerGlobal' },
            { title: 'Register Test Guild Commands', value: 'registerTestGuild' },
            { title: 'Delete Single Global Command', value: 'deleteSingleGlobal' },
            { title: 'Delete Single Test Guild Command', value: 'deleteSingleTestGuild' },
            { title: 'Delete All Global Commands', value: 'deleteAllGlobal' },
            { title: 'Delete All Test Guild Commands', value: 'deleteAllTestGuild' }
        ];

        const { action } = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: actionChoices
        });

        let commandName, guildId;

        if (action.startsWith('deleteSingle')) {
            commandName = await promptInput('Enter the command name to delete:', 'Command name is required!');
        }

        if (action.endsWith('TestGuild')) {
            guildId = await promptInput('Enter the test guild ID:', 'Guild ID is required!');
        }

        switch (action) {
            case 'registerGlobal':
                await registerCommands(client);
                break;
            case 'registerTestGuild':
                await registerCommands(client, guildId);
                break;
            case 'deleteSingleGlobal':
                await deleteSingleCommand(client, commandName);
                break;
            case 'deleteSingleTestGuild':
                await deleteSingleCommand(client, commandName, guildId);
                break;
            case 'deleteAllGlobal':
                await confirmAndDeleteAll(client, 'global');
                break;
            case 'deleteAllTestGuild':
                await confirmAndDeleteAll(client, 'test guild', guildId);
                break;
            default:
                logMessage('Invalid action specified.', colors.yellow);
        }
    } catch (error) {
        console.error(colors.red(`Error during Slash Command Deployment: ${error.message}`));
    } finally {
        console.log(colors.yellow('Shutting down Slash Command Deployment System gracefully...'));
        await client.destroy();
    }
}

async function promptInput(message, validationMessage) {
    const { input } = await prompts({
        type: 'text',
        name: 'input',
        message,
        validate: input => input ? true : validationMessage
    });
    return input;
}

async function confirmAndDeleteAll(client, type, guildId = null) {
    const { confirmDelete } = await prompts({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete all ${type} commands?`,
        initial: false
    });
    if (confirmDelete) {
        await deleteAllCommands(client, guildId);
    } else {
        logMessage(`Deletion of all ${type} commands canceled.`, colors.green);
    }
}

async function loadCommands() {
    const commands = [];
    const slashFolders = fs.readdirSync(__dirname + '/commands/slashs');
    for (const folder of slashFolders) {
        const slashFiles = fs.readdirSync(`${__dirname}/commands/slashs/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of slashFiles) {
            const slash = require(`${__dirname}/commands/slashs/${folder}/${file}`);
            if ('data' in slash && 'execute' in slash) {
                commands.push(slash.data.toJSON());
            } else {
                logMessage(`[WARNING] The command ${file} is missing "data" or "execute" property.`, colors.yellow);
            }
        }
    }
    return commands;
}

async function registerCommands(client, guildId = null) {
    const commands = await loadCommands();
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user.id, guildId)
            : Routes.applicationCommands(client.user.id);

        const data = await rest.put(route, { body: commands });
        logMessage(`Successfully reloaded ${data.length} ${guildId ? 'guild-specific' : 'application'} (/) commands.`, colors.green);
    } catch (error) {
        logMessage('Error registering commands:', colors.red);
        logMessage(error.stack || error.message, colors.red);
    }
}

async function deleteSingleCommand(client, commandName, guildId = null) {
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user.id, guildId)
            : Routes.applicationCommands(client.user.id);

        const commands = await rest.get(route);
        const command = commands.find(cmd => cmd.name === commandName);
        if (!command) {
            logMessage(`No command found with name: ${commandName}`, colors.yellow);
            return;
        }

        const deleteRoute = guildId
            ? Routes.applicationGuildCommand(client.user.id, guildId, command.id)
            : Routes.applicationCommand(client.user.id, command.id);

        await rest.delete(deleteRoute);
        logMessage(`Successfully deleted command: ${commandName}`, colors.green);
    } catch (error) {
        logMessage('Error deleting command:', colors.red);
        logMessage(error.stack || error.message, colors.red);
    }
}

async function deleteAllCommands(client, guildId = null) {
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user.id, guildId)
            : Routes.applicationCommands(client.user.id);

        await rest.put(route, { body: [] });
        logMessage(`Successfully deleted all ${guildId ? 'guild-specific' : 'application'} commands.`, colors.green);
    } catch (error) {
        logMessage('Error deleting all commands:', colors.red);
        logMessage(error.stack || error.message, colors.red);
    }
}

module.exports = { deploySlashCommands };
