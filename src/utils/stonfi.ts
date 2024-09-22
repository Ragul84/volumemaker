import { Address, TonClient, WalletContractV4, fromNano, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey, KeyPair } from "@ton/crypto";
import { pTON, DEX } from "@ston-fi/sdk";
import dotenv from "dotenv";
import { env } from "node:process";
import { StonApiClient } from "@ston-fi/api";
import { sleep } from "./dex";

dotenv.config()

const stonApiClient = new StonApiClient();
const apiKey = env["API_KEY"];
// const apiKey = env["TEST_API_KEY"];
const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: apiKey
});

const dex = client.open(new DEX.v1.Router());


export async function testOnStonfi() {
    const poolAddress = await dex.getPoolAddressByJettonMinters({
        token1: 'EQBwHOvf3UrPPJB7jeDHaOT-2vP0QQlDoEDBsgfv5XF75J3j', 
        token0: 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'
    });
    console.log("pollAddress: ", poolAddress);
}



export async function buyJettonOnStonfi(wallet: WalletContractV4, jettonAddress: string, keyPair: KeyPair) {
    try {
        const contract = client.open(wallet);
        const balance = await contract.getBalance();
        const swap_ = Number(fromNano(balance));
        let amountIn = BigInt(Math.floor(Number(toNano(swap_ - 0.5 ))));
        if(swap_ > 0.5) {
            const txArgs = {
                userWalletAddress: wallet.address.toString(), // ! replace with your address
                proxyTon: new pTON.v1(),
                offerAmount: amountIn,
                askJettonAddress: jettonAddress, // jetton address
                minAskAmount: '1',
            }
    
            // you can instantly send the transaction using the router method with send suffix
            await dex.sendSwapTonToJetton(contract.sender(keyPair.secretKey), txArgs);
            return true;
        }
        else {
            return false;
        }
        
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function sellJettonOnStonfi(wallet: WalletContractV4, jettonAddress: string, keyPair: KeyPair) {
    const contract = client.open(wallet);
    const tonBalance = await contract.getBalance();
    const jettonAsset = await stonApiClient.getWalletAsset({walletAddress: wallet.address.toString(), assetAddress: jettonAddress});
    const jettonBalance = jettonAsset.balance? jettonAsset.balance : '0';
    if(Number(jettonBalance) > 0 && Number(fromNano(tonBalance)) > 0.3) {
        const txArgs = {
            userWalletAddress: wallet.address.toString(), // ! replace with your address
            offerJettonAddress: jettonAddress, // jetton address
            offerAmount: jettonBalance,
            proxyTon: new pTON.v1(),
            minAskAmount: '1',
        }
    
      // you can instantly send the transaction using the router method with send suffix
        await dex.sendSwapJettonToTon(contract.sender(keyPair.secretKey), txArgs);
        return true;
    }
    else {
        return false;
    }

}

export async function isValidAddressOnStonfi(token: string){
    try {
        const poolAddress = await dex.getPoolAddressByJettonMinters({
            token1: token, 
            token0: 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'
        });
        if(poolAddress) return true;
        else return false;
    } catch (error) {
        return false
    }
    
}

export async function buy_sell_startOnStonfi(mnemonic: string, length: number, jettonAddress: string, startId: number) {
    try {
        const key = await mnemonicToPrivateKey(mnemonic.split(' '));
        
        for (let i = 0; i < length; i++) {
          const subwallet = WalletContractV4.create({
            workchain: 0,
            publicKey: key.publicKey,
            walletId: i + 1 + startId,
          });
          const result = await buyJettonOnStonfi(subwallet, jettonAddress, key);
          if(!result) return false;
          await sleep(10000);
        }
    
        for (let i = 0; i < length; i++) {
          const subwallet = WalletContractV4.create({
            workchain: 0,
            publicKey: key.publicKey,
            walletId: i + 1 + startId,
          });
          await sellJettonOnStonfi(subwallet, jettonAddress, key);
          await sleep(1000);
        }
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
}