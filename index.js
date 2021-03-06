try {
    var Discord = require('discord.js');
    var d20 = require('d20');
    var Auth = require("./auth.json");
    var https = require('https');
    var http = require("http");

    var Spotify = require('spotify-web-api-node');
    var spotifyApi = new Spotify({
        clientId: Auth.spotify.clientId,
        clientSecret: Auth.spotify.clientSecret
    });

    var Twitter = require('twitter');
    var GoogleMapsAPI = require('googlemaps');
    var twitterApi = new Twitter({
      consumer_key: Auth.twitter.consumer_key,
      consumer_secret: Auth.twitter.consumer_secret,
      access_token_key: Auth.twitter.access_token_key,
      access_token_secret: Auth.twitter.access_token_secret
    });

    var mapsConfig = {
      key: Auth.googlemaps.KEY,
      stagger_time:       1000, // for elevationPath
      encode_polylines:   false,
      secure:             true, // use https
    };
    var gmAPI = new GoogleMapsAPI(mapsConfig);

    var exec = require('child_process').exec;
} catch (e) {
    console.log(e.stack);
    console.log("Run `npm install` and ensure it passes with no errors!");
    process.exit();
}

try {
    var Auth = require('./auth.json');
} catch (e) {
    console.log("Please create an auth.json like auth.json.example with at least an email and password.\n" + e.stack);
    process.exit();
}


var commands = {
    "ping": {
        description: "sends `pong!` back for testing",
        execute: function (bot, msg, action) {
            //send a message to the channel the ping message was sent in.
            if (getHelp(action)) {
                bot.sendMessage(msg, this.description);
            } else {
                bot.sendMessage(msg, "pong!");
            }
            //alert the console
            console.log("pong-ed " + msg.author.username);
        }
    },
    "roll": {
        description: "rolls a fictional 6 sided die",
        execute: function (bot, msg, action) {
            //send a message to the channel the ping message was sent in.
            if (getHelp(action)) {
                bot.sendMessage(msg, this.description);
            } else {
                bot.reply(msg, "Rolled " + d20.roll(6));
            }
            //alert the console
            console.log(msg.author.username + " rolled " + d20.roll(6));
        }
    },
    "topic": {
        description: "sets the topic of the channel",
        execute: function (bot, msg, action) {
            if (getHelp(action)) {
                bot.sendMessage(msg, this.description);
            } else {
                var channel = bot.channels.get('name', 'bot-dev');
                bot.setChannelTopic(msg.channel, action);
            }
        }
    },
    "spotify": {
        description: "return the top song from your search on spotify",
        execute: function (bot, msg, action) {
            if (getHelp(action)) {
                bot.sendMessage(msg, this.description);
            } else {
                spotifyApi.searchTracks(action)
                    .then(function (data) {
                            bot.sendMessage(msg, data.body.tracks.items[0].external_urls
                                .spotify);
                        },
                        function (err) {
                            console.error(err);
                        });
            }
        }
    },
    "help": {
        execute: function (bot, msg, action) {
            bot.sendMessage(msg, "ping, roll, spotify");
        }
    },
    "band": {
        description: "See an artists upcoming tour dates",
        execute: function (bot, msg, action) {
            if (getHelp(action)) {

            } else {
                var options = {
                    host: "api.bandsintown.com",
                    path: "/artists/" + action +
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
                        //console.log(strJson);
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
        }
    },
    "cmd": {
        description: "dont use this",
        execute: function (bot, msg, action) {
            if (getHelp(action)) {
                bot.sendMessage(msg, this.description);
            } else {
                //   var cmd = msg.cleanContent.replace('!cmd ', '');
                //   console.log(cmd);
                //   if (cmd === 'pwd' || cmd.indexOf('ls') == 0) {
                //     exec(cmd, function(error, stdout,
                //       stderr) {
                //       bot.sendMessage(msg, stdout);
                //     });
                //   }
            }
        }
    },
    "trending": {
        description: "See trending topics in your area",
        execute: function (bot, msg, action) {
            if (getHelp(action)) {
                //do something
            }
            else {
                var addressToSearch = msg.cleanContent.replace('!trending ', '');
                var geocodeParams = {
                    address: addressToSearch
                }
                gmAPI.geocode(geocodeParams, function(err,result){
                    //console.log("error: " + err);
                    var location = result.results[0].geometry.location;
                    var lat = location.lat;
                    var long = location.lng;
                    var twitterLocation = {'lat':lat, 'long':long};
                    twitterApi.get('trends/closest',twitterLocation, function(err,response,raw){
                        var woeid = {'id':response[0].woeid};
                        twitterApi.get('trends/place',woeid,function(err,response,raw){
                            var trendingTopics = "The top 10 trending topics near " + addressToSearch + " are... \n\n";
                            var i;
                            for (i = 0; i < 10; i++) {
                                var listNumeral = i+1;
                                trendingTopics = trendingTopics + listNumeral + ". " +response[0].trends[i].name + '\n';
                            } 

                            bot.sendMessage(msg, trendingTopics);
                        });
                    });
                });
            }
        }
    }
};

function getHelp(action) {
    return action.indexOf('--help') > -1;
}

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
    if (msg.content.indexOf("!") == 0) {
        var stringEnd = (msg.content.indexOf(' ') > -1) ? msg.content.indexOf(' ') : msg.content.length;
        var cmd = msg.content.substring(1, stringEnd);
        var action = msg.content.substring(stringEnd + 1, msg.content.length);
        if (commands[cmd]) {
            commands[cmd].execute(bot, msg, action);
        }
        else {
            bot.sendMessage(msg.channel, "I don't understand.");
        }
    }

    if (msg.content.indexOf(bot.user.mention()) == 0 && msg.content.split(" ")[
            1] == undefined) {
        var responses = ["what", "fuck you", "hey man", "yes?"];


        bot.sendMessage(msg.channel, responses[Math.floor(Math.random() *
            responses.length + 1)]);
    }

    if (msg.content.indexOf(bot.user.mention()) == 0 && msg.content.replace(bot.user.mention() + " ", '') == 'suh dude') {
        var responses = ['a-suh', 'suh', 'asuhdue', 'asuhdude', 'suh dude', 'asada'];


        bot.sendMessage(msg.channel, responses[Math.floor(Math.random() *
            responses.length + 1)]);
    }
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
