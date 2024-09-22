import { Schema, model } from "mongoose";


export interface IWallet {
	address: string;
	subwalletId: number;
}
export interface IUser {
	id: number;
	language: string;
	token: string;
	subwallets: IWallet[];
	walletAddr: string;
	secretKey: string;
}

const WalletSchema: Schema<IWallet> = new Schema({
	address: { type: String, required: true },
	subwalletId: { type: Number, required: true },
  });

const userSchema = new Schema<IUser>({
	id: {
		type: Number,
		required: true,
	},
	language: {
		type: String,
		required: true,
		default: "en",
	},
	token: {
		type: String,
		required: false,
	},
	walletAddr: {
		type: String,
		required: false,
	},
	secretKey: {
		type: String,
		required: false,
	},
	subwallets: { type: [WalletSchema], default: []}
});

const User = model<IUser>("User", userSchema);

export async function findOrCreateUser(id: number) {
	return await User.findOneAndUpdate(
		{ id },
		{},
		{
			upsert: true,
			new: true,
		}
	);
}
export async function changeLanguage(id: number, language: string) {
	return await User.findOneAndUpdate(
		{ id },
		{ language },
		{
			upsert: true,
			new: true,
		}
	);
}

export async function insertSubWallet(id: number, newWallet:IWallet) {
	return await User.findOneAndUpdate(
		{ id },
		{ $push: { subwallets: newWallet } },
		{ new: true }
	);
}

export async function upgradetoken(id: number, token: string ) {
	return await User.findOneAndUpdate(
		{ id },
		{ token },
		{
			upsert: true,
			new: true,
		}
	);
}

export async function upgradeMainWallet(id: number, walletAddr: string, secretKey: string ) {
	return await User.findOneAndUpdate(
		{ id },
		{ walletAddr, secretKey },
		{
			upsert: true,
			new: true,
		}
	);
}

export async function getWalletAddr(id: number) {
	const user = await User.findOne({ id });
	return user?.walletAddr;
}

export async function getSubwallet(id: number) {
	const user = await User.findOne({ id });
	if(user?.subwallets) {
		return user.subwallets.length;
	} else {
		return 0;
	}
}

export async function getKeypair(id: number) {
	const user = await User.findOne({ id });
	return user?.secretKey;
}

export async function getToken(id: number) {
	const user = await User.findOne({ id });
	return user?.token;
}
