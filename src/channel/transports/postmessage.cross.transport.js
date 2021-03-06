'use strict'

var MessageEvent = require('../../types/message-event.js')
var Message = require('../../types/message.js')
var generateRandomKey = require('../../utils/generate-random-key.js')
var getCrossChildWindows = require('../../utils/frames.js').getCrossOriginChildren
var environment = require('../../utils/environment.js')
var locationOrigin = require('../../services/location.js').origin

var global = environment.global
var window = environment.window
var key = generateRandomKey()

/*
Known issues:
1. Safari detection of a structured clonning support when DOM is sent. String(e.data).indexOf("Null") !== -1. See https://gist.github.com/ryanseddon/4583494
2. IE8's events are triggered synchronously, which may lead to to unexpected results.
3. Firefox 41 and below do not support sending File/Blob objects see bug
5. Probbaly: IE<=9 doesn't like you to call postMessage as soon as page loads. Use a setTimeout to wait one or two seconds before calling postMessage.
6. IE8-11 doesn't support postMessage on different tabs and origins.
7. Worker structured clonning support (from MDN): Chrome >=13, Firefox >=8, IE>=10.0, Opera >=11.5, Safari>=6

Links:
* http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx

Todo:
1. Add `window.open` & `window.opener` messaging

*/

function Transport(name) {
	this.port1 = window.top
	this.port2 = global
	this.origin = '*'
	this.listener = null
	this.name = name
	this.key = key
}

Transport.supported = Boolean(global.postMessage)
Transport.EVENT_TYPE = 'message'

Transport.prototype = {
	constructor: Transport,
	
	send: function (data) {
		var origin = this.origin
		var message = new Message(data, this)
		var windows = getCrossChildWindows(this.port1)
		var index = -1
		this.port1.postMessage(message, origin) //always send message to a top window
		while (++index in windows) {
			windows[index].postMessage(message, origin)
		}
	},

	onMessageEvent: function (handler) {
		var transport = this
		var port2 = this.port2
		function listener(event) {
			var messageEvent = new MessageEvent(event)
			if (
				(
					event.source === port2
					|| locationOrigin !== event.origin
				)
				&& ('key' in messageEvent)
				&& ('sourceChannel' in messageEvent)
				&& transport.name === messageEvent.sourceChannel //events on the same channel
				&& transport.key !== messageEvent.key //skip returned back events
			) {
				handler(messageEvent)
			}
		}
		port2.removeEventListener(Transport.EVENT_TYPE, this.listener)
		port2.addEventListener(Transport.EVENT_TYPE, listener)
		this.listener = listener
	},

	close: function () {
		this.port2.removeEventListener(Transport.EVENT_TYPE, this.listener)
		this.listener = null
	}
}

module.exports = Transport