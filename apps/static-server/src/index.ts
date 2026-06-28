import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "./container";
import { health } from "./routes/health";
import { imports } from "./routes/imports";
import { pages } from "./routes/pages";

const app = new Hono();

app.route("/", health);
app.route("/", imports);
app.route("/", pages);

const port = Number(process.env.STATIC_SERVER_PORT) || 3001;

console.log(`Hono server running on http://0.0.0.0:${port}`);

serve({ fetch: app.fetch, port });
