import { Composer, InlineKeyboard } from 'grammy';
import { MyContext } from '../../types';

import { env } from 'node:process';

import dotenv from 'dotenv';
import { buy_sell_start, isValidAddress, testSell, testSwap } from '../../../utils/dex';
import { createAndActivateSubwallet, get_Balance, testActivateWallet } from '../../../utils/wallet';
import { getSubwallet, upgradetoken } from '../../../models/User';
import { deleteSubscription, getSubscription, getSubscriptions, insertSubscription, ISubscription } from '../../../models/Subscription';
import { isValidAddressOnStonfi, testOnStonfi } from '../../../utils/stonfi';
import { start } from '../..';

dotenv.config();
export const bot = new Composer<MyContext>();

async function startMessage(ctx: MyContext) {
	console.log("start");
	ctx.session.page = 0;
	const keyboard = new InlineKeyboard()
	.text("🌟 TON_VolumeBot", "volume_bot").row();
	// .text("TEST", "test").row();
	// .text("🔑 Generate Wallet", "generate_wallet").text("🔐 Import Wallet", "import_wallet").row()
	// .text("👝 Wallet Info", "wallet_info").text("🏦 Token:Pool", "token_pool").row()
	// .text("👝 Start Buy/Sell", "buy_sell_start").text("🏦 Stop Buy/Sell", "buy_sell_stop").row();

	// Send a welcome message with the inline keyboard
	await ctx.reply(
		`Welcome to TON_VolumeBot.`,
		{ reply_markup: keyboard }
	);
}
bot.command('start', startMessage);

bot.callbackQuery('test', async (ctx: MyContext) => {
    await testActivateWallet();
})

bot.callbackQuery('volume_bot', async (ctx: MyContext) => {
    ctx.session.page = 1;
    await ctx.deleteMessage();
	const userId = ctx.from?.id;

	if (!userId) {
		ctx.reply('Error: Unable to retrieve user information.');
		return;
	}
	const subscription = await getSubscription(userId);
	if(subscription) {
		ctx.reply("You are already subscribed");
		return;
	}
    const keyboard = new InlineKeyboard()
    .text("Stonfi", "stonfi").row()
    .text("Dedust","dedust").row();
    await ctx.reply("TON Volume Bot selected!", {reply_markup: keyboard});
});

bot.callbackQuery("stonfi", async (ctx: MyContext) => {

	try {
        await ctx.deleteMessage();
		ctx.session.mode = 1;
		ctx.session.page = 2;
		await ctx.reply("Please send a token address for volume market making.", { reply_markup: new InlineKeyboard().text("👈 Return", "return").row() });
	} catch (error) {
		await ctx.reply("Selection of the mode-6h is failed")
	}
});

bot.callbackQuery("dedust", async (ctx: MyContext) => {

	try {
        await ctx.deleteMessage();
		ctx.session.mode = 2;
		ctx.session.page = 2;
		await ctx.reply("Please send a token address for volume market making.", { reply_markup: new InlineKeyboard().text("👈 Return", "return").row() });
	} catch (error) {
		await ctx.reply("Selection of the mode-24h is failed");
	}
});

bot.callbackQuery("return", async (ctx: MyContext) => {

	try {
		ctx.session.page = 0;
        await ctx.deleteMessage();
	} catch (error) {
		await ctx.reply("Try again, please");
	}
});

bot.on(":text", async (ctx: MyContext) => {
	try {
		if(ctx.session.page == 2){
			const exchange = ctx.session.mode == 1 ? 'Stonfi' : 'Dedust';
            await ctx.reply("Please wait while we check for the pool on " + exchange + "...");
			const tokenAddr = ctx.message?.text;
			if(!tokenAddr){
				await ctx.reply("Please send a valid token address");
				return;
			}
			ctx.session.token = tokenAddr;
			const isValid = ctx.session.mode == 1? await isValidAddressOnStonfi(tokenAddr) : await isValidAddress(tokenAddr);
			if(isValid){
				const userId = ctx.message.from.id;
				await upgradetoken(userId, tokenAddr);
				ctx.session.page = 3;
				const keyboard = new InlineKeyboard()
					.text("Starter Boost ↗️ 100 TON", "starter").row()
					.text("Growth Accelerator 📈 250 TON", "growth").row()
					.text("Alpha Dominace 🔥 500 TON", "dominance").row()
					.text("Ecosystem Pioneer 🚀 1000 TON", "pioneer").row();
				await ctx.reply(`🚀 Choose the desired Volume Boosting package for: ${ctx.session.token}`, {reply_markup: keyboard })
			} else {
				await ctx.reply("Please send a valid token address");
			}
		} else {
			await ctx.reply("Please start again");
		}
	} catch (error) {
		
	}
});

bot.callbackQuery("starter", async (ctx: MyContext) => {
	try {
        ctx.deleteMessage();
		ctx.session.amount = 100;
		ctx.session.page = 4;
		const keyboard = new InlineKeyboard()
    		.text("Activate and Start", "start_volume").row();
		await ctx.reply(`You are almost ready to start volume boost. Here is your order summary\n\n <b>${ctx.session.amount} TON</b>\n\n To activate the bot, please send ${ctx.session.amount} TON to this address 
			<code>${ctx.session.dbuser?.walletAddr}</code>`, { parse_mode:'HTML', reply_markup: keyboard });
	} catch (error) {
		await ctx.reply("Try again please");
	}
});

