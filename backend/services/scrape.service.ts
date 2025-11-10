import { chromium } from "playwright";
import axios from "axios";

interface ScrapeResult {
  original_title: string;
  image_urls: string[];
}

interface ImageDownloadResult {
  imageData: Buffer;
  contentType: string;
  fileName: string;
}

/**
 * Scrapes images from a Blocket listing URL
 * Based on lib/scraping-editor Blocket scraper
 */
export async function scrapeBlocketImages(url: string): Promise<ScrapeResult> {
  if (!url.includes("blocket.se")) {
    throw new Error("Only Blocket URLs are supported");
  }

  // 🟢 Starta browsern
  const browser = await chromium.launch({ headless: true });

  // 🟢 Skapa context (detta ersätter page.setUserAgent + page.setViewportSize)
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  // 🟢 Skapa ny sida
  const page = await context.newPage();

  try {
    // 👇 Navigera och vänta tills nätverket är lugnt
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    // 👇 Försök klicka bort cookie-banners
    try {
      const consentFrame = page.frameLocator(
        'iframe[title="SP Consent Message"]'
      );
      const consentButton = consentFrame.locator(
        'button:has-text("Godkänn alla")'
      );
      if (await consentButton.count()) {
        await consentButton.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Inga cookies eller redan accepterat
    }

    // 👇 Vänta tills sidan verkligen har renderat annonsen
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 600));

    // 👇 Vänta på article – längre timeout
    await page.waitForSelector('article[class*="AdMotor__Article-sc-"]', {
      timeout: 30000,
    });

    // 👇 Läs titel
    const title =
      (await page
        .locator('div[class*="Hero__ContentWrapper-sc-"] h1')
        .first()
        .textContent()
        .catch(() => "No title found")) || "No title found";

    // 👇 Hitta next-button och bilder
    const nextButton = page.locator(
      'button[aria-label="Nästa bild"][class*="SliderControls__StyledButton-sc-"]'
    );
    const imageUrls: string[] = [];

    if ((await nextButton.count()) > 0) {
      let attempts = 0;
      while (attempts < 50) {
        const urls = await page.evaluate(() => {
          const elements = document.querySelectorAll(
            '[style*="background-image"]'
          );
          const found: string[] = [];
          elements.forEach((el) => {
            const style = (el as HTMLElement).style.cssText;
            const match = style.match(
              /background-image:\s*url\(['"]?(.*?)['"]?\)/
            );
            if (match && match[1] && match[1].includes("blocketcdn.se")) {
              found.push(match[1].split("?")[0]);
            }
          });
          return found;
        });

        urls.forEach((u) => !imageUrls.includes(u) && imageUrls.push(u));

        try {
          await nextButton.click({ timeout: 1000 });
          await page.waitForTimeout(400);
          attempts++;
        } catch {
          break;
        }
      }
    } else {
      const urls = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          '[style*="background-image"]'
        );
        const found: string[] = [];
        elements.forEach((el) => {
          const style = (el as HTMLElement).style.cssText;
          const match = style.match(
            /background-image:\s*url\(['"]?(.*?)['"]?\)/
          );
          if (match && match[1] && match[1].includes("blocketcdn.se")) {
            found.push(match[1].split("?")[0]);
          }
        });
        return found;
      });
      imageUrls.push(...urls);
    }

    await browser.close();
    return { original_title: title.trim(), image_urls: imageUrls };
  } catch (error) {
    await browser.close();
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Downloads an image from a URL and returns the buffer
 */
export async function downloadImage(
  imageUrl: string
): Promise<ImageDownloadResult> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000,
    });

    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    const buffer = Buffer.from(response.data, "binary");

    // Extract filename from URL
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1].split("?")[0];

    return {
      imageData: buffer,
      contentType,
      fileName,
    };
  } catch (error) {
    throw new Error(
      `Failed to download image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
