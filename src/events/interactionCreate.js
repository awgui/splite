const {MessageEmbed} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const {fail} = require('../utils/emojis.json');

module.exports = async (client, interaction) => {
    if (interaction.isCommand()) {
        let command = client.commands.get(interaction.commandName);
        if (command.slashCommand) {
            //Blacklisted user
            if (command.checkBlacklist(interaction.user)) {
                const replyEmbed = new MessageEmbed()
                    .setDescription(`${fail} You are blacklisted.`);
                if (client.owners.length) {
                    replyEmbed.addField('If you think this is a mistake', `contact ${client.owners[0]}`);
                }
                return interaction
                    .reply({
                        embeds: [replyEmbed],
                    })
                    .then(async ()=>{
                        await wait(15000);
                        await interaction.deleteReply();
                    });
            }

            // check cooldown
            const cooldown = await command.isOnCooldown(interaction.user.id);
            if (cooldown) return interaction.reply({
                embeds: [new MessageEmbed().setDescription(`You are on a cooldown. Try again in **${cooldown}** seconds.`),],
                ephemeral: true,
            });

            // check if instance already running
            const instanceExists = command.isInstanceRunning(interaction.user.id);
            if (instanceExists) return interaction.reply({
                embeds: [new MessageEmbed().setDescription('Command already in progress, please wait for it.'),],
                ephemeral: true,
            });

            const author = await interaction.guild.members.fetch(interaction.user.id);
            const channel = await interaction.guild.channels.cache.get(interaction.channelId);

            if (author) {
                interaction.user = author;
                interaction.author = author;
            }
            if (channel) {
                interaction.channel = channel;
            }

            // Get points
            const {
                point_tracking: pointTracking, message_points: messagePoints,
            } = client.db.settings.selectPoints.get(interaction.guild.id);

            // Check if mod channel
            let modChannelIds = command.client.db.settings.selectModChannelIds
                .pluck()
                .get(interaction.guild.id) || [];
            if (typeof modChannelIds === 'string') modChannelIds = modChannelIds.split(' ');

            if (modChannelIds.includes(interaction.channelId)) {
                if (command.type !== client.types.MOD || (command.type === client.types.MOD && channel
                    .permissionsFor(author)
                    .missing(command.userPermissions) !== 0)) {
                    // Update points with messagePoints value
                    if (pointTracking) client.db.users.updatePoints.run({points: messagePoints}, author.id, interaction.guild.id);
                    return interaction
                        .reply(`${fail} This is a mod-only channel. Only Mod commands may be used in this channel.\nTo reset this, an admin can use \`clearmodchannels\` in another channel`)
                        .then((m) => setTimeout(() => m.delete(), 15000)); // Return early so bot doesn't respond
                }
            }

            // check permissions
            const permissionErrors = command.checkPermissionErrors(author, channel, interaction.guild);
            if (!permissionErrors) return interaction.reply({
                content: '**This command can only be used by the bot creator.**', ephemeral: true,
            });
            if (permissionErrors instanceof MessageEmbed) return interaction.reply({
                embeds: [permissionErrors], ephemeral: true,
            });

            // check disabled commands
            let disabledCommands = client.db.settings.selectDisabledCommands
                .pluck()
                .get(interaction.guild.id) || [];
            if (typeof disabledCommands === 'string') disabledCommands = disabledCommands.split(' ');

            if (!disabledCommands?.includes(command.name)) {
                if (!command.checkNSFW(channel)) {
                    return interaction.reply({
                        embeds: [new MessageEmbed()
                            .setAuthor({
                                name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                iconURL: command.getAvatarURL(interaction.user),
                            })
                            .setDescription('NSFW Commands can only be run in NSFW channels.')
                            .setTimestamp()
                            .setColor('RED'),], ephemeral: true,
                    });
                }

                if (command.exclusive) command.setInstance(interaction.user.id); // Track instance
                command.setCooldown(interaction.user.id);

                return command.interact(interaction, interaction.options._hoistedOptions || null, author); // Run command
            }
        }
    }
};
