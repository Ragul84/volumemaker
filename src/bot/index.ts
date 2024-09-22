import { Bot, session, InlineKeyboard } from "grammy";
import { env } from "node:process";
import { MyContext, Session } from "./types";
import { I18n } from "@grammyjs/i18n";
import { generateUpdateMiddleware } from "telegraf-middleware-console-time";
import dotenv from "dotenv";
import attachUser from "./middlewares/attachUser";
import { ignoreOld, sequentialize } from "grammy-middlewares";
import { bot as menu } from "./menu";
import configureI18n from "./middlewares/configure-i18n";
import { conversations } from '@grammyjs/conversations';
import { createWallet, get_Balance, importWallet } from "../utils/wallet";
import { findOrCreateUser, getKeypair, getSubwallet, getWalletAddr } from "../models/User";
import { buy_sell_start, isValidAddress, sleep } from "../utils/dex";
import { deleteSubscription, getSubscription, getSubscriptions, insertSubscription, ISubscription } from '../models/Subscription';
import { buy_sell_startOnStonfi } from "../utils/stonfi";

dotenv.config();
const token = env["BOT_TOKEN"];
if (!token) {
	throw new Error(
		"You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)"
	);
}



const baseBot = new Bot<MyContext>(token);
if (env["NODE_ENV"] !== "production") {
	baseBot.use(generateUpdateMiddleware());
}
export const i18n = new I18n({
	defaultLocale: "en",
	useSession: true,
	directory: "locales",
});
const initialSession: Session = {};
baseBot.use(i18n);

baseBot.use(ignoreOld());
baseBot.use(sequentialize());
baseBot.use(
	session<Session, MyContext>({
		initial: (): Session => initialSession,
	})
);
baseBot.use(attachUser);
// baseBot.use(configureI18n);



baseBot.use(menu);
export async function start(): Promise<void> {
	// The commands you set here will be shown as /commands like /start or /magic in your telegram client.
	await baseBot.api.setMyCommands([
		{ command: "start", description: "Start the bot" },
		// { command: "help", description: "Show help" },
		// { command: "settings", description: "Show settings" },
	]);

	await baseBot.start({
		onStart(botInfo) {
			console.log(new Date(), "Bot starts as", botInfo.username);
		},
	});
}

export async function scheduleTask() {
	const subscriptions = await getSubscriptions();
	console.log(subscriptions);
	for (const subscription of subscriptions){
		const currentDate = new Date();
		if(subscription.endDate > currentDate){
			const userId = subscription.userId;
			const user = await findOrCreateUser(userId);
			const walletLen = await getSubwallet(userId);
			const mode = subscription.exchange;
			for (let i = 0; i < 25; i++) {
				const result = mode != 'stonfi'? await buy_sell_start(user.secretKey, 10, user.token, 1, walletLen - 10) : await buy_sell_startOnStonfi(user.secretKey, 10, user.token, walletLen - 10);
				await sleep(100000);
				if(!result) break;
			}
			
		}
		else {
			await deleteSubscription(subscription.userId);
			await baseBot.api.sendMessage(subscription.userId, "Your subscription is finished");
		}
		
	}
}
