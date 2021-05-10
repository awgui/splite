const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class invertCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'invert',
      aliases: [],
      usage: 'invert <user mention/id>',
      description: 'Generates a invert image',
      type: client.types.FUN,
      examples: ['invert @split']
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    message.guild.funInProgress.set(message.author.id, 'fun');
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("invert", { url: this.getAvatarURL(member) });
        const attachment = new MessageAttachment(buffer, "invert.png");

        await message.channel.send(attachment)
        await msg.delete()
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
    message.guild.funInProgress.delete(message.author.id)
  }
};
