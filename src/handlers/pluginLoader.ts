import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'discord.js';
import { Plugin, PluginLoadLog } from '../types/pluginTypes';
import Table from 'cli-table3';
import chalk from 'chalk';
import { registerCommand } from '../common/commandRegistry';

async function loadPluginCommands(
    pluginFolderPath: string,
    commandsFolderName: string,
    loadOptions: {
        skipCommands?: string[];
        skipEvents?: string[];
        commandsFolder?: string;
        eventsFolder?: string;
        subcommandsFolder?: string;
    },
    plugin: Plugin,
): Promise<{ commands: string[]; subcommands: Record<string, string[]> }> {
    const loadedCommands: string[] = [];
    const loadedSubcommands: Record<string, string[]> = {};
    const commandsFolder = path.join(pluginFolderPath, commandsFolderName);

    try {
        await fs.access(commandsFolder);
    } catch {
        return { commands: loadedCommands, subcommands: loadedSubcommands };
    }

    const commandFiles = (await fs.readdir(commandsFolder)).filter((file) =>
        ['.ts', '.js'].includes(path.extname(file)),
    );

    for (const file of commandFiles) {
        try {
            const commandPath = path.join(commandsFolder, file);
            const commandModule = await import(commandPath);
            const command = commandModule.default || commandModule;

            if (
                loadOptions.skipCommands &&
                loadOptions.skipCommands.includes(command.name)
            ) {
                continue;
            }

            if (!plugin.commands) {
                plugin.commands = [];
            }

            plugin.commands.push(command);
            registerCommand(command);
            loadedCommands.push(command.name);

            if (command.subcommands) {
                console.log(
                    `Found subcommands in command object for ${command.name}:`,
                    Object.keys(command.subcommands),
                );
                loadedSubcommands[command.name] = Object.keys(
                    command.subcommands,
                );
            } else {
                const subcommandsFolder = loadOptions.subcommandsFolder;

                if (!subcommandsFolder) {
                    continue;
                }

                const subcommandsPath = path.join(
                    pluginFolderPath,
                    subcommandsFolder,
                );
                try {
                    await fs.access(subcommandsPath);
                    const subcommandFiles = (
                        await fs.readdir(subcommandsPath)
                    ).filter((file) =>
                        ['.ts', '.js'].includes(path.extname(file)),
                    );
                    if (subcommandFiles.length > 0) {
                        loadedSubcommands[command.name] = subcommandFiles.map(
                            (file) => path.basename(file, path.extname(file)),
                        );
                    }
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : String(err);
                    console.log(
                        `No subcommands folder for ${command.name}: ${errorMessage}`,
                    );
                }
            }
        } catch (err) {
            console.error(
                chalk.red(
                    `Error loading command file "${file}" in plugin "${plugin.name}": ${err}`,
                ),
            );
        }
    }
    return { commands: loadedCommands, subcommands: loadedSubcommands };
}

async function loadPluginEvents(
    pluginFolderPath: string,
    eventsFolderName: string,
    loadOptions: {
        skipCommands?: string[];
        skipEvents?: string[];
        commandsFolder?: string;
        eventsFolder?: string;
    },
    plugin: Plugin,
): Promise<Array<{ name: string; once: boolean }>> {
    const loadedEvents: Array<{ name: string; once: boolean }> = [];
    const eventsFolder = path.join(pluginFolderPath, eventsFolderName);

    try {
        await fs.access(eventsFolder);
    } catch {
        return loadedEvents;
    }

    const eventFiles = (await fs.readdir(eventsFolder)).filter((file) =>
        ['.ts', '.js'].includes(path.extname(file)),
    );

    for (const file of eventFiles) {
        try {
            const eventPath = path.join(eventsFolder, file);
            const eventModule = await import(eventPath);
            const event = eventModule.default || eventModule;
            if (
                loadOptions.skipEvents &&
                loadOptions.skipEvents.includes(event.name)
            ) {
                continue;
            }
            if (!plugin.events) {
                plugin.events = [];
            }
            plugin.events.push(event);
            loadedEvents.push({ name: event.name, once: Boolean(event.once) });
        } catch (err) {
            console.error(
                chalk.red(
                    `Error loading event file "${file}" in plugin "${plugin.name}": ${err}`,
                ),
            );
        }
    }
    return loadedEvents;
}

