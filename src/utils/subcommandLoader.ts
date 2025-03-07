import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js';
import { PluginSubCommand } from '../types/pluginTypes';
import fs from 'fs';
import path from 'path';

/**
 * Load subcommands from a directory
 * @param basePath The base path to search for subcommands
 * @param subcommandsDir The name of the subcommands directory relative to basePath
 * @returns A record of subcommand name to subcommand
 */
export function loadSubcommands(
    basePath: string,
    subcommandsDir = 'subcommands',
): Record<string, PluginSubCommand> {
    const subcommands: Record<string, PluginSubCommand> = {};
    const subcommandPath = path.join(basePath, subcommandsDir);

    try {
        if (!fs.existsSync(subcommandPath)) {
            console.warn(`Subcommand directory not found: ${subcommandPath}`);
            return subcommands;
        }

        const files = fs
            .readdirSync(subcommandPath)
            .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of files) {
            try {
                const fullPath = path.join(subcommandPath, file);

                const imported = require(fullPath);

                if (!imported.default) {
                    console.error(`No default export in ${file}`);
                    continue;
                }

                const subcommand = imported.default;

                if (!subcommand.name || !subcommand.execute) {
                    console.error(
                        `Invalid subcommand structure in ${file}: missing required properties`,
                    );
                    continue;
                }

                const name = subcommand.name.includes('-')
                    ? subcommand.name.split('-').pop()!
                    : subcommand.name;

                subcommands[name] = subcommand;
            } catch (error) {
                const err = error as Error;
                console.error(
                    `Error loading subcommand from file ${file}:`,
                    err.stack,
                );
            }
        }
    } catch (error: unknown) {
        console.error(
            `Error loading subcommands:`,
            error instanceof Error ? error.stack : String(error),
        );
    }

    return subcommands;
}

/**
 * Build slash command data from subcommands
 * @param commandName Command name
 * @param commandDescription Command description
 * @param subcommands Subcommands to include
 * @returns ApplicationCommandData object
 */
export function buildCommandWithSubcommands(
    commandName: string,
    commandDescription: string,
    subcommands: Record<string, PluginSubCommand>,
): ApplicationCommandData {
    const builder = new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(commandDescription);

    Object.values(subcommands).forEach((subcommand) => {
        builder.addSubcommand((sub) => {
            sub.setName(subcommand.name).setDescription(subcommand.description);

            if (subcommand.options) {
                subcommand.options.forEach((option) => {
                    switch (option.type) {
                        case ApplicationCommandOptionType.Channel:
                            sub.addChannelOption((opt) =>
                                opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false),
                            );
                            break;
                        case ApplicationCommandOptionType.String:
                            sub.addStringOption((opt) =>
                                opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false),
                            );
                            break;
                        case ApplicationCommandOptionType.Integer:
                            sub.addIntegerOption((opt) => {
                                let optionBuilder = opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false);

                                if (option.minValue !== undefined) {
                                    optionBuilder = optionBuilder.setMinValue(
                                        option.minValue,
                                    );
                                }
                                if (option.maxValue !== undefined) {
                                    optionBuilder = optionBuilder.setMaxValue(
                                        option.maxValue,
                                    );
                                }
                                return optionBuilder;
                            });
                            break;
                        case ApplicationCommandOptionType.Boolean:
                            sub.addBooleanOption((opt) =>
                                opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false),
                            );
                            break;
                        case ApplicationCommandOptionType.User:
                            sub.addUserOption((opt) =>
                                opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false),
                            );
                            break;
                        case ApplicationCommandOptionType.Role:
                            sub.addRoleOption((opt) =>
                                opt
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required || false),
                            );
                            break;
                    }
                });
            }

            return sub;
        });
    });

    return builder.toJSON() as ApplicationCommandData;
}

/**
 * Execute the appropriate subcommand
 * @param interaction The command interaction
 * @param subcommands Available subcommands
 * @returns Promise resolving when execution is complete
 */
export async function executeSubcommand(
    interaction: ChatInputCommandInteraction,
    subcommands: Record<string, PluginSubCommand>,
): Promise<void> {
    const subcommandName = interaction.options.getSubcommand();

    if (!subcommands[subcommandName]) {
        await interaction.reply({
            content: `Unknown subcommand: ${subcommandName}`,
            ephemeral: true,
        });
        return;
    }

    try {
        await subcommands[subcommandName].execute(interaction);
    } catch (error: unknown) {
        console.error(
            `Error executing ${subcommandName} subcommand:`,
            error instanceof Error ? error.stack : String(error),
        );
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error executing that command.',
                ephemeral: true,
            });
        }
    }
}
