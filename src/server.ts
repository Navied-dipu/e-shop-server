import dotenv from "dotenv";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down...`);
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
