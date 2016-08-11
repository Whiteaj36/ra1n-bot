const Discord = require('discord.js');
const d20 = require('d20');
var Auth = require("./auth.json");
var https = require('https');
var http = require("http");
var Spotify = require('spotify-web-api-node');
var Auth = require('./auth.json');
var exec = require('child_process').exec;

// credentials are optional
var spotifyApi = new Spotify({
    clientId: Auth.spotify.clientId,
    clientSecret: Auth.spotify.clientSecret
});

var bot = new Discord.Client();

//when the bot is ready
bot.on("ready", function () {
    console.log(`Ready to begin! Serving in ${bot.channels.length} channels`);
});

//when the bot disconnects
bot.on("disconnected", function () {
    //alert the console
    console.log("Disconnected!");

    //exit node.js with an error
    process.exit(1);
});

//when the bot receives a message
bot.on("message", function (msg, suffix) {
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
            .then(function (data) {
                    bot.sendMessage(msg, data.body.tracks.items[0].external_urls
                        .spotify);
                    //bot.sendTTSMessage(msg, search);

                    //console.log('Search by ' + search, data.body.tracks);
                },
                function (err) {
                    console.error(err);
                });

    }

    if (msg.content.startsWith("!help")) {
        bot.sendMessage(msg, "ping, roll, spotify");
    }

    if (msg.content.indexOf(bot.user.mention()) == 0 && msg.content.split(" ")[
            1] == undefined) {
        var responses = ["what", "fuck you", "hey man", "yes?"];


        bot.sendMessage(msg.channel, responses[Math.floor(Math.random() *
            responses.length + 1)]);
    }

    if (msg.content.indexOf(bot.user.mention()) == 0 && msg.content.split(" ")[
            1] == 'suh dude') {
        var responses = ['a-suh', 'suh', 'asuhdue', 'asuhdude', 'suh dude', 'asada'];


        bot.sendMessage(msg.channel, responses[Math.floor(Math.random() *
            responses.length + 1)]);
    }

    if (msg.content.startsWith("!band")) {
        var search = msg.cleanContent.replace('!band ', '').replace(/\s/g,
            '%20');
        console.log(search);
        var options = {
            host: "api.bandsintown.com",
            path: "/artists/" + search +
                "/events.json?api_version=2.0&app_id=YOUR_APP_ID"
        };
        callback = function (response) {
            var str = '';

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                var dates = '\n';

                var strJson = JSON.parse(str);
                console.log(strJson);
                for (var i in strJson) {
                    if (i == 10) {
                        break;
                    }
                    dates += strJson[i].title + " on " + strJson[i].formatted_datetime +
                        "\n";
                }
                bot.sendMessage(msg, dates);
            });
        }

        http.request(options, callback).end();
    }

    //fun stuff but dangerous
    // if (msg.content.startsWith("!cmd")) {
    //   var cmd = msg.cleanContent.replace('!cmd ', '');
    //   console.log(cmd);
    //   if (cmd === 'pwd' || cmd.indexOf('ls') == 0) {
    //     exec(cmd, function(error, stdout,
    //       stderr) {
    //       bot.sendMessage(msg, stdout);
    //     });
    //   }
    // }
});

//Log user status changes
bot.on("presence", function (user, status, gameId) {
    //if(status === "online"){
    //console.log("presence update");
    console.log(user + " went " + status.status);
    //}
    try {
        console.log("status for " + user.username + ": " + status.status);
        var channel = bot.channels.get("name", "bot-dev");
        if (status.game != null) {
            bot.sendMessage(channel, user.username + " started playing " +
                status
                .game.name);
        } else {
            bot.sendMessage(channel, user.username + " went " + status.status);
        }

    } catch (e) {}
});

bot.loginWithToken(Auth.discord.api_key);
