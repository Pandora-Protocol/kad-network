const ContactAddressProtocolType = require('../../contact/contact-address-protocol-type')
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')
const {setAsyncInterval, clearAsyncInterval} = require('../../helpers/async-interval')
const HTTPRequest = require('./http-request')

module.exports = function (kademliaRules) {

    if (typeof BROWSER === "undefined"){
        const HTTPServer = require('./http-server');
        kademliaRules._httpServer = new HTTPServer( kademliaRules._kademliaNode );
    }

    kademliaRules._httpRequest = new HTTPRequest(kademliaRules);

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    function start(){
        _start(...arguments);

        if (this._httpServer)
            this._httpServer.start();
    }

    function stop(){
        _stop(...arguments);

        if (this._httpServer)
            this._httpServer.stop();
    }





    if (ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP === undefined) throw new Error('HTTP protocol was not initialized.');
    kademliaRules._protocolSpecifics[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP] =
    kademliaRules._protocolSpecifics[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTPS] = {
        sendSerialize: sendSerialize.bind(kademliaRules),
        sendSerialized: sendSerialized.bind(kademliaRules),
        receiveSerialize: receiveSerialize.bind(kademliaRules),
    };

    function sendSerialize (destContact, command, data) {
        const id = Math.floor( Math.random() * Number.MAX_SAFE_INTEGER );
        return {
            id,
            buffer: bencode.encode( BufferHelper.serializeData([ this._kademliaNode.contact, command, data ]) ),
        }
    }

    function sendSerialized (id, destContact, command, data, cb) {
        const buffer = bencode.encode( data );
        this._httpRequest.request( id, destContact, buffer, cb )
    }

    function receiveSerialize (id, srcContact, out )  {
        return bencode.encode( BufferHelper.serializeData(out) );
    }

}