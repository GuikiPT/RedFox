import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import type { Message } from 'discord.js';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { GuildService } from '../../../../database/models/guild';

export type ChatInput = Subcommand.ChatInputCommandInteraction;

export function makeEmbed(content: string) {
    return new EmbedBuilder().setDescription(content).setColor(0x5865f2);
}

export async function respond(
    interactionOrMessage: Message | ChatInput,
    content: string,
    opts?: { ephemeral?: boolean }
) {
    const embed = makeEmbed(content);

    if ('author' in interactionOrMessage) {
        return interactionOrMessage.reply({ embeds: [embed] });
    }

    if (interactionOrMessage.deferred || interactionOrMessage.replied) {
        return interactionOrMessage.editReply({ embeds: [embed] });
    }

    return interactionOrMessage.reply({ embeds: [embed], ephemeral: opts?.ephemeral ?? false });
}

export async function getCurrentPrefix(guildId: string): Promise<string> {
    const stored = await GuildService.getGuildPrefix(guildId);
    if (stored && stored.length > 0) return stored;

    const fallback =
        container.client.options.defaultPrefix?.toString() ||
        (container.client.user?.id ? `<@${container.client.user.id}>` : '!');
    return fallback;
}

export async function updatePrefix(
    interactionOrMessage: Message | ChatInput,
    guildId: string,
    newPrefix: string
) {
    if (newPrefix.length === 0) {
        return respond(interactionOrMessage, '❌ Prefix cannot be empty!', { ephemeral: true });
    }
    if (newPrefix.length > 5) {
        return respond(interactionOrMessage, '❌ Prefix cannot be longer than 5 characters!', { ephemeral: true });
    }

    try {
        await GuildService.updateGuildPrefix(guildId, newPrefix);
        return respond(
            interactionOrMessage,
            `✅ Successfully updated the server prefix to: \`${newPrefix}\``,
            { ephemeral: false }
        );
    } catch (error) {
        const msg =
            error instanceof Error ? `❌ Error: ${error.message}` : '❌ An unexpected error occurred while updating the prefix.';
        return respond(interactionOrMessage, msg, { ephemeral: true });
    }
}

export function hasManageGuildPermission(message: Message) {
    return Boolean(message.member?.permissions.has(PermissionFlagsBits.ManageGuild));
}
export function hasManageGuildPermissionChat(interaction: ChatInput) {
    return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}
