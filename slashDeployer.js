const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const colors = require('colors/safe');
const moment = require('moment');
const figlet = require('figlet-promised');
require('dotenv').config({});
const package = require('./package.json');

async function ConfigureBetterLoggingSystem() {
    require('better-logging')(console, {
        format: ctx => `[${moment().format('HH:mm:ss')}] [${moment().format('L')}] ${ctx.type} >> ${ctx.msg}`,
        saveToFile: `${__dirname}/logs/${moment().format('YYYY')}/${moment().format('M')}/${moment().format('D')}.log`,
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
    if (!process.env.DiscordToken) {
        console.error(colors.red('Error: DiscordToken is missing in the environment variables.'));
        process.exit(1);
    }
}

async function StartBot() {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', async () => {
        console.log(colors.green(`Logged in as ${client.user.tag}`));
        await promptUser(client);
        await client.destroy();
        process.exit(0);
    });

    client.login(process.env.DiscordToken);
}

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

const prompts = require('prompts');

async function promptUser(client) {
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

    let commandName;
    let guildId;

    if (action.startsWith('deleteSingle')) {
        const { commandNamePrompt } = await prompts({
            type: 'text',
            name: 'commandNamePrompt',
            message: 'Enter the command name to delete:',
            validate: input => input ? true : 'Command name is required!'
        });
        commandName = commandNamePrompt;
    }

    if (action.endsWith('TestGuild')) {
        const { guildIdPrompt } = await prompts({
            type: 'text',
            name: 'guildIdPrompt',
            message: 'Enter the test guild ID:',
            validate: input => input ? true : 'Guild ID is required!'
        });
        guildId = guildIdPrompt;
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
            const { confirmDeleteGlobal } = await prompts({
                type: 'confirm',
                name: 'confirmDeleteGlobal',
                message: 'Are you sure you want to delete all global commands?',
                initial: false
            });
            if (confirmDeleteGlobal) {
                await deleteAllCommands(client);
            } else {
                console.log(colors.green('Deletion of all global commands canceled.'));
            }
            break;
        case 'deleteAllTestGuild':
            const { confirmDeleteTestGuild } = await prompts({
                type: 'confirm',
                name: 'confirmDeleteTestGuild',
                message: 'Are you sure you want to delete all test guild commands?',
                initial: false
            });
            if (confirmDeleteTestGuild) {
                await deleteAllCommands(client, guildId);
            } else {
                console.log(colors.green('Deletion of all test guild commands canceled.'));
            }
            break;
        default:
            console.log(colors.yellow('Invalid action specified.'));
    }
}

async function loadCommands() {
    const commands = [];
    const slashFolders = fs.readdirSync(__dirname + '/commands/slashs');
    for (const folder of slashFolders) {
        const slashFiles = fs.readdirSync(__dirname + `/commands/slashs/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of slashFiles) {
            const slash = require(__dirname + `/commands/slashs/${folder}/${file}`);
            if ('data' in slash && 'execute' in slash) {
                commands.push(slash.data.toJSON());
            } else {
                console.info(`[WARNING] The command ${slash.data} is missing a required "data" or "execute" property.`);
            }
        }
    }
    return commands;
}

async function registerCommands(client, guildId = null) {
    const commands = await loadCommands();
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        if (guildId) {
            console.log(`Started refreshing ${commands.length} guild-specific (/) commands.`);
            const data = await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
            console.log(`Successfully reloaded ${data.length} guild-specific (/) commands.`);
        } else {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            const data = await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
    } catch (error) {
        console.error(colors.red('An error occurred while registering commands:\n', error.stack));
    }
}

async function deleteSingleCommand(client, commandName, guildId = null) {
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        const commands = guildId
            ? await rest.get(Routes.applicationGuildCommands(client.user.id, guildId))
            : await rest.get(Routes.applicationCommands(client.user.id));

        const command = commands.find(cmd => cmd.name === commandName);
        if (!command) {
            console.log(`No command found with name: ${commandName}`);
            return;
        }

        const route = guildId
            ? Routes.applicationGuildCommand(client.user.id, guildId, command.id)
            : Routes.applicationCommand(client.user.id, command.id);

        await rest.delete(route);
        console.log(`Successfully deleted command: ${commandName}`);
    } catch (error) {
        console.error(colors.red('An error occurred while deleting the command:\n', error.stack));
    }
}

async function deleteAllCommands(client, guildId = null) {
    const rest = new REST({ version: '10' }).setToken(process.env.DiscordToken);

    try {
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: [] });
            console.log('Successfully deleted all guild-specific application commands.');
        } else {
            await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
            console.log('Successfully deleted all application commands.');
        }
    } catch (error) {
        console.error(colors.red('An error occurred while deleting all commands:\n', error.stack));
    }
}
