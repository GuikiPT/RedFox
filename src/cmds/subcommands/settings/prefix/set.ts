import type { Message } from 'discord.js';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import { Args } from '@sapphire/framework';
import { hasManageGuildPermission, hasManageGuildPermissionChat, respond, updatePrefix } from './shared';

export type ChatInput = Subcommand.ChatInputCommandInteraction;

export async function messageSet(message: Message, args: Args) {
    if (!message.guild?.id) {
        return respond(message, '❌ This command can only be used in a server!');
    }

    if (!hasManageGuildPermission(message)) {
        return respond(message, '❌ You need the "Manage Server" permission to change the prefix!');
    }

    const newPrefix = await args.rest('string').catch(() => null);
    if (!newPrefix) {
        return respond(message, '❌ Please provide a new prefix! Usage: `prefix set <new_prefix>`');
    }

    return updatePrefix(message, message.guild.id, newPrefix);
}

export async function chatInputSet(interaction: ChatInput) {
    if (!interaction.guild?.id) {
        return respond(interaction, '❌ This command can only be used in a server!', { ephemeral: true });
    }

    if (!hasManageGuildPermissionChat(interaction)) {
        return respond(interaction, '❌ You need the "Manage Server" permission to change the prefix!', { ephemeral: true });
    }

    const newPrefix = interaction.options.getString('new_prefix', true);
    return updatePrefix(interaction, interaction.guild.id, newPrefix);
}
