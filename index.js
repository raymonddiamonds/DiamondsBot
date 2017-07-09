'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// ROUTES

app.get('/', function(req, res) {
	res.send("Hi I am DiamondsBot")
})

let token = "EAAQRNZBHHfokBAFvGibreVIyZA1vQl279t01F4IsIAZBTDTSiPrZCt11p2Vc9jFrVyVYJpcLrx2EsIViBhMQ4zFjPnuCQFtQJiJ6Wvlq28w3QVOmzHiUKMuziBugOgzFGsBfwx7YiPVBg6cZBEeWZAHwe1UDQjcnyG6FiaPfAl3wZDZD"

// Facebook 

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "blondiebytes") {
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = messaging_events[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text

			if (text.includes("Hello"))
			sendText(sender, "Hello! Welcome to DiamondsBot!")
		    if (text.includes("Hey"))
			sendText(sender, "Hello! Welcome to DiamondsBot!")
		    if (text.includes("Sup"))
			sendText(sender, "Hello! Welcome to DiamondsBot!")
		}
	}
	res.sendStatus(200)
})

function sendText(sender, text) {
	let messageData = {text: text}
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error")
		} else if (response.body.error) {
			console.log("response body error")
		}
	})
}

app.listen(app.get('port'), function() {
	console.log("running: port")
})



