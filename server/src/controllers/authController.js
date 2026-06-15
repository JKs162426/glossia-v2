import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/userModel.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(username, email, hashedPassword);

    res.status(201).json({ message: "User created successfully", userId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
