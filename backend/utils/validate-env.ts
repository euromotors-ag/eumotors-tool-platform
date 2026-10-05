export function validateEnvironmentVariables() {
  const requiredVars = [
    "AWS_S3_BUCKET_NAME",
    "AWS_S3_BUCKET_REGION",
    "AWS_S3_BUCKET_ACCESS_KEY",
    "AWS_S3_BUCKET_SECRET_KEY",
    "CAR_CUTTER_API_KEY",
    "CAR_CUTTER_SUBMIT_URL",
    "CAR_CUTTER_STATUS_URL",
    "CAR_CUTTER_RESULT_URL",
    "CLERK_SECRET_KEY",
  ];

  const recommendedVars = ["ALLOWED_ORIGINS"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ ERROR: Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\nPlease set these variables in your .env file or environment."
    );

    if (process.env.NODE_ENV === "production") {
      console.error(
        "Exiting due to missing environment variables in production mode."
      );
      process.exit(1);
    }
  } else {
    console.log("✅ All required environment variables are set.");
  }

  const missingRecommended = recommendedVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingRecommended.length > 0) {
    console.warn("⚠️ Recommended environment variables not set:");
    missingRecommended.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
  }
}
