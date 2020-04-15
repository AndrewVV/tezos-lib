const { TezosWalletUtil, TezosNodeWriter, StoreType, setLogLevel, TezosParameterFormat } = require('conseiljs');

setLogLevel('debug');

const tezosNode = 'https://tezos-dev.cryptonomic-infra.tech:443';
const conseilServer = { url: 'https://conseil-dev.cryptonomic-infra.tech:443', apiKey: 'BUIDLonTezos-001' };

let keystore = {
    publicKey: 'edpkuePyiCxXTyd7qUoJUoFwKpLVEgmKtPGd8o8h7qR3Rm3LsrZ2Cs',
    privateKey: 'edskRnpmsQtuoHoBsmae5Sv8HvbrnrmpvwZKk4XtdCTRa53PiiX5yrD9Rgper9BeyMvV6kJRpAYp3rpMfbm1TEFh7quPsyeerj',
    publicKeyHash: 'tz1gPXSTrWQ4gy3yb1YZ4SbvWjtzrC6eWnfT',
    seed: '',
    storeType: StoreType.Fundraiser
};

const alphanetFaucetAccount = {
    "mnemonic": [ "critic", "fan", "elevator", "magnet", "core", "off", "guard", "cook", "cinnamon", "pig", "deputy", "rug", "satisfy", "argue", "begin" ],
    "secret": "d88d6e0bfff12414018ad87d998d5f7dbcb72b0b",
    "amount": "45901498971",
    "pkh": "tz1gPXSTrWQ4gy3yb1YZ4SbvWjtzrC6eWnfT",
    "password": "n601XwJyxG",
    "email": "pvbbtcgx.eoddpuyr@tezos.example.org"
  }

async function initAccount() {
    keystore = await TezosWalletUtil.unlockFundraiserIdentity(alphanetFaucetAccount.mnemonic.join(' '), alphanetFaucetAccount.email, alphanetFaucetAccount.password, alphanetFaucetAccount.pkh);
    console.log(`public key: ${keystore.publicKey}`);
    console.log(`secret key: ${keystore.privateKey}`);
    console.log(`account hash: ${keystore.publicKeyHash}`);
}

async function activateAccount() {
    const result = await TezosNodeWriter.sendIdentityActivationOperation(tezosNode, keystore, alphanetFaucetAccount.secret, '');
    console.log(`Injected operation group id ${result.operationGroupID}`)
}

async function revealAccount() {
    const result = await TezosNodeWriter.sendKeyRevealOperation(tezosNode, keystore);
    console.log(`Injected operation group id ${result.operationGroupID}`);
}

async function sendTransaction() {
    const result = await TezosNodeWriter.sendTransactionOperation(tezosNode, keystore, 'tz1R92cy5hs6ATDv1acjbwpMiShmy2a9s4BP', 500000000, 1500, '');
    console.log(`Injected operation group id ${result.operationGroupID}`);
}

async function originateAccount() {
    const result = await TezosNodeWriter.sendAccountOriginationOperation(tezosNode, keystore, 100000000, 'tz1R92cy5hs6ATDv1acjbwpMiShmy2a9s4BP', true, true, 10000, '');
    console.log(`Injected operation group id ${result.operationGroupID}`);
}

async function deployContract() {
    const contract = `[
        {
           "prim":"parameter",
           "args":[ { "prim":"string" } ]
        },
        {
           "prim":"storage",
           "args":[ { "prim":"string" } ]
        },
        {
           "prim":"code",
           "args":[
              [  
                 { "prim":"CAR" },
                 { "prim":"NIL", "args":[ { "prim":"operation" } ] },
                 { "prim":"PAIR" }
              ]
           ]
        }
     ]`;
    const storage = '{"string": "Sample"}';

    const nodeResult = await TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, false, true, 100000, '', 1000, 100000, contract, storage, TezosParameterFormat.Micheline);
    const groupid = nodeResult['operationGroupID'].replace(/\"/g, '').replace(/\n/, ''); // clean up RPC output
    console.log(`Injected operation group id ${groupid}`);
    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, 'alphanet', groupid, 5);
    console.log(`Originated contract at ${conseilResult[0].originated_accounts}`);
}

async function deployMichelsonContract() {
    const contract = `parameter string;
        storage string;
        code { DUP;
            DIP { CDR ; NIL string ; SWAP ; CONS } ;
            CAR ; CONS ;
            CONCAT;
            NIL operation; PAIR}`;
    const storage = '"Sample"';

    const result = await TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, false, true, 100000, '', 1000, 100000, contract, storage, TezosParameterFormat.Michelson);
    console.log(`Injected operation group id ${result.operationGroupID}`);
}

async function invokeContract() {
    const contractAddress = 'KT1MtZ2GJp8qxAhrjq5ppgmyFBTRRWZPodJa';
    const result = await TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, contractAddress, 10000, 1000000, '', 1000, 100000, '"Cryptonomicon"', TezosParameterFormat.Michelson);
    console.log(`Injected operation group id ${result.operationGroupID}`);
}


async function deploySmartPyContract() {
    const contract = `
    parameter string;
    
    storage string;
    
    code
      {
        # Entry point: setPhrase # pair(params, storage)
        # self.data.phrase = params.newPhrase # pair(params, storage)
        DUP;        # pair(params, storage).pair(params, storage)
        CAR;        # params.pair(params, storage)
        SWAP;       # pair(params, storage).storage
        DROP;       # storage
        NIL operation; # operations.storage
        PAIR;       # pair(operations, storage)
      } # pair(operations, storage);`;
    const storage = '"Hello World"';

    const result = await TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, false, true, 100000, '', 1000, 100000, contract, storage, TezosParameterFormat.Michelson);
    console.log(`Injected operation group id ${result.operationGroupID}`);
}

async function run() {
    // await initAccount();
    // await activateAccount();
    // await revealAccount();
    // await sendTransaction();
    // await originateAccount();
    //await deployContract();
    //await deployMichelsonContract();
    // await deploySmartPyContract();
    //await invokeContract();
}

run();