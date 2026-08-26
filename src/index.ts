import { Elysia } from "elysia";
import { env } from "./config/env";
import { usersRoutes } from "./modules/users/users.routes";
import { HttpError } from "./modules/users/users.service";

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { error: { message: error.message, status: error.status } };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      let message = "Validation failed";
      try {
        message = JSON.parse(error.message).summary ?? message;
      } catch {
        // error.message wasn't JSON; fall back to the default message
      }
      return { error: { message, status: 400 } };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: { message: "Route not found", status: 404 } };
    }

    set.status = 500;
    return { error: { message: "Internal server error", status: 500 } };
  })
  .get("/health", () => ({ status: "ok" }))
  .use(usersRoutes)
  .listen(env.port);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`,
);
