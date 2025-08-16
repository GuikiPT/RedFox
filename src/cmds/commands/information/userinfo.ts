import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    InteractionContextType,
    Message,
    User,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type MessageActionRowComponentBuilder,
    MessageFlags
} from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'Show user info'
})
export class UserInfoCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall
        ];
        const contexts: InteractionContextType[] = [
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        ];

        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(opt =>
                    opt.setName('member')
                        .setDescription('Which member to show info for')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt.setName('ephemeral')
                        .setDescription('Only you can see the response')
                        .setRequired(false)
                )
                .setIntegrationTypes(integrationTypes)
                .setContexts(contexts)
        );

        registry.registerContextMenuCommand({
            name: this.name,
            type: ApplicationCommandType.User,
            integrationTypes,
            contexts
        });
    }

    public override async messageRun(message: Message, args: Args) {
        const user = await args.pick('user').catch(() => message.author);
        const ephemeral = await args.pick('boolean').catch(() => false);
        return this.sendUserInfo(message, user, ephemeral);
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const member = interaction.options.getUser('member') ?? interaction.user;
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        return this.sendUserInfo(interaction, member, ephemeral);
    }

    public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
        if (interaction.isUserContextMenuCommand()) {
            return this.sendUserInfo(interaction, interaction.targetUser, false);
        }
        return interaction.reply({ content: 'Use this on a user.', flags: MessageFlags.Ephemeral });
    }

    private async buildComponents(user: User, guildId?: string) {
        const fullUser = user.banner === undefined ? await user.fetch().catch(() => user) : user;
        const avatarURL = fullUser.displayAvatarURL({ size: 1024 });
        const bannerURL = fullUser.banner ? fullUser.bannerURL({ size: 2048 }) ?? undefined : undefined;

        let joinedTs: number | undefined;
        let rolesLine: string | undefined;

        if (guildId) {
            const guild = this.container.client.guilds.cache.get(guildId);
            if (guild) {
                const member = await guild.members.fetch(user.id).catch(() => null);
                if (member) {
                    joinedTs = member.joinedTimestamp ?? undefined;
                    rolesLine = member.roles.cache
                        .filter(r => r.id !== guild.id)
                        .map(r => r.toString())
                        .join(', ') || 'None';
                }
            }
        }

        const generalBlock = [
            '## General User Information:',
            `> **Username**: ${fullUser.tag ?? fullUser.username}`,
            `> **ID**: \`${fullUser.id}\``,
            `> **Mention**: <@${fullUser.id}>`,
            `> **Creation Date**: <t:${Math.floor(fullUser.createdTimestamp / 1000)}:f> (<t:${Math.floor(fullUser.createdTimestamp / 1000)}:R>)`
        ];

        if (joinedTs) generalBlock.push(`> **Joined Server**: <t:${Math.floor(joinedTs / 1000)}:f> (<t:${Math.floor(joinedTs / 1000)}:R>)`);
        if (rolesLine) generalBlock.push(`> **Roles**: ${rolesLine}`);

        const section = new SectionBuilder()
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(generalBlock.join('\n')));

        const container = new ContainerBuilder().addSectionComponents(section);

        if (bannerURL) {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerURL))
            );
        }

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Avatar').setURL(avatarURL)
        );
        if (bannerURL) {
            row.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Banner').setURL(bannerURL));
        }
        container.addActionRowComponents(row);

        return [container];
    }

    private async sendUserInfo(
        target: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
        user: User,
        ephemeral: boolean
    ) {
        const components = await this.buildComponents(user, 'guild' in target ? target.guild?.id : undefined);

        if (target instanceof Message) {
            return target.reply({
                components,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
        }

        const flags = MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0);
        return target.reply({
            components,
            flags,
            allowedMentions: { parse: [] }
        });
    }
}
