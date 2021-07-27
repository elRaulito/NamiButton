# NamiButton

A simple example of how to build a button for enabling [Nami](https://github.com/Berry-Pool/nami-wallet/tree/main/src) Payments in your website, change the variable var address="RECEIVING ADDRESS" and that's it.

```

  <div >
    <input type="number" id="cardano-offer" name="Offer" min="10" max="1000000" step="1" placeholder="Place your bid here" size="10" style="width:100%;   font-size:24px;" >
    </div>
    <div  ><button onclick="pay()">Pay!</button></div>

    <script src="chrome-extension://lpfcbjknijpeeillifnkikgncikgfhdo/injected.bundle.js">
      </script>
    <script src="https://ipfs.io/ipfs/QmdZwDrQckKBbSStbTKCFiGtc8zaQTtstevN9wo5Kwn6BP"></script>
    <script>
    async function activateCardano(){
    const promise = await cardano.enable()}
    activateCardano()
    </script>


    <script>
    function buf2hex(buffer) { // buffer is an ArrayBuffer
      return [...new Uint8Array(buffer)]
          .map(x => x.toString(16).padStart(2, '0'))
          .join('');
    }

    async function pay(){
    var user= await cardano.getUsedAddresses();
    var address="addr1qx9jdjjl6vxwf272dzv688aqz0cn80dq8zjnmwxdkc4xhly4qr29vqj28rqktrl40w3z7tu3vy426uj66f4p6td0qres6vu563"
      var offer=parseInt(document.getElementById("cardano-offer").value)
       let response = await fetch('https://mggvf9rnnh.execute-api.eu-west-2.amazonaws.com/default/makeTx',
        {method: 'POST',body: JSON.stringify({"address":user[0],"amount":offer,"recipient":address})});
        let data = await response.json();
        let cborRaw=data['cborHex']
    const decoded = cbor.decode(cborRaw)
    decoded.splice(1, 1, new Map());
    let buffer=cbor.encode(decoded)
    cborCorrect=buf2hex(buffer);
    const signedTx=await cardano.signTx(cborCorrect);
    const decoded_complete = cbor.decode(cborCorrect)
    const decoded_signed=cbor.decode(signedTx)
    decoded_complete.splice(1, 1, decoded_signed);
    const encoded_final=cbor.encode(decoded_complete)
    const output=buf2hex(encoded_final)
    const hash=await cardano.submitTx(output)
    alert("Tx submitted correctly hash:"+hash)

    }
    </script>
```
