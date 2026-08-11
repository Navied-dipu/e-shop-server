import express from "express";
import cors from "cors";

import routes from "./routes/index.js";
import { globalErrorHandler } from "./lib/globalErrorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

app.use(globalErrorHandler);

export default app;
