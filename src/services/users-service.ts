import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users, type NewUser } from "../db/schema";

export abstract class HttpError extends Error {
  abstract status: number;
}

export class NotFoundError extends HttpError {
  status = 404;
}

export class ConflictError extends HttpError {
  status = 409;
}

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export const usersService = {
  async list() {
    return db.select(publicColumns).from(users);
  },

  async getById(id: number) {
    const [user] = await db
      .select(publicColumns)
      .from(users)
      .where(eq(users.id, id));
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
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

  async register(data: Pick<NewUser, "name" | "email" | "password">) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email));
    if (existing) throw new ConflictError("Email sudah terdaftar");

    const hashed = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await db.insert(users).values({ ...data, password: hashed });

    return { data: "OK" };
  },
};
