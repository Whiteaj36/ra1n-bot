const Discord = require('discord.js');
const d20 = require('d20');
var Auth = require("./auth.json");
var https = require('https');
var Spotify = require('spotify-web-api-node');
var Auth = require('./auth.json');

// credentials are optional
var spotifyApi = new Spotify({
  clientId: Auth.spotify.clientId,
  clientSecret: Auth.spotify.clientSecret
});

var bot = new Discord.Client();

//when the bot is ready
bot.on("ready", function() {
  console.log(`Ready to begin! Serving in ${bot.channels.length} channels`);
});

//when the bot disconnects
bot.on("disconnected", function() {
  //alert the console
  console.log("Disconnected!");

  //exit node.js with an error
  process.exit(1);
});

//when the bot receives a message
bot.on("message", function(msg, suffix) {
  //if message begins with "ping"
  if (msg.content.startsWith("!ping")) {
    //send a message to the channel the ping message was sent in.
    bot.sendMessage(msg, "pong!");
    //bot.sendTTSMessage(msg, "pong");

    //alert the console
    console.log("pong-ed " + msg.author.username);
  }

  if (msg.content.startsWith("!roll")) {
    //send a message to the channel the ping message was sent in.
    bot.reply(msg, "Rolled " + d20.roll(6));
    //alert the console
    //
    console.log(msg.author.username + " rolled " + d20.roll(6));
  }

  if (msg.content.startsWith("!topic")) {
    var channel = bot.channels.get('name', 'general');
    bot.setChannelTopic(channel, msg.cleanContent.replace('/topic ', ''));
  }

  if (msg.content.startsWith("!spotify")) {
    var search = msg.cleanContent.replace('!spotify ', '');
    spotifyApi.searchTracks(search)
      .then(function(data) {
          bot.sendMessage(msg, data.body.tracks.items[0].external_urls
            .spotify);
          console.log('Search by ' + search, data.body.tracks.items[
              0].external_urls
            .spotify);
        },
        function(err) {
          console.error(err);
        });

  }
});

//Log user status changes
bot.on("presence", function(user, status, gameId) {
  //if(status === "online"){
  //console.log("presence update");
  console.log(user + " went " + status.status);
  //}
  try {
    console.log("status for " + user.username + ": " + status.status);
    var channel = bot.channels.get("name", "bot-dev");
    if (status.game != null) {
      bot.sendMessage(channel, user.username + " started playing " + status
        .game.name);
    } else {
      bot.sendMessage(channel, user.username + " went " + status.status);
    }

  } catch (e) {}
});

bot.loginWithToken(Auth.discord.api_key);
