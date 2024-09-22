import { env } from 'node:process'
import dotenv from "dotenv";
import { TonClient4, WalletContractV4, internal, toNano, Address, fromNano } from '@ton/ton'
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto'
import { DEX, pTON } from '@ston-fi/sdk'
import type { KeyPair } from '@ton/crypto'
import { Factory, MAINNET_FACTORY_ADDR, PoolType, Asset, ReadinessStatus, JettonRoot, JettonWallet, VaultJetton } from '@dedust/sdk'
// eslint-disable-next-line ts/no-require-imports
require('node:buffer')
dotenv.config()

// Create Client
const tonClient = new TonClient4({
  endpoint: "https://mainnet-v4.tonhubapi.com",
});
const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));



export async function testSell() {
  try {
    const JETTON = Address.parse('EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE');
    const TOKEN = Asset.jetton(JETTON);
    const TON = Asset.native();
    const jettonVault = tonClient.open(await factory.getJettonVault(JETTON));
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));
    const poolAddress = pool.address;
    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Pool (TON, SCALE) does not exist.");
    }
    if ((await jettonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Vault (TON) does not exist.");
    }
    const jettonRoot = tonClient.open(JettonRoot.createFromAddress(JETTON));
    let mnemonics = "summer pepper sting orient bachelor brave food scrap tennis hotel tribe image various bean until involve bar margin rhythm budget master fortune diet index";
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
    
    // Create wallet contract
    let workchain = 0; // Usually you need a workchain 0
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    const jettonContract = tonClient.open(await jettonRoot.getWallet(wallet.address));
    const contract = tonClient.open(wallet);
    const balance = await jettonContract.getBalance();
    const swap_ = Number(fromNano(balance));
    console.log("reca balance: ", swap_.toString())
    const sender = contract.sender(keyPair.secretKey)
    let amountIn = BigInt(Math.floor(Number(toNano(swap_ * 0.5))));
    console.log("swap amount: ", fromNano(amountIn));
    await jettonContract.sendTransfer(sender, toNano("0.3"), {
      amount: amountIn,
      destination: jettonVault.address,
      responseAddress: sender.address, // return gas to user
      forwardAmount: toNano("0.25"),
      forwardPayload: VaultJetton.createSwapPayload({ poolAddress }),
    });
  } catch (error) {
    console.log(error);
  }
}

export async function testSwap() {
  try {
    const JETTON = Address.parse('EQBwHOvf3UrPPJB7jeDHaOT-2vP0QQlDoEDBsgfv5XF75J3j');
    const TOKEN = Asset.jetton(JETTON);
    const TON = Asset.native();
    const tonVault = tonClient.open(await factory.getNativeVault());
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));
    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Pool (TON, SCALE) does not exist.");
    }
    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Vault (TON) does not exist.");
    }
    let mnemonics = "summer pepper sting orient bachelor brave food scrap tennis hotel tribe image various bean until involve bar margin rhythm budget master fortune diet index";
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
    
    // Create wallet contract
    let workchain = 0; // Usually you need a workchain 0
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey, walletId: 2 });
    const contract = tonClient.open(wallet);
    const balance = await contract.getBalance();
    const swap_ = Number(fromNano(balance));
    const sender = contract.sender(keyPair.secretKey)
    let amountIn = BigInt(Math.floor(Number(toNano(swap_ * 0.5))));
    if (swap_ > 0.25 / (1 - 0.5)) {
      await tonVault.sendSwap(sender, {
          poolAddress: pool.address,
          amount: amountIn,
          gasAmount: toNano("0.25"),
      });
    }
  } catch (error) {
    console.log(error);
  }
}

export async function isValidAddress(token: string) {
  try {
    const JETTON = Address.parse(token);
    const TOKEN = Asset.jetton(JETTON);
    const TON = Asset.native();
    const tonVault = tonClient.open(await factory.getNativeVault());
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));
    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      return false;
    }
    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Vault (TON) does not exist.");
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
  
}
export async function buyJetton(wallet: WalletContractV4, jettonAddress: string, buyPercent: number, key: KeyPair) {
  try {
    const JETTON = Address.parse(jettonAddress);
    const TOKEN = Asset.jetton(JETTON);
    const TON = Asset.native();
    const tonVault = tonClient.open(await factory.getNativeVault());
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));
    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Pool (TON, SCALE) does not exist.");
    }
    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Vault (TON) does not exist.");
    }
    const contract = tonClient.open(wallet);
    const balance = await contract.getBalance();
    const swap_ = Number(fromNano(balance));
    const sender = contract.sender(key.secretKey)
    let amountIn = BigInt(Math.floor(Number(toNano(swap_ - 0.5 ))));
    if (swap_ > 0.5) {
      await tonVault.sendSwap(sender, {
          poolAddress: pool.address,
          amount: amountIn,
          gasAmount: toNano("0.25"),
      });
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

export async function sellJetton(wallet: WalletContractV4, jettonAddress: string, buyPercent: number, key: KeyPair) {
  try {
    const JETTON = Address.parse(jettonAddress);
    const TOKEN = Asset.jetton(JETTON);
    const TON = Asset.native();
    const jettonVault = tonClient.open(await factory.getJettonVault(JETTON));
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));
    const poolAddress = pool.address;
    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Pool (TON, SCALE) does not exist.");
    }
    if ((await jettonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error("Vault (TON) does not exist.");
    }
    const jettonRoot = tonClient.open(JettonRoot.createFromAddress(JETTON));
    const jettonContract = tonClient.open(await jettonRoot.getWallet(wallet.address));
    const contract = tonClient.open(wallet);
    const balance = await jettonContract.getBalance();
    const swap_ = Number(fromNano(balance));
    const sender = contract.sender(key.secretKey);
    let amountIn = BigInt(Math.floor(Number(toNano(swap_ * buyPercent ))));
    await jettonContract.sendTransfer(sender, toNano("0.3"), {
      amount: amountIn,
      destination: jettonVault.address,
      responseAddress: sender.address, // return gas to user
      forwardAmount: toNano("0.25"),
      forwardPayload: VaultJetton.createSwapPayload({ poolAddress }),
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
  
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function buy_sell_start(mnemonic: string, length: number, jettonAddress: string, buyPercent: number, startId: number){
  try {
    const key = await mnemonicToPrivateKey(mnemonic.split(' '));
    
    for (let i = 0; i < length; i++) {
      const subwallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
        walletId: i + 1 + startId,
      });
      const result = await buyJetton(subwallet, jettonAddress, buyPercent, key);
      if(!result) return false;
      await sleep(20000);
    }

    for (let i = 0; i < length; i++) {
      const subwallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
        walletId: i + 1 + startId,
      });
      await sellJetton(subwallet, jettonAddress, 1, key);
      await sleep(20000);
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
  
}
