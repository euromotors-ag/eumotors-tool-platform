import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Now import other modules that depend on environment variables
import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import { validateEnvironmentVariables } from "@utils/validate-env.js";

// Validate environment variables
validateEnvironmentVariables();

// Routes are imported after the environment is loaded, because the CarCutter and S3
// config read environment variables on import (static imports are hoisted above dotenv)
const [{ default: imageRoutes }, { default: scrapeRoutes }] = await Promise.all([
  import("@routes/image.routes.js"),
  import("@routes/scrape.routes.js"),
]);

startServer(imageRoutes, scrapeRoutes);

function startServer(imageRoutes: Router, scrapeRoutes: Router) {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Get allowed origins from environment variable
  const getAllowedOrigins = () => {
    if (process.env.NODE_ENV === "production") {
      // Split multiple origins by comma if needed
      const origins = process.env.ALLOWED_ORIGINS || "";
      return origins.split(",").map((origin) => origin.trim());
    }
    return ["http://localhost:5173"];
  };

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();

        // Allow requests without origin (REST clients, health checks)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
      credentials: true,
    })
  );

  app.options("*", cors());

  // Make sure to include proper body parsing middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helmet middleware
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://*.amazonaws.com"],
        connectSrc: ["'self'", "https://api.car-cutter.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    })
  );

  // API Routes
  app.use("/api/v1/images", imageRoutes);
  app.use("/api/v1/scrape", scrapeRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      environment: process.env.NODE_ENV,
      allowedOrigins: getAllowedOrigins(),
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
