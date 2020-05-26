const Discord = require('discord.js');
const { prefix, token} = require("./config.json");

const test1_role = '712447921186144298';
const test2_role = '712461086800216185';

const ytdl = require("ytdl-core");

const bot =  new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

async function thisThrows() {
    throw new Error("Thrown from thisThrows()");
}


bot.on('message', (message) =>{

    if(message.content == ('!rolesid'))
    {
    console.log(message.guild.roles);
    }

    if(message.content==('!help'))
    {
        message.author.send("Normal Commands:");
        message.author.send("``` !help \n !kick (user) ```");
        message.author.send("Music Commands:");
        message.author.send("``` !play (url) \n !skip \n !stop  ```");
    return;
    }

    if(!message.author.bot && message.channel.name === 'announcements')
    {
    message.react('✅').then(() => message.react('❌'));
    }

    const filter = (reaction, user) => {
        return ['✅', '❌'].includes(reaction.emoji.name) && !message.author.bot;
    };

    if(message.content == ('!kick')) {
        let member = message.mentions.members.first();
        member.kick().then((member) => {
            message.channel.send("👋 " + member.displayName + " has been kicked!")
        })
    }
});

bot.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.emoji.name === '✅' && reaction.message.channel.name === 'announcements') {
        const guild = reaction.message.guild;
        const memberWhoReacted = guild.members.cache.find(member => member.id === user.id);
        memberWhoReacted.roles.add(test1_role);
    }

    if (reaction.emoji.name === '❌' && reaction.message.channel.name === 'announcements') {
        const guild = reaction.message.guild;
        const memberWhoReacted = guild.members.cache.find(member => member.id === user.id);
        memberWhoReacted.roles.add(test2_role);
    }

    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
	}
});

  bot.on('messageReactionRemove', async (reaction, user) => {

    if (reaction.emoji.name === '✅' && reaction.message.channel.name === 'announcements') {
        const guild = reaction.message.guild;
        const memberWhoReacted = guild.members.cache.find(member => member.id === user.id);
        memberWhoReacted.roles.remove(test1_role);
    }

    if (reaction.emoji.name === '❌' && reaction.message.channel.name === 'announcements') {
        const guild = reaction.message.guild;
        const memberWhoReacted = guild.members.cache.find(member => member.id === user.id);
        memberWhoReacted.roles.remove(test2_role);
    }

    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
	}
  });

var queue = new Map();
bot.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    const serverQueue = queue.get(message.guild.id);
  
    if (message.content.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      return;
    } else if(message.content.startsWith(`${prefix}nowplaying`)){
        const serverQueue = message.client.queue.get(message.guild.id);
		if (!serverQueue) return message.channel.send('There is nothing playing.');
		return message.channel.send(`Now playing: ${serverQueue.songs[0].title}`);
    }
  });
  
  async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.title,
      url: songInfo.video_url
    };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }



bot.login(token);