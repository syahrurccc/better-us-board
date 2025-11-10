import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import authRouter from "./routes/auth.route";
import boardRouter from "./routes/board.route";
import connRouter from "./routes/connections.route";
import healthRouter from "./routes/health.route";
import renderRouter from "./routes/render.route";
import ticketsRouter from "./routes/tickets.route";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/error";

export function createApp() {
  const app = express();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(cookieParser());
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));
  app.use(helmet());
  app.use(morgan("dev"));

  app.use("/", renderRouter);
  app.use("/auth", authRouter);
  app.use("/board", boardRouter);
  app.use("/connections", connRouter);
  app.use("/health", healthRouter);
  app.use("/tickets", ticketsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
