const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ReactionMenu = require('../ReactionMenu.js');
const { stripIndent } = require('common-tags');
const { sort } = require ('fast-sort');
const emojis = require('../../utils/emojis.json')

module.exports = class rolesCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'roles',
      aliases: ['allroles', 'rolecount'],
      usage: 'members <role mention/ID/name>',
      description: 'Displays all the roles of the server with their member count',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['roles']
    });
  }
  async run(message, args) {
    if (message.guild.roleRetrieval.has(message.guild.id)) return message.reply(`Already in progress.`)
    message.guild.roleRetrieval.set(message.guild.id, true);

    console.log(message.guild.roleRetrieval)
    const max = 25;
    try {
      const roleCount = message.guild.roles.cache.size
      const embed = new MessageEmbed()
          .setTitle(`Role Count ${roleCount}`)
          .setDescription(`Total Roles: \`${roleCount}\`\nRemaining Space: \`${250 - roleCount}\`\n\n${emojis.load}`)
          .setFooter(`Total Roles: ${roleCount}`)

      message.channel.send(embed).then(
          msg=>{
            const roles = [];
            const sorted = sort(message.guild.roles.cache).desc(u => u.members.length)
            sorted.forEach(r => roles.push(`<@&${r.id}> - \`${r.members.size} Members\``))

            if (roles.length <= max) {
              msg.edit(embed.setDescription(`TOTAL ROLES: \`${roleCount}\`\nREMAINING SPACE: \`${250 - roleCount}\`\n\n${roles.join('\n')}`))
            }
            else
            {
              msg.edit(embed.setFooter(
                  'Expires after two minutes.\n',
                  message.author.displayAvatarURL({ dynamic: true })))

              new ReactionMenu(message.client, message.channel, message.member, embed, roles, max);
            }
            msg.edit(embed).catch(err => {
              this.sendErrorMessage(message, 0, `Too much data to display.`);
            })
          }
      )
    } catch (e) {
      console.log(e)
    }
    message.guild.roleRetrieval.delete(message.guild.id);
  }
};