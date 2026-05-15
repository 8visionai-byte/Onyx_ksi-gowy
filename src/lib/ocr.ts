import { ImageAnnotatorClient } from "@google-cloud/vision";

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    const credentials = JSON.parse(
      process.env.GOOGLE_CLOUD_VISION_CREDENTIALS || "{}"
    );
    client = new ImageAnnotatorClient({ credentials });
  }
  return client;
}

export async function extractTextFromImage(imagePath: string): Promise<string> {
  const visionClient = getClient();
  const [result] = await visionClient.textDetection(imagePath);
  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    throw new Error("OCR nie rozpoznał tekstu w obrazie");
  }
  return detections[0].description || "";
}
