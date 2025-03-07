import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    ApplicationCommandData,
    ApplicationCommand,
} from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import prompts from 'prompts';
import './common/logger';
import { getFigletText } from './common/figlet';
import pkg from '../package.json';
import { loadPlugins } from './handlers/pluginLoader';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    console.error(
        chalk.red('DISCORD_BOT_TOKEN is not set in the environment.'),
    );
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(token);

process.on('SIGINT', async () => {
    console.log(chalk.yellow('Received SIGINT. Shutting down gracefully...'));
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(
        chalk.red('Unhandled Rejection at:'),
        promise,
        'reason:',
        reason,
    );
    process.exit(1);
});

client.on('error', (error) => {
    console.error(
        chalk.red('Discord client error:'),
        error instanceof Error ? error.stack : String(error),
    );
});

async function deploySlashCommands() {
    try {
        const figletString = await getFigletText('RedFox');
        process.stdout.write(chalk.bold.keyword('orange')(figletString + '\n'));
        process.stdout.write(
            chalk.bold.keyword('orange')(
                `🦊 Version ${pkg.version} | Author: ${pkg.author} 🦊\n\n`,
            ),
        );
        console.log('Starting Slash Command Deployment System...');

        await client.login(token);
        if (!client.user) {
            throw new Error('Client user not available after login.');
        }
        console.log(
            `Logged in as ${chalk.bold.keyword('orange')(client.user.tag)} for Slash Command Deployment.`,
        );

        const actionChoices = [
            { title: 'Register Global Commands', value: 'registerGlobal' },
            {
                title: 'Register Test Guild Commands',
                value: 'registerTestGuild',
            },
            {
                title: 'Delete Single Global Command',
                value: 'deleteSingleGlobal',
            },
            {
                title: 'Delete Single Test Guild Command',
                value: 'deleteSingleTestGuild',
            },
            { title: 'Delete All Global Commands', value: 'deleteAllGlobal' },
            {
                title: 'Delete All Test Guild Commands',
                value: 'deleteAllTestGuild',
            },
        ];

        const { action } = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: actionChoices,
        });

        if (!action) {
            console.log(chalk.yellow('No action selected. Exiting.'));
            return;
        }

        let commandName: string | undefined;
        let guildId: string | undefined;

        if (action.startsWith('deleteSingle')) {
            commandName = await promptInput(
                'Enter the command name to delete:',
            );
        }

        if (action.endsWith('TestGuild')) {
            guildId = await promptInput('Enter the test guild ID:');
        }

        switch (action) {
            case 'registerGlobal':
                await registerCommands(client);
                break;
            case 'registerTestGuild':
                if (!guildId) {
                    console.error(
                        chalk.red(
                            'Guild ID is required for test guild commands.',
                        ),
                    );
                    return;
                }
                await registerCommands(client, guildId);
                break;
            case 'deleteSingleGlobal':
                if (!commandName) {
                    console.error(
                        chalk.red('Command name is required for deletion.'),
                    );
                    return;
                }
                await deleteSingleCommand(client, commandName);
                break;
            case 'deleteSingleTestGuild':
                if (!commandName || !guildId) {
                    console.error(
                        chalk.red(
                            'Both command name and guild ID are required for deletion.',
                        ),
                    );
                    return;
                }
                await deleteSingleCommand(client, commandName, guildId);
                break;
            case 'deleteAllGlobal':
                await confirmAndDeleteAll(client, 'global');
                break;
            case 'deleteAllTestGuild':
                if (!guildId) {
                    console.error(
                        chalk.red(
                            'Guild ID is required to delete test guild commands.',
                        ),
                    );
                    return;
                }
                await confirmAndDeleteAll(client, 'test guild', guildId);
                break;
            default:
                console.log(chalk.yellow('Invalid action specified.'));
        }
    } catch (error) {
        logError(
            'Error during Slash Command Deployment:',
            error instanceof Error ? error.stack : String(error),
        );
    } finally {
        console.log(
            chalk.yellow(
                'Shutting down Slash Command Deployment System gracefully...',
            ),
        );
        await client.destroy();
        process.exit(0);
    }
}

