import { Elysia } from "elysia";
import { env } from "./config/env";
import { usersRoutes } from "./routes/users-route";
import { HttpError } from "./services/users-service";

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { error: error.message };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      let message = "Validation failed";
      try {
        message = JSON.parse(error.message).summary ?? message;
      } catch {
        // error.message wasn't JSON; fall back to the default message
      }
      return { error: message };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found" };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })
  .get("/health", () => ({ status: "ok" }))
  .use(usersRoutes)
  .listen(env.port);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`,
);
