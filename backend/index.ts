import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Now import other modules that depend on environment variables
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { validateEnvironmentVariables } from "@utils/validate-env.js";
import { requireAuth } from "@clerk/express";

// Validate environment variables
validateEnvironmentVariables();

// Lazy-load routes AFTER environment variables are loaded
let imageRoutes: any;
let scrapeRoutes: any;
let equipmentRoutes: any;
let enumRoutes: any;
let referenceRoutes: any;

// Initialize routes after environment variables are loaded
(async () => {
  const routesModule = await import("@routes/image.routes.js");
  const scrapeModule = await import("@routes/scrape.routes.js");
  const equipmentModule = await import("@routes/equipment.routes.js");
  const enumModule = await import("@routes/enum.routes.js");
  const referenceModule = await import("@routes/reference.routes.js");

  imageRoutes = routesModule.default;
  scrapeRoutes = scrapeModule.default;
  equipmentRoutes = equipmentModule.default;
  enumRoutes = enumModule.default;
  referenceRoutes = referenceModule.default;

  startServer();
  
  // Warm up equipment dictionary cache after server starts
  // This reduces first request latency
  const referenceServiceModule = await import("@services/reference.service.js");
  if (referenceServiceModule.warmupEquipmentDictionaryCache) {
    referenceServiceModule.warmupEquipmentDictionaryCache().catch((error) => {
      // Silent fail - cache will be populated on first request
      if (process.env.NODE_ENV === "development") {
        console.warn("Cache warmup failed:", error);
      }
    });
  }
})();

function startServer() {
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

        console.log(`Inkommande begäran från: ${origin || "Ingen origin"}`);
        console.log(`Tillåtna ursprung: ${JSON.stringify(allowedOrigins)}`);

        // Tillåt requests utan origin (som mobil-appar eller REST-klienter)
        if (!origin) return callback(null, true);

        // Kontrollera om ursprunget är tillåtet
        if (typeof allowedOrigins === "string" && allowedOrigins === "*") {
          return callback(null, true);
        }

        if (
          Array.isArray(allowedOrigins) &&
          (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))
        ) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "If-None-Match", "ETag"],
      exposedHeaders: ["ETag"],
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

  // API Routes with Clerk authentication
  app.use("/api/v1/images", imageRoutes); // Temporarily removed requireAuth() for testing
  app.use("/api/v1/scrape", scrapeRoutes);
  app.use("/api/v1/equipment", equipmentRoutes);
  app.use("/api/v1/enums", enumRoutes);
  app.use("/api/reference", referenceRoutes);

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

// Export the app (will be undefined until startServer() is called)
export default {} as any;
