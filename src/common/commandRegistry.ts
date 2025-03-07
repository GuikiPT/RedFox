import { PluginCommand } from '../types/pluginTypes';
import chalk from 'chalk';

const commands = new Map<string, PluginCommand>();

export function registerCommand(command: PluginCommand): void {
    if (!command || !command.name) {
        console.error(
            chalk.red('Invalid command provided. Command must have a name.'),
        );
        return;
    }

    if (commands.has(command.name)) {
        console.warn(
            chalk.yellow(
                `Command "${command.name}" is already registered and will be overwritten.`,
            ),
        );
    }
    commands.set(command.name, command);
}

export function getCommand(name: string): PluginCommand | undefined {
    return commands.get(name);
}

export function getAllCommands(): PluginCommand[] {
    return Array.from(commands.values());
}

export function unregisterCommand(name: string): boolean {
    if (!commands.has(name)) {
        console.warn(chalk.yellow(`Command "${name}" is not registered.`));
        return false;
    }
    commands.delete(name);
    console.info(chalk.green(`Command "${name}" unregistered successfully.`));
    return true;
}
