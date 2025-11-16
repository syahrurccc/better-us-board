import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model";
import { registerSchema, loginSchema } from "../validations/zodSchemas";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = await registerSchema.parseAsync(req.body);

  const user = await User.exists({ email: email }).exec();
  if (user) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const hash = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hash });

  res.status(201).json({
    message: "User registered successfully",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({
    email,
  })
    .lean()
    .exec();
  if (!user)
    return res.status(401).json({
      error: "Authentication failed",
    });

  const pass = await bcrypt.compare(password, user.password);
  if (!pass)
    return res.status(401).json({
      error: "Authentication failed",
    });

  // authorize user
  // TODO: Create a refresh token
  const token = jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
    },
    process.env.TOKEN_SECRET!,
    { expiresIn: "1h" },
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 59 * 60 * 1000,
  });
  return res.sendStatus(204);
});

router.get("/logout", (_req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.sendStatus(204);
});

export default router;
