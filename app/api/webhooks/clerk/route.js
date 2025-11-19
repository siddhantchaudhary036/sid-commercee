import { Webhook } from "svix";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error: Missing svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error: Verification failed", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
        const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

        try {
            await convex.mutation("users:createUser", {
                clerkId: id,
                email: email_addresses[0].email_address,
                firstName: first_name || undefined,
                lastName: last_name || undefined,
                imageUrl: image_url || undefined,
                username: username || undefined,
            });
        } catch (error) {
            console.error("Error creating user in Convex:", error);
            return new Response("Error: Failed to create user", { status: 500 });
        }
    }

    if (eventType === "user.updated") {
        const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

        try {
            await convex.mutation("users:updateUser", {
                clerkId: id,
                email: email_addresses[0].email_address,
                firstName: first_name || undefined,
                lastName: last_name || undefined,
                imageUrl: image_url || undefined,
                username: username || undefined,
            });
        } catch (error) {
            console.error("Error updating user in Convex:", error);
            return new Response("Error: Failed to update user", { status: 500 });
        }
    }

    if (eventType === "user.deleted") {
        const { id } = evt.data;

        try {
            await convex.mutation("users:deleteUser", {
                clerkId: id,
            });
        } catch (error) {
            console.error("Error deleting user in Convex:", error);
            return new Response("Error: Failed to delete user", { status: 500 });
        }
    }

    return new Response("Webhook processed successfully", { status: 200 });
}
