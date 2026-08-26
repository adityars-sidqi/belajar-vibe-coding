import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { sessions, users, type NewUser } from "../db/schema";

export abstract class HttpError extends Error {
  abstract status: number;
}

export class NotFoundError extends HttpError {
  status = 404;
}

export class ConflictError extends HttpError {
  status = 409;
}

export class UnauthorizedError extends HttpError {
  status = 401;
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

  async login(data: Pick<NewUser, "email" | "password">) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (!user) {
      throw new UnauthorizedError("Email atau password salah");
    }

    const isValid = await Bun.password.verify(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Email atau password salah");
    }

    const token = crypto.randomUUID();
    await db.insert(sessions).values({ token, userId: user.id });

    return { data: token };
  },

  async getCurrent(authorization: string | undefined) {
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : undefined;

    if (!token) {
      throw new UnauthorizedError("Unauthorized");
    }

    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token));

    if (!row) {
      throw new UnauthorizedError("Unauthorized");
    }

    return {
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
        created_at: row.createdAt,
      },
    };
  },
};
