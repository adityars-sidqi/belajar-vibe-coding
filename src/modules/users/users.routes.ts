import { Elysia, t } from "elysia";
import { usersService } from "./users.service";

const userBody = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
});

const userUpdateBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  email: t.Optional(t.String({ format: "email" })),
});

const idParams = t.Object({
  id: t.Numeric(),
});

export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => usersService.list())
  .get("/:id", ({ params }) => usersService.getById(params.id), {
    params: idParams,
  })
  .post("/", ({ body, set }) => {
    set.status = 201;
    return usersService.create(body);
  }, {
    body: userBody,
  })
  .put("/:id", ({ params, body }) => usersService.update(params.id, body), {
    params: idParams,
    body: userUpdateBody,
  })
  .delete("/:id", ({ params }) => usersService.remove(params.id), {
    params: idParams,
  });
