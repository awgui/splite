const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class SupportServerCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'supportserver',
      aliases: ['support', 'ss'],
      usage: 'supportserver',
      description: 'Displays the invite link to Splite\'s Discord Support Server.',
      type: client.types.INFO
    });
  }
  run(message) {
    const embed = new MessageEmbed()
      .setTitle('Support Server')
      .setThumbnail('https://raw.githubusercontent.com/sabattle/SpliteBot/develop/data/images/Splite.png')
      .setDescription('Click [here](https://discord.gg/8Uk2REYmd3) to join the Splite Support Server!')
      .addField('Other Links', 
        '**[Invite Me](https://discordapp.com/oauth2/authorize?client_id=416451977380364288&scope=bot&permissions=403008599) | ' +
        '[Repository](https://github.com/sabattle/SpliteBot)**'
      )
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};
