import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, Message } from 'discord.js';
import { Args } from '@sapphire/framework';
import '@sapphire/plugin-subcommands/register';

import { messageView, chatInputView } from '../../subcommands/settings/prefix/view';
import { messageSet, chatInputSet } from '../../subcommands/settings/prefix/set';

@ApplyOptions<Subcommand.Options>({
    description: 'Manage the custom prefix for this guild',
    preconditions: ['GuildOnly'],
    subcommands: [
        { name: 'set', messageRun: 'messageSet', chatInputRun: 'chatInputSet' },
        { name: 'view', messageRun: 'messageView', chatInputRun: 'chatInputView', default: true }
    ]
})
export class PrefixCommand extends Subcommand {
    public override registerApplicationCommands(registry: Subcommand.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
        const contexts: InteractionContextType[] = [InteractionContextType.Guild];

        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'set',
                    description: 'Set a new custom prefix for this guild',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'new_prefix',
                            description: 'The new prefix to set (1–5 characters)',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            minLength: 1,
                            maxLength: 5
                        }
                    ]
                },
                {
                    name: 'view',
                    description: 'View the current custom prefix for this guild',
                    type: ApplicationCommandOptionType.Subcommand
                }
            ],
            integrationTypes,
            contexts
        });
    }

    public async messageView(message: Message) {
        return messageView(message);
    }

    public async chatInputView(interaction: Subcommand.ChatInputCommandInteraction) {
        return chatInputView(interaction);
    }

    public async messageSet(message: Message, args: Args) {
        return messageSet(message, args);
    }

    public async chatInputSet(interaction: Subcommand.ChatInputCommandInteraction) {
        return chatInputSet(interaction);
    }
}
