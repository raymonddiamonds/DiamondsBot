var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var weather = require("./weatherAPI.js");



var db = mongoose.connect(process.env.MONGODB_URI);

var step = 0;

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
    console.log('hello world 2019')
    res.send("Deployed! 2019 works! 2");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
    // Make sure this is a page subscription
    if (req.body.object == "page") {
        // Iterate over each entry
        // There may be multiple entries if batched
        req.body.entry.forEach(function(entry) {
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
               
                if (event.postback) {
                    sendMessage(event.sender.id, "postback received")
                    // processPostback(event);
                } else if (event.message) {
                    processMessage(event);
                }
            });
        });

        res.sendStatus(200);
    }
});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

    sendMessage(senderId, {text: senderId});
  
}

function processMessage(event) {
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("Received message from senderId: " + senderId);
        console.log("Message is: " + JSON.stringify(message));

        if(step == 1){
            if(message.attachments[0].payload.coordinates) {
                getWeatherCoord(message.attachments[0].payload.coordinates.lat, message.attachments[0].payload.coordinates.long, senderId)
                //sendMessage(senderId, {text:"attach: " + message.attachments[0].payload.coordinates.lat});
            } else {
                getWeatherCity(message.text, senderId) 

                
            }
        }

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise search for new movie.
            switch (formattedMsg) {
                case "find weather info":
                    step = 1;
                    sendMessage(senderId, {text: "For which city?",
                        quick_replies: [{  
                            "content_type":"location"
                        }]
                    });
                    break;
                case "hey":
                case "hi":
                case "hello":
                case "ni hao":
                    sendMessage(senderId, {text: "Heya! Welcome to RayBot" });
                    sendMessage(senderId, {
                        text: "How can I help you?", 
                        quick_replies: [{
                            "content_type":"text",
                            "title":"Find weather info",
                            "image_url": "https://img.icons8.com/color/48/000000/summer.png",
                            "payload":"weather"
                          }, {
                            "content_type": "text",
                            "title": "Find flight info",
                            "image_url": "https://img.icons8.com/color/48/000000/airplane-take-off.png",
                            "payload": "flight"
                          }
                        ]
                      })
                    break;

                default:
                    sendMessage(senderId, {text: "Default message. Sorry I don't understand. Try again: \n " + formattedMsg})
            }
        } else if (message.attachments) {

            // If requesting location
            // if(message.attachments[0].payload.coordinates) {
            //     getWeather(message.attachments[0].payload.coordinates.lat, message.attachments[0].payload.coordinates.long, senderId)
            //     //sendMessage(senderId, {text:"attach: " + message.attachments[0].payload.coordinates.lat});
                
            // }
     
        }
    }
}

function getWeatherCoord(lat, long, senderId) {

    request("http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&long=" + long + "&appid=" + process.env.WEATHER_API_ID + "&units=metric", function (error, response, body) {
       
            var weather = JSON.parse(body);
            var temp = parseInt(weather.main.temp)
            var desc = weather.weather.description

            sendMessage(senderId, {text: "The weather is: " + temp + ". " + desc})
        
    })
}

function getWeatherCity(city, senderId) {

    request("http://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + process.env.WEATHER_API_ID + "&units=metric", function (error, response, body) {
       
            var weather = JSON.parse(body);
            var temp = parseInt(weather.main.temp)
            var desc = weather.weather.description

            sendMessage(senderId, {text: "The weather is: " + temp +  ". " + desc})
        
    })
}


// sends message to user
function sendMessage(recipientId, message) {

    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
}