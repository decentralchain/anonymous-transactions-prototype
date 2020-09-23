# Anonymous transactions engine for unitoken blockchain

This is anonymous transaction engine, implemented for unitoken blockchain. This is prototype, so, the project is very experimental.

### Dependencies

`nodejs@11.15.0`

### unitoken node

The implementation works with modified unitoken node, supporting `groth16verify` function. The source code is at [https://github.com/snjax/unitoken/tree/feature/groth16verifier](https://github.com/snjax/unitoken/tree/feature/groth16verifier).

Current state of `.env` file is

```
unitoken_RPC=http://dev-node-aws-fr-2.unitokennodes.com:6869/
unitoken_CHAINID=D
DAPP=2rdJzzFcVeignvBhKyubsPjxM8WdEYyje573eaebEDM8
MNEMONIC=<your seed passphrase>
```

The dApp is deployed at address `3FQ19SGXg2gXcd1AvQAwaP6Sd35knEqggVm` at the moment.

### Faucet

Type `node faucet.js` to get 100 test unitoken for your address, corresponding to `MNEMONIC`.

### Cryptography

Anonymity is zkSNARK-driven, we use [circom](https://github.com/iden3/circom) and groth16 proving scheme at BN254. You may read more about the circuit at [circuit.md](circuit.md).

The client use Curve25519 to sign ordinary unitoken transactions and BabyJubJub to prove ownership of the assets inside the zkSNARK. For hashing we use Pedersen hash anywhere.

At current version anonimity set is not merkelized. Pedersen based merkle proofs use too much constraints for current circom version. We consider to use no MiMC hashes here. For futher versions of `circom` or for circuits implemented with `bellman` anonymity set may be expanded by several orders of magnitude.

We use utxo model for this solution. All utxo data is encrypted via receiver's public key on BabyJubJub curve.



### Functionality

#### Deposits

Deposits are signed by user's private key at Curve25519. Each deposited asset corresponds to utxo inside the dApp. The user can deposit the asset to any public key at BabyJubJub. So, the asset may be received instantly by another user without any additional transfers. The nullifier is computed from users's private key and salt, so, the sender can create the utxo, but, if he do not know the receiver's private key, he cannot compute the nullifier and track, when the asset is spent.

#### Transfers

We use 2to2 transfers. The transactions are not signed via any keys, we use custom transaction verifier here. The fee is payable inside the zkSNARK. Input utxos are mixed with the set of random utxos.

To get information about received utxos the user scans all messages and tries to decrypt them. If the message is decrypted successfully, the user can manage utxo, corresponding to this message.

#### Withdrawals

The transactions are not signed, the fee is payable inside the snark. The receiver address is specified inside the public input of the snark. Input utxo is mixed with the set of random utxos.




## Deploy

The first clone this repository via
```
git clone https://github.com/decentralchain/anonymous-transactions-prototype
```
After that install all npm packages
```
cd anonymous-transactions-prototype && npm i&& cd zksnark && npm i && cd .. && cd zcrypto && npm i && cd ..
```
Provide trusted setup of circuits

```
cd zksnark && npm run compile && npm run setup && cd ..
```

Specify `.env` file and deploy the contract to the blockchain

|   |   |
|---|---|
|unitoken_RPC|url of unitoken node|
|unitoken_CHAINID|chain id letter|
|MNEMONIC|seed passphrase|
|DAPP|dapp public key|

```
node deploy.js
```

Specify `DAPP` property at `.env` file.



## Client usage

Install all dependencies
```
npm i&& cd zksnark && npm i && cd .. && cd zcrypto && npm i && cd ..
```


`.env` file must be composite of following variables

|   |   |
|---|---|
|unitoken_RPC|url of unitoken node|
|unitoken_CHAINID|chain id letter|
|MNEMONIC|seed passphrase|
|DAPP|dapp public key|

Now `MNEMONIC` is the seed of current user account and `DAPP` is dApp account public key, obtained from `MNEMONIC` at Deploy stage. You may setup several client enviroments for different `MNEMONIC` and play with client using following commands:


```
nodejs cli.js <command> <options>
account details command
=============
    nodejs cli.js details <option>
    Print details of current seed (pubkey and address at unitoken, pubkey and
    private key at the DApp)
    Print anonymous and not anonymous balance
    -s or --seed <seed>

deposit command
=========================
    nodejs cli.js deposit <options>
    Deposit unitoken to the DApp.
    -s or --seed <seed>
      or
    --pub <pubkey>

    -b or --balance <balance>

withdrawal command
========================
    nodejs cli.js withdrawal <options>
    Withdraw unitoken to address
    -s or --seed <seed>
      or
    -a or --address <address>

    -b or --balance <balance>

transfer command
==============
    nodejs cli.js transfer <options>
    Transfer unitoken to another address.
    -s or --seed <seed>
     or
    --pub <pubkey>

    -b or --balance <balance>


Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

  ```

## TODO

* Multiparty trusted setup
* More powerful engines (further versions of `circom` or current version of `bellman`) for circuit and anonimity set merkelization (we are still not going to use MiMC here)
* Coinselect library for more optimized operations with assets