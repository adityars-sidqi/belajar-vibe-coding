import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { users, type NewUser } from "../../db/schema";

export abstract class HttpError extends Error {
  abstract status: number;
}

export class NotFoundError extends HttpError {
  status = 404;
}

export const usersService = {
  async list() {
    return db.select().from(users);
  },

  async getById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  },

  async create(data: Pick<NewUser, "name" | "email">) {
    const result = await db.insert(users).values(data).$returningId();
    return this.getById(result[0].id);
  },

  async update(id: number, data: Partial<Pick<NewUser, "name" | "email">>) {
    await this.getById(id);
    await db.update(users).set(data).where(eq(users.id, id));
    return this.getById(id);
  },

  async remove(id: number) {
    await this.getById(id);
    await db.delete(users).where(eq(users.id, id));
    return { id };
  },
};
