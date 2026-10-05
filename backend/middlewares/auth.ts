import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "@clerk/backend";
import { getEnvVar } from "@utils/get-env-var.js";

/**
 * Rejects requests without a valid Clerk session token (Authorization: Bearer <token>).
 * `authorizedParties` are the frontend origins allowed to issue the token (the token's `azp`).
 */
export function requireSignedIn(authorizedParties: string[]): RequestHandler {
  const secretKey = getEnvVar("CLERK_SECRET_KEY");
  const parties = authorizedParties.includes("*") ? undefined : authorizedParties;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

    if (!token) {
      sendUnauthorized(res, "Sign in required");
      return;
    }

    try {
      await verifyToken(token, { secretKey, authorizedParties: parties });
      next();
    } catch (error) {
      console.warn(
        "Rejected request with invalid session token:",
        error instanceof Error ? error.message : error
      );
      sendUnauthorized(res, "Invalid or expired session");
    }
  };
}

function sendUnauthorized(res: Response, message: string): void {
  res.status(401).json({ status: "error", message });
}
