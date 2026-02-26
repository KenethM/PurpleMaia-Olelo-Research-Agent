import { db } from "@/db/kysely/client";
import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import { NewMember, NewOrg, NewUser } from "@/types/db";
import { Role } from "@/db/types";

const orgID = randomUUID() as string;
const guestID = randomUUID() as string;
const memberID = randomUUID() as string;
const orgAdminID = randomUUID() as string;
const password = 'password123!';

const TEST_ACCOUNTS: NewUser[] = [
    {
        id: guestID,
        username: "jdoe",
        email: "john.doe@example.com",
        password_hash: "",
    },
    {
        id: memberID,
        username: "jsmith",
        email: "jane.smith@example.com",
        password_hash: "",

    },
    {
        id: orgAdminID,
        username: "ajohnson",
        email: "alice.johnson@example.com",
        password_hash: "",
    }
];

const TEST_ORG: NewOrg = {
    id: orgID,
    name: "Test Organization",
    slug: "test",
};

const MEMBERS: NewMember[] = [
    {
        id: randomUUID() as string,
        user_id: memberID,
        org_id: orgID,
        user_role: "member" as Role,
    },
    {
        id: randomUUID() as string,
        user_id: orgAdminID,
        org_id: orgID,
        user_role: "admin" as Role,
    }
];

async function seed() {

    // Hash passwords for test accounts
    console.log("Hashing passwords for test accounts...");
    for (const account of TEST_ACCOUNTS) {
        account.password_hash = await hashPassword(password);
    }

    // Insert test accounts
    console.log("Seeding test accounts...");
    await db.insertInto("users").values(TEST_ACCOUNTS).execute();
        
    // Insert test organization
    console.log("Seeding test organization...");
    await db.insertInto("orgs").values(TEST_ORG).execute();

    // Insert members
    console.log("Seeding organization members...");
    await db.insertInto("members").values(MEMBERS).execute();    
}

seed().catch((error) => {
    console.error("Error seeding test data:", error);
}).finally(async () => {
    await db.destroy();
});
