import { NextFunction } from "grammy";
import { MyContext } from "../types";
import { findOrCreateUser, upgradeMainWallet } from "../../models/User";
import { createWallet } from "../../utils/wallet";

export default async function attachUser(ctx: MyContext, next: NextFunction) {
	if (!ctx.from) {
		throw new Error("No from field found");
	}
	const user = await findOrCreateUser(ctx.from.id);
	if (!user) {
		throw new Error("User not found");
	}

	ctx.session.dbuser = user;
	if(!user.walletAddr){
		const newWallet = await createWallet()
		if(newWallet != null){
			const userWithWallet = await upgradeMainWallet(user.id, newWallet?.address, newWallet?.mnemonic);
			ctx.session.dbuser = userWithWallet;
		}
		
	}
	
	return next();
}
