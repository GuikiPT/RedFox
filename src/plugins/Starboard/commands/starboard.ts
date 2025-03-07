import { ChatInputCommandInteraction } from 'discord.js';
import { PluginCommand } from '../../../types/pluginTypes';
import {
    loadSubcommands,
    buildCommandWithSubcommands,
    executeSubcommand,
} from '../../../utils/subcommandLoader';
import path from 'path';

const subcommands = loadSubcommands(path.join(__dirname, '..'));

const starboardCommand: PluginCommand<ChatInputCommandInteraction> = {
    name: 'starboard',
    description: 'Manage the starboard',
    data: buildCommandWithSubcommands(
        'starboard',
        'Manage the starboard',
        subcommands,
    ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await executeSubcommand(interaction, subcommands);
    },
};

export default starboardCommand;
