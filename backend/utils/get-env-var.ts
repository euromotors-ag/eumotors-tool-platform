export function getEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // I production - kasta fel eftersom .env borde finnas
      throw new Error(
        `🚨 CRITICAL: Environment variable '${name}' is missing in production! ` +
          `This will cause the application to fail. Please check your environment configuration.`
      );
    } else {
      // I development - ge tydlig instruktion
      const errorMessage =
        `\n\n❌ MISSING ENVIRONMENT VARIABLE: '${name}'\n` +
        `\n📁 To fix this:\n` +
        `1. Create a .env file in the backend/ directory\n` +
        `2. Add: ${name}=your_value_here\n` +
        `3. Restart the server\n` +
        `\n💡 Example .env file:\n` +
        `CAR_CUTTER_API_KEY=your_api_key_here\n` +
        `CAR_CUTTER_SUBMIT_URL=https://api.car-cutter.com/vehicle/image/submission\n` +
        `CAR_CUTTER_STATUS_URL=https://api.car-cutter.com/vehicle/image/status\n` +
        `CAR_CUTTER_RESULT_URL=https://api.car-cutter.com/vehicle/image/result\n` +
        `\n🔧 Current working directory: ${process.cwd()}\n`;

      throw new Error(errorMessage);
    }
  }

  return value;
}
