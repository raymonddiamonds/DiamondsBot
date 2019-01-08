var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var weather = require("./weatherAPI.js");



var db = mongoose.connect(process.env.MONGODB_URI);


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

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise search for new movie.
            switch (formattedMsg) {
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
                case "Find weather info":
                    sendMessage(senderId, {text: "For which city?"});


                default:
                    sendMessage(senderId, {text: "Defaul message. Sorry I don't understand. Try again"})
            }
        } else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don't understand your request. Please try again"});
        }
    }
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