export async function loadPlugins(client: Client): Promise<Plugin[]> {
    const pluginsDir = path.join(__dirname, '/../plugins');
    const plugins: Plugin[] = [];
    const pluginLogs: PluginLoadLog[] = [];

    try {
        await fs.access(pluginsDir);
    } catch {
        console.warn(
            chalk.yellow(`Plugins directory not found at ${pluginsDir}`),
        );
        return plugins;
    }

    let dirEntries;
    try {
        dirEntries = await fs.readdir(pluginsDir, { withFileTypes: true });
    } catch (err) {
        console.error(chalk.red(`Error reading plugins directory: ${err}`));
        return plugins;
    }

    const pluginFolders = dirEntries
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    for (const folder of pluginFolders) {
        const pluginFolderPath = path.join(pluginsDir, folder);
        let mainFiles: string[];
        try {
            const files = await fs.readdir(pluginFolderPath);
            mainFiles = files.filter(
                (file) =>
                    file.toLowerCase().endsWith('plugin.ts') ||
                    file.toLowerCase().endsWith('plugin.js'),
            );
        } catch (err) {
            console.error(
                chalk.red(`Error reading folder "${folder}": ${err}`),
            );
            continue;
        }

        if (mainFiles.length === 0) {
            console.warn(
                chalk.yellow(
                    `No main plugin file found in folder "${folder}". Skipping.`,
                ),
            );
            continue;
        }

        const mainPluginFile = mainFiles[0];
        const pluginPath = path.join(pluginFolderPath, mainPluginFile);
        try {
            const pluginModule = await import(pluginPath);
            const plugin: Plugin = pluginModule.default || pluginModule;

            if (!plugin.name) {
                console.warn(
                    chalk.yellow(
                        `Plugin in folder "${folder}" is missing a name. Skipping.`,
                    ),
                );
                continue;
            }

            plugin.commands = plugin.commands || [];
            plugin.events = plugin.events || [];

            const loadOptions = plugin.loadOptions || {};
            const commandsFolderName = loadOptions.commandsFolder || 'commands';
            const eventsFolderName = loadOptions.eventsFolder || 'events';

            const { commands: loadedCommands, subcommands: loadedSubcommands } =
                await loadPluginCommands(
                    pluginFolderPath,
                    commandsFolderName,
                    loadOptions,
                    plugin,
                );
            const loadedEvents = await loadPluginEvents(
                pluginFolderPath,
                eventsFolderName,
                loadOptions,
                plugin,
            );

            for (const event of plugin.events) {
                try {
                    if (event.once) {
                        client.once(event.name, (...args) =>
                            event.execute(...args),
                        );
                    } else {
                        client.on(event.name, (...args) =>
                            event.execute(...args),
                        );
                    }
                } catch (err) {
                    console.error(
                        chalk.red(
                            `Error registering event "${event.name}" for plugin "${plugin.name}": ${err}`,
                        ),
                    );
                }
            }

            console.info(
                chalk.blue(
                    `Loaded plugin: ${chalk.bold.keyword('orange')(plugin.name)}`,
                ),
            );
            pluginLogs.push({
                pluginName: `${plugin.name}\nBy (${plugin.author || 'Unknown'})`,
                commands: loadedCommands,
                events: loadedEvents,
                subcommands: loadedSubcommands,
            });

            plugins.push(plugin);
        } catch (error) {
            console.error(
                chalk.red(`Error loading plugin "${folder}": ${error}`),
            );
        }
    }

    const table = new Table({
        head: [
            chalk.bold.keyword('orange')('Plugin'),
            chalk.bold.keyword('orange')('Commands Loaded'),
            chalk.bold.keyword('orange')('Events Loaded'),
            chalk.bold.keyword('orange')('Subcommands Loaded'),
        ],
        colWidths: [20, 25, 25, 25],
        wordWrap: true,
    });

    pluginLogs.forEach((log) => {
        const commands =
            log.commands.length > 0 ? log.commands.join('\n') : 'None';
        const events =
            log.events.length > 0
                ? log.events
                      .map((e) => `${e.name}${e.once ? ' (once)' : ''}`)
                      .join('\n')
                : 'None';

        const subcommands =
            Object.keys(log.subcommands).length > 0
                ? Object.entries(log.subcommands)
                      .map(([cmd, subs]) => `${cmd}: ${subs.join(', ')}`)
                      .join('\n')
                : 'None';

        table.push([log.pluginName, commands, events, subcommands]);
    });

    console.log('\n' + table.toString());
    return plugins;
}
