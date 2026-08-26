import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

const registerBody = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
});

const loginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

const userUpdateBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  email: t.Optional(t.String({ format: "email" })),
});

const idParams = t.Object({
  id: t.Numeric(),
});

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .get("/", () => usersService.list())
  .post("/login", ({ body }) => usersService.login(body), {
    body: loginBody,
  })
  .get("/:id", ({ params }) => usersService.getById(params.id), {
    params: idParams,
  })
  .post("/", ({ body }) => usersService.register(body), {
    body: registerBody,
  })
  .put("/:id", ({ params, body }) => usersService.update(params.id, body), {
    params: idParams,
    body: userUpdateBody,
  })
  .delete("/:id", ({ params }) => usersService.remove(params.id), {
    params: idParams,
  });
