﻿'use strict';

var HandlersCollection = require('./types/handlers-collection.js')
var Channel = require('./channel/channel.js')

function CrossChannel(name) {
	var crosschannel = this
	if (!arguments.length) {
		throw new TypeError('Failed to construct \'CrossChannel\': 1 argument required, but only 0 present.')
	}
	if (!(this instanceof CrossChannel)) {
		throw new TypeError('Failed to construct \'CrossChannel\': Please use the \'new\' operator, this constructor cannot be called as a function.')
	}
	this.name = String(name)
	this.onmessage = null
	this.closed = false
	this.messageHandlers = new HandlersCollection()

	this.channel = new Channel(this.name)

	this.channel.onMessageEvent(function(event){
		crosschannel.messageHandlers.handle(event)
		if (typeof crosschannel.onmessage === 'function') {
			crosschannel.onmessage(event)
		}
	})
}

CrossChannel.prototype.on =
CrossChannel.prototype.addEventListener = function (type, handler) {
	this.messageHandlers.push(handler)
}

CrossChannel.prototype.removeEventListener = function (type, handler) {
	this.messageHandlers.remove(handler)
}

CrossChannel.prototype.removeAllListeners = function () {
	this.messageHandlers.empty()
}

CrossChannel.prototype.once = function(type, handler){
	var crosschannel = this
	function removeHandler(){
		crosschannel.messageHandlers.remove(handler)
		crosschannel.messageHandlers.remove(removeHandler)
	}
	this.messageHandlers.push(handler)
	this.messageHandlers.push(removeHandler)
}

CrossChannel.prototype.postMessage = function (message) {
	if (!arguments.length) {
		throw new TypeError('Failed to execute \'postMessage\' on \'CrossChannel\': 1 argument required, but only 0 present.')
	}
	if (this.closed) {
		return
	}
	this.channel.send(message)
}

CrossChannel.prototype.close = function () {
	this.channel.close()
	this.messageHandlers.empty()
	this.closed = true
}

CrossChannel.prototype.valueOf = function () {
	return '[object CrossChannel]'
}

module.exports = CrossChannel