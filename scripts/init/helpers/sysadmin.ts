import { db } from "@/db/kysely/client";
import { hashPassword } from "@/lib/auth/password";
import * as readline from 'readline';
import { z } from "zod";

const emailSchema = z.email({ message: "Invalid email address." });
const usernameSchema = z.string().min(3, { message: "Username must be at least 3 characters long." });
const passwordSchema = z.string()
            .min(8, { message: "Password must be at least 8 characters long." })
            .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
            .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
            .regex(/[0-9]/, { message: "Password must contain at least one number." })
            .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

async function getEmail(): Promise<string> {
    while (true) {
        const email = await question("Enter your system admin email (<admin>@purplemaia.org): ");
        const parsed = emailSchema.safeParse(email);
        if (parsed.success) {
            return parsed.data;
        } else {
            console.log(`${parsed.error.issues.map(issue => issue.message).join(', ')}`);
        } 
    }
}

async function getUsername(): Promise<string> {
    while (true) {
        const username = await question("Enter your system admin username: ");
        const parsed = usernameSchema.safeParse(username);
        if (parsed.success) {
            return parsed.data;
        } else {
            console.log(`Invalid username: ${parsed.error.issues.map(issue => issue.message).join(', ')}`);
        }
    }
}

async function getPassword(): Promise<string> {
    while (true) {
        const password = await question("Enter your system admin password: ");
        const parsed = passwordSchema.safeParse(password);
        if (parsed.success) {
            return parsed.data;
        } else {
            console.log(`Invalid password: ${parsed.error.issues.map(issue => issue.message).join(', ')}`);
        }
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function question(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
    try {
        const email = await getEmail();
        const username = await getUsername();
        const password = await getPassword();        

        const pass_hash = await hashPassword(password);

        await db.insertInto('users').values({
            email: email,
            username: username,
            password_hash: pass_hash,
            system_role: 'sysadmin',
        }).execute();

        console.log('System admin created successfully. Please save your credentials securely.');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

createAdmin();