async function registerCommands(
    client: Client,
    guildId?: string,
): Promise<void> {
    try {
        const plugins = await loadPlugins(client);
        const commands: ApplicationCommandData[] = [];

        for (const plugin of plugins) {
            for (const cmd of plugin.commands) {
                if (cmd.data) {
                    commands.push(cmd.data);
                } else if (cmd.name && cmd.description) {
                    commands.push({
                        name: cmd.name,
                        description: cmd.description,
                    } as ApplicationCommandData);
                } else {
                    console.warn(
                        chalk.yellow(
                            `Command in plugin "${plugin.name}" is missing required data.`,
                        ),
                    );
                }
            }
        }

        if (guildId) {
            console.log(
                chalk.green(
                    `Registering ${commands.length} commands to guild ${guildId}...`,
                ),
            );
            const registeredCommands = (await rest.put(
                Routes.applicationGuildCommands(client.user!.id, guildId),
                { body: commands },
            )) as ApplicationCommandData[];
            console.log(
                chalk.green(
                    `${registeredCommands.length} commands registered successfully to guild ${guildId}.`,
                ),
            );
        } else {
            console.log(
                chalk.green(
                    `Registering ${commands.length} global commands...`,
                ),
            );
            const registeredCommands = (await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: commands },
            )) as ApplicationCommandData[];
            console.log(
                chalk.green(
                    `${registeredCommands.length} global commands registered successfully.`,
                ),
            );
        }
    } catch (err) {
        logError('Error registering commands:', err);
    }
}

async function deleteSingleCommand(
    client: Client,
    commandName: string,
    guildId?: string,
): Promise<void> {
    try {
        if (guildId) {
            console.log(
                chalk.green(
                    `Deleting command "${commandName}" from guild ${guildId}...`,
                ),
            );
            const commands = (await rest.get(
                Routes.applicationGuildCommands(client.user!.id, guildId),
            )) as ApplicationCommand[];
            const command = commands.find((cmd) => cmd.name === commandName);
            if (command) {
                await rest.delete(
                    Routes.applicationGuildCommand(
                        client.user!.id,
                        guildId,
                        command.id,
                    ),
                );
                console.log(chalk.green('Command deleted successfully.'));
            } else {
                console.warn(
                    chalk.yellow(
                        `Command "${commandName}" not found in guild ${guildId}.`,
                    ),
                );
            }
        } else {
            console.log(
                chalk.green(`Deleting global command "${commandName}"...`),
            );
            const commands = (await rest.get(
                Routes.applicationCommands(client.user!.id),
            )) as ApplicationCommand[];
            const command = commands.find((cmd) => cmd.name === commandName);
            if (command) {
                await rest.delete(
                    Routes.applicationCommand(client.user!.id, command.id),
                );
                console.log(chalk.green('Command deleted successfully.'));
            } else {
                console.warn(
                    chalk.yellow(`Global command "${commandName}" not found.`),
                );
            }
        }
    } catch (err) {
        logError(`Error deleting command "${commandName}":`, err);
    }
}

async function deleteAllCommands(
    client: Client,
    guildId?: string,
): Promise<void> {
    try {
        if (guildId) {
            console.log(
                chalk.green(`Deleting all commands from guild ${guildId}...`),
            );
            await rest.put(
                Routes.applicationGuildCommands(client.user!.id, guildId),
                { body: [] },
            );
        } else {
            console.log(chalk.green('Deleting all global commands...'));
            await rest.put(Routes.applicationCommands(client.user!.id), {
                body: [],
            });
        }
        console.log(chalk.green('All commands deleted successfully.'));
    } catch (err) {
        logError('Error deleting all commands:', err);
    }
}

async function promptInput(message: string): Promise<string> {
    const response = await prompts({
        type: 'text',
        name: 'input',
        message,
        validate: (input: string) => (input ? true : 'Input is required!'),
    });
    return response.input;
}

async function confirmAndDeleteAll(
    client: Client,
    type: string,
    guildId?: string,
): Promise<void> {
    const { confirmDelete } = await prompts({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete all ${type} commands?`,
        initial: false,
    });
    if (confirmDelete) {
        await deleteAllCommands(client, guildId);
    } else {
        console.log(chalk.green(`Deletion of all ${type} commands canceled.`));
    }
}

function logError(message: string, error: unknown): void {
    console.error(chalk.red(message));
    if (error instanceof Error) {
        console.error(chalk.red(error.message));
    } else {
        console.error(chalk.red(String(error)));
    }
}

deploySlashCommands();
