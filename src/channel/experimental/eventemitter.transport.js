'use strict'

var EventEmitter = require('events')

var MessageEvent = require('../../types/message-event.js')
var Message = require('../../types/message.js')
var generateRandomKey = require('../../utils/generate-random-key.js')
//var getAllChildWindows = require('../utils/get-all-child-windows.js')
var environment = require('../../utils/environment.js')

var global = environment.global
var eventEmitter = new EventEmitter()

function Transport(name) {
	this.port = eventEmitter
	this.name = name
	this.key = generateRandomKey()
	this.port.setMaxListeners(Infinity)
}

Transport.supported = Boolean(environment.isNode)
Transport.EVENT_TYPE = 'message'

Transport.prototype.send = function (data) {
	var message = new Message(data, this)
	var port = this.port
	var event = {
		data: message
	}
	setImmediate(function(){
		port.emit(Transport.EVENT_TYPE, event)
	})
}

Transport.prototype.onMessageEvent = function (handler) {
	var transport = this
	var port = this.port
	//port.setMaxListeners(port.getMaxListeners() + 1)
	function listener(event) {
		var messageEvent = new MessageEvent(event)
		
		if (
			//('key' in messageEvent) 
			//&& ('sourceChannel' in messageEvent)
			transport.name === messageEvent.sourceChannel //events on the same channel
			&& transport.key !== messageEvent.key //skip returned back events
		) {
			handler(messageEvent)
		}
	}
	port.removeAllListeners()
	port.on(Transport.EVENT_TYPE, listener)
}

Transport.prototype.close = function () {
	this.port.removeAllListeners()
}

module.exports = Transport