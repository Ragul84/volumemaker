import { Schema, model } from "mongoose";


export interface ISubscription {
	userId: number;
	startDate: Date;
	endDate: Date;
	operationDone: number;
	active: boolean;
    exchange: string;
}


const subscriptionSchema = new Schema<ISubscription>({
	userId: {
		type: Number,
		required: true,
	},
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true
    },
    operationDone: {
        type: Number,
        required: true,
        default: 0
    },
    active: {
        type: Boolean,
        required: true,
    },
    exchange: {
        type: String,
        required: true,
    }
});

const Subscription = model<ISubscription>("Subscriptions", subscriptionSchema);

export async function isSubscriptionActive(userId: number): Promise<boolean> {
    const subscription = await Subscription.findOne({ userId, active: true });
    if (!subscription) return false;

    return subscription.endDate > new Date();
}

export async function getSubscription(userId: number) {
    const subscription = await Subscription.findOne({userId});
    if(!subscription) return false;
    return true;
}
  
export async function incrementOperationsDone(userId: number) {
    await Subscription.updateOne(
        { userId, active: true },
        { $inc: { operationsDone: 1 } }
    );
}
  
export async function checkSubscriptionValidity() {
    const now = new Date();
    await Subscription.updateMany(
        { endDate: { $lt: now }, active: true },
        { $set: { active: false } }
    );
}

export async function deleteSubscription(userId: number) {
    await Subscription.findOneAndDelete({userId});
}

export async function getSubscriptions() {
    try {
        const subscriptions = await Subscription.find({active: true});
        return subscriptions;
    } catch (error) {
        return [];
    }
    
}

export async function insertSubscription(subscription: ISubscription) {
    const newSubscription = new Subscription(subscription);
    newSubscription.save();
}
