const fetch = require("node-fetch");
const { broadcast, waitForTx, setScript, invokeScript } = require("@unitoken/unitoken-transactions");
const { address, base58Encode, publicKey } = require("@unitoken/unitoken-crypto");
const fs = require("fs");
const {rpcCall} = require("./zcrypto/src/utils.js");



const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}




const seed = env.MNEMONIC;
const rpc = env.unitoken_RPC;
const chainId = env.unitoken_CHAINID;
const dApp = address(env.MNEMONIC, chainId);

const ridetpl = fs.readFileSync("ride/zunitoken.ride", {encoding:"utf8"});




const getVKSerialized = rpcCall("serializeVK");


(async () => {
  const ridescript = ridetpl
    .replace(`let depositVK=base58''`, `let depositVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Deposit_vk.json")}'`)
    .replace(`let withdrawalVK=base58''`, `let withdrawalVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Withdrawal_vk.json")}'`)
    .replace(`let transferVK=base58''`, `let transferVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Transfer_vk.json")}'`);


  let request = await fetch(`${env.unitoken_RPC}utils/script/compile`, { method: "POST", body: ridescript })
  const { script } = await request.json();

  let tx = setScript({ script, fee: 1400000, chainId}, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

  console.log(`Dapp is deployed with public key ${publicKey(seed)}. Specify DAPP property at .env file.`)

  process.exit();
})();