# Anonymous transactions on wavesplatform

## State

Anonymous assets are Pedersen hashes of UTXO objects with the following structure:

```
struct utxo {
   balance:uint64
   secret:uint160
   owner:uint208
   salt:uint80 
}
```

Hashes are computed at bn254 curve and presented inside dataset of dApp at Waves blockchain in mapping `hash("U"+utxo) => {true|false}`

Secrets are special codes, allowing us to spend UTXOs. If we spend the UTXO, we do not publish, which utxo is spent, but we publish the secret of spent UTXO at the blockchain. To protect from frontrun attack we need to keep separate independet set of spent secrets for each user (in mapping `hash("S"+sender+secret) => {true|false}`).

When we publish transfer or withdrawal, we need to check, that all affected UTXOs belong to sender and the secrets are not spent.

## Actions

Transfers and withdrawals are callable from self dapp, but the user must to create ephemeral key to sign the message. 

Deposits are usual invokeScript transactions.

### Deposit

![deposit](https://raw.githubusercontent.com/snjax/drawio/master/deposit.svg?sanitize=true)

#### zkSNARK
```
# public:
#   hash     256
#   balance   64
# private:
#   owner    208
#   secret   160
#   salt      80
```

#### Ride
```
func deposit(proof:ByteVector, v:ByteVector)
```
```
    let hash= take(v, 32)
```

### Transfer

![transfer](https://raw.githubusercontent.com/snjax/drawio/master/transfer.svg?sanitize=true)

#### zkSNARK

```
# Transfer input structure
# public:
#   in_hashes[8]       256
#   out_hashes[2]      256
#   in_secrets[2]      160
#   owner              208
# private:
#   in_selectors[2][8]
#   in_balances[2]      64
#   in_salts[2]         80
#   out_balance[2]      64
#   out_secrets[2]     160
#   out_salt[2]         80
#   out_owner[2]       208
```

#### Ride
```
func transfer(msg:ByteVector, sig:ByteVector, pub:ByteVector) 
```
```
    let proof = take(msg, 256);
    let v = takeRight(msg, 320);
    let uk0 = getUtxoKey(takeLR(v, 0, 32))
    let uk1 = getUtxoKey(takeLR(v, 32, 64))
    let uk2 = getUtxoKey(takeLR(v, 64, 96))
    let uk3 = getUtxoKey(takeLR(v, 96, 128))
    let uk4 = getUtxoKey(takeLR(v, 128, 160))
    let uk5 = getUtxoKey(takeLR(v, 160, 192))
    let uk6 = getUtxoKey(takeLR(v, 192, 224))
    let uk7 = getUtxoKey(takeLR(v, 224, 256))
    let ouk0 = getUtxoKey(takeLR(v, 256, 288))
    let ouk1 = getUtxoKey(takeLR(v, 288, 320))
```

### Withdrawal

![withdrawal](https://raw.githubusercontent.com/snjax/drawio/master/withdrawal.svg?sanitize=true)

#### zkSNARK
```
# public:
#   hash     256
#   balance   64
#   secret   160
#   owner    208
# private:
#   salt      80
```

#### Ride
```
func withdrawal(msg:ByteVector, sig:ByteVector, pub:ByteVector) 
```
```
    let proof = take(msg, 256);
    let v = takeRight(msg, 96);
    let hash = take(v, 32)
    let balance = toInt(v, 32 + 3*8)
    let secret = takeLR(v, 64, 96)
```



## UX

The solution is the DApp, deployed on Waves blockchain.

1. The first, user deposit assets to the smart contract.
2. After that the user may make an anonymous transfer with his asset, using ephemeral private keys. A transaction sender is a smart contract, that's why the user can use uninitialized private keys.
3. Also, the user must publish encrypted data of the transaction's outputs for somebody who receives the assets.
4. The user can scan blockchain, find his assets and withdraw his assets by publishing the zkSNARK proof to the blockchain

