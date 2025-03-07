import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    Interaction,
} from 'discord.js';

export interface PluginEvent<T extends unknown[] = unknown[]> {
    name: string;
    once?: boolean;
    execute: (...args: T) => void;
}

export interface PluginCommand<interaction extends Interaction = Interaction> {
    name: string;
    description?: string;
    data?: ApplicationCommandData;
    execute: (interaction: interaction) => void;
}

export interface PluginLoadOptions {
    commandsFolder?: string;
    eventsFolder?: string;
    subcommandsFolder?: string;
    skipCommands?: string[];
    skipEvents?: string[];
    skipSubcommands?: string[];
}

export interface Plugin {
    name: string;
    description: string;
    author: string;
    commands: PluginCommand[];
    events: PluginEvent[];
    loadOptions?: PluginLoadOptions;
}

export interface PluginLoadLog {
    pluginName: string;
    commands: string[];
    events: Array<{ name: string; once: boolean }>;
    subcommands: Record<string, string[]>;
}

export interface PluginSubCommand {
    name: string;
    description: string;
    options: Array<{
        name: string;
        description: string;
        type: ApplicationCommandOptionType;
        required?: boolean;
        minValue?: number;
        maxValue?: number;
    }>;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
