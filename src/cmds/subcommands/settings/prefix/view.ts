// src/commands/prefix/view.ts
import type { Message } from 'discord.js';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import { getCurrentPrefix, respond } from './shared';

export type ChatInput = Subcommand.ChatInputCommandInteraction;

export async function messageView(message: Message) {
    if (!message.guild?.id) {
        return respond(message, '❌ This command can only be used in a server!');
    }

    const currentPrefix = await getCurrentPrefix(message.guild.id);
    const viewMsg = `📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, use: \`${currentPrefix}prefix set <new_prefix>\``;

    return respond(message, viewMsg);
}

export async function chatInputView(interaction: ChatInput) {
    if (!interaction.guild?.id) {
        return respond(interaction, '❌ This command can only be used in a server!', { ephemeral: true });
    }

    const currentPrefix = await getCurrentPrefix(interaction.guild.id);
    const viewMsg = `📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, use the \`/prefix set\` command.`;

    return respond(interaction, viewMsg, { ephemeral: true });
}
