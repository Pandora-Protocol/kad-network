const CryptoUtils = require('./../../helpers/crypto-utils')
const ECCUtils = require('./../../helpers/ecc-utils')


module.exports = function (contactStorage){

    const _createContactArgs = contactStorage.createContactArgs;
    contactStorage.createContactArgs = createContactArgs;
    contactStorage.sybilSign = sybilSign;

    function sybilSign( message, index, cb){

        if (index === undefined)
            index = Math.floor( Math.random() * KAD_OPTIONS.PLUGINS.CONTACT_SYBIL_PROTECT.SYBIL_PUBLIC_KEYS.length);

        const sybilSignature = ECCUtils.sign( KAD_OPTIONS.PLUGINS.CONTACT_SYBIL_PROTECT.SYBIL_PUBLIC_KEYS[index].privateKey, CryptoUtils.sha256( message ) );

        let hex = index.toString(16, 2);
        if (hex.length === 1) hex = "0"+hex;

        const signature = Buffer.concat([
            Buffer.from( hex, "hex"),
            sybilSignature,
        ]);

        cb(null, {
            index,
            signature,
        })
    }

    function createContactArgs ( opts ){

        return new Promise((resolve, reject)=>{

            if (!opts.publicKey) {
                const keyPair = ECCUtils.createPair();
                opts.publicKey = keyPair.publicKey;
                opts.privateKey = keyPair.privateKey;
            }

            this.sybilSign( opts.publicKey, undefined, async (err, sybilSignature )=>{

                if (err) return cb(err);

                opts.nonce = sybilSignature.signature;
                opts.identity = CryptoUtils.sha256( Buffer.concat( [ opts.nonce, opts.publicKey ] ) );

                try{
                    const out = await _createContactArgs( opts );
                    resolve(out);
                }catch(err){
                    reject(err);
                }

            } );

        })


    }


}