bot.callbackQuery("growth", async (ctx: MyContext) => {
	try {
        await ctx.deleteMessage();
		ctx.session.amount = 250;
		ctx.session.page = 4;
		const keyboard = new InlineKeyboard()
    		.text("Activate and Start", "start_volume").row();
		await ctx.reply(`You are almost ready to start volume boost. Here is your order summary\n\n <b>${ctx.session.amount} TON</b>\n\n To activate the bot, please send ${ctx.session.amount} TON to this address 
			<code>${ctx.session.dbuser?.walletAddr}</code>`, {parse_mode:'HTML', reply_markup: keyboard});
	} catch (error) {
		ctx.reply("Try again please");
	}
});

bot.callbackQuery("dominance", async (ctx: MyContext) => {
	try {
        ctx.deleteMessage();
		ctx.session.amount = 500;
		ctx.session.page = 4;
		const keyboard = new InlineKeyboard()
    		.text("Activate and Start", "start_volume").row();
		ctx.reply(`You are almost ready to start volume boost. Here is your order summary\n\n <b>${ctx.session.amount} TON</b>\n\n To activate the bot, please send ${ctx.session.amount} TON to this address 
			<code>${ctx.session.dbuser?.walletAddr}</code>`, {parse_mode:'HTML', reply_markup: keyboard});
	} catch (error) {
		ctx.reply("Try again please");
	}
});

bot.callbackQuery("pioneer", async (ctx: MyContext) => {
	try {
        ctx.deleteMessage();
		ctx.session.amount = 1000;
		ctx.session.page = 4;
		const keyboard = new InlineKeyboard()
    		.text("Activate and Start", "start_volume").row();
		ctx.reply(`You are almost ready to start volume boost. Here is your order summary\n\n <b>${ctx.session.amount} TON</b>\n\n To activate the bot, please send ${ctx.session.amount} TON to this address 
			<code>${ctx.session.dbuser?.walletAddr}</code>`, {parse_mode:'HTML', reply_markup: keyboard});
	} catch (error) {
		ctx.reply("Try again please");
	}
});

bot.callbackQuery('start_volume', async (ctx: MyContext) => {
	try {
		if(ctx.session.page != 4){
			await ctx.reply("Please choose the right settings");
		} else {
			await ctx.deleteMessage();
			const walletAddr = ctx.session.dbuser?.walletAddr?  ctx.session.dbuser?.walletAddr : " ";
			const balance = await get_Balance(walletAddr);
			console.log(walletAddr);
			const amount = ctx.session.amount != undefined? ctx.session.amount : 0;
			if(balance != null && balance < amount){
				await ctx.reply(`You need to deposit ${amount} TON to start`);
			} else if(balance == null ){
				await ctx.reply("try again please.");
			} else {
				ctx.session.page = 5;
				await ctx.answerCallbackQuery(); 
				await ctx.reply("Starting buy operation...");
				const length = 10;
				const userId = ctx.from?.id ? ctx.from.id : 7314466396;
				const startId = await getSubwallet(userId);
				const secretKey = ctx.session.dbuser?.secretKey? ctx.session.dbuser.secretKey: " ";
				await createAndActivateSubwallet(secretKey, length, userId, startId);
				// Set an interval to perform the buy operation periodically
				// const intervalId = setInterval(async () => {
				// 	const elapsedTime = Date.now() - startTime;
				// 	if (elapsedTime >= duration) {
				// 		clearInterval(intervalId);
				// 		await ctx.reply("Buy/Sell operation completed.");
				// 		return;
				// 	}
				// 	await buy_sell_start(secretKey, length,token, 0.25, startId);
				// }, interval);
				const startDate = new Date();
				let endDate = new Date();
				const exchange = ctx.session.mode == 1? 'stonfi' : 'dedust';
				switch (ctx.session.amount) {
					case 100:
						endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
						break;
					case 250:
						endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
						break;
					case 500:
						endDate = new Date(Date.now() + 22 * 24 * 60 * 60 * 1000);
						break;
					case 1000:
						endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
						break;
					default:
						break;
				}
				const newSubscription: ISubscription = {
					userId,
					startDate,
					endDate,
					operationDone: 0,
					active: true,
					exchange
				};
				await insertSubscription(newSubscription);
			}
		}
	} catch (error) {
		
	}
})

// async function start_volumneBot(ctx: MyContext) {
// 	try {
// 		const length = env["LENGTH"];
// 		ctx.reply(`Starting volume bot for ${ctx.session.mode} hours.`);
// 		if(ctx.session.dbuser?.secretKey && ctx.session.mode && ctx.session.dbuser.secretKey != undefined){
// 				const intervalId = setInterval(async () => {
// 				await buy_sell_start(ctx.session.dbuser?.secretKey, length, ctx.session.token, 0.25);
// 			}, 10000);
		
// 			setTimeout(() => {
// 				clearInterval(intervalId);
// 				ctx.reply("volume boost is finished.")
// 			}, ctx.session.mode * 3600 * 1000);
// 		}
		
// 	} catch (error) {
		
// 	}
// }


// bot.callbackQuery("wallet_info", async (ctx: MyContext) => {

// 	try {
// 		const id = ctx.callbackQuery.from.id;
// 		const walletAddr = await getWalletAddr(id);
// 		const mnemonic = await getKeypair(id);
// 		if(walletAddr) {
// 			const balance = await get_Balance(walletAddr);
// 			await ctx.reply(`Wallet: <code>${walletAddr}</code><br> mnemonic: <code>${mnemonic}</code><br> Balance: ${balance} Ton`);
// 		}
// 		else {
// 			await ctx.reply("There is no wallet for you. Please create new wallet or import existing wallet.")
// 		}
// 	} catch (error) {
// 		await ctx.reply(`😢 Sorry, there was some errors on the command. Please try again later 😉`)
// 	}
// });



// bot.command('address', async (ctx) => {
//   try {
//     await enterAddressQuestion.replyWithMarkdownV2(ctx, '➡️ Enter your TON address');
//   } catch (e) {}
// });
