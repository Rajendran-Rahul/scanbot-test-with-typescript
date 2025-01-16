// Import SDK from webpack directory to ensure web assembly binary and worker and bundled with webpack
import ScanbotSDK from "scanbot-web-sdk";

// Other typings should be imported from @types
import {
  DocumentScannerConfiguration,
  IDocumentScannerHandle,
  CroppingViewConfiguration,
  ICroppingViewHandle,
  TiffGenerationOptions,
  PdfGenerationOptions,
  TiffGenerator,
  PdfGenerator,
  Polygon,
} from "scanbot-web-sdk/@types";

import Pages from "../model/pages";
import { ImageUtils } from "../utils/image-utils";

import { ContourDetectionResult } from "scanbot-web-sdk/@types/model/document/contour-detection-result";

const filters = {
  ScanbotBinarizationFilter: ScanbotSDK.imageFilters.ScanbotBinarizationFilter,
  GrayscaleFilter: ScanbotSDK.imageFilters.GrayscaleFilter,
  ContrastFilter: ScanbotSDK.imageFilters.ContrastFilter,
  ColorDocumentFilter: ScanbotSDK.imageFilters.ColorDocumentFilter,
};

export class ScanbotSdkService {
  static DOCUMENT_SCANNER_CONTAINER = "document-scanner-view";
  static CROPPING_VIEW_CONTAINER = "cropping-view";

  public static instance = new ScanbotSdkService();

  license =
    "pvMiF98eIibOS4nDhR4epUfMIxOzqg" +
    "CIysvxOJ3cyjjiZF3pIyzAoA6g1FYh" +
    "ro4K+VYBQFX/X0016Yo8iIgxxKaQba" +
    "//3arLJjg8iYMD1/Y7JLVM1n2fNSxW" +
    "MAk4FCvSnDDx4pob+uBEBchn9q+klk" +
    "OrD89DlDZPgacBJ/ql7xra7g+2hChi" +
    "0H0aOFow0Qdiw7W8RnvvUi8QdMOiCE" +
    "HvEy/HpeTK37s7NSwzuIE5ai9XWVPX" +
    "M5tmDyFKPQ9xycEQSDcnYLRmwHZVLz" +
    "mrvLyGXY3IZhn6Ch6EX9bmgHQOxXql" +
    "SSO4p4on7YtWEV4jkV0f9ssMgqGZpu" +
    "g29V3suKHO8g==\nU2NhbmJvdFNESw" +
    "psb2NhbGhvc3R8c2NhbmJvdC10ZXN0" +
    "LXdpdGgtdHlwZXNjcmlwdC52ZXJjZW" +
    "wuYXBwCjE3MzcxNTgzOTkKODM4ODYw" +
    "Nwo4\n";

  sdk?: ScanbotSDK;

  documentScanner?: IDocumentScannerHandle;
  croppingView?: ICroppingViewHandle;

  public async initialize() {
    this.sdk = await ScanbotSDK.initialize({
      licenseKey: this.license,
      // WASM files are copied to this directory by the npm postinstall script
      engine: "wasm",
    });
    return this.sdk;
  }

  async setLicenseFailureHandler(callback: any) {
    await this.setLicenceTimeout(callback);
  }

  private async setLicenceTimeout(callback: any) {
    // Scanbot WebSDK does not offer real-time license failure handler. Simply loop to check it manually
    const info = await this.sdk?.getLicenseInfo();
    if (info && info.status !== "Trial" && info.status !== "Okay") {
      callback(info.description);
    } else if (info && info.status === "Trial") {
      callback(info.description);
    } else {
      setTimeout(() => {
        this.setLicenceTimeout(callback);
      }, 2000);
    }
  }

  public async isLicenseValid(): Promise<boolean> {
    const info = await this.sdk?.getLicenseInfo();
    if (!info) {
      return false;
    }
    return info.isValid();
  }

  public async createDocumentQualityAnalyzer() {
    return this.sdk?.createDocumentQualityAnalyzer();
  }

  public async createDocumentScanner(
    detectionCallback: any,
    errorCallback: (e: Error) => void
  ) {
    const config: DocumentScannerConfiguration = {
      onDocumentDetected: detectionCallback,
      containerId: ScanbotSdkService.DOCUMENT_SCANNER_CONTAINER,
      text: {
        hint: {
          OK: "Capturing your document...",
          OK_SmallSize: "The document is too small. Try moving closer.",
          OK_BadAngles:
            "This is a bad camera angle. Hold the device straight over the document.",
          OK_BadAspectRatio:
            "Rotate the device sideways, so that the document fits better into the screen.",
          OK_OffCenter: "Try holding the device at the center of the document.",
          Error_NothingDetected:
            "Please hold the device over a document to start scanning",
          Error_Brightness: "It is too dark. Try turning on a light.",
          Error_Noise: "Please move the document to a clear surface.",
        },
      },
      style: {
        // Note that alternatively, styling the document scanner is also possible using CSS classes.
        // For details see https://docs.scanbot.io/document-scanner-sdk/web/features/document-scanner/document-scanner-ui/
        outline: {
          polygon: {
            fillCapturing: "transparent",
            strokeCapturing: "none",
            fillSearching: "transparent",
            strokeSearching: "none",
          },
        },
      },
      onError: errorCallback,
      preferredCamera: "camera2 0, facing back",
      autoCaptureEnabled: false,
    };
    this.documentScanner = await this.sdk!.createDocumentScanner(config);
  }

  public disposeDocumentScanner() {
    this.documentScanner?.dispose();
  }

  public async openCroppingView(page: any) {
    const configuration: CroppingViewConfiguration = {
      containerId: ScanbotSdkService.CROPPING_VIEW_CONTAINER,
      image: page.original,
      polygon: page.polygon,
      rotations: page.rotations ?? 0,
    };

    this.croppingView = await this.sdk!.openCroppingView(configuration);
  }

  public disposeCroppingView() {
    this.croppingView?.dispose();
  }

  public availableFilters() {
    return ["none"].concat(Object.keys(filters)) as (
      | "none"
      | keyof typeof filters
    )[];
  }

  public filterNameByIndex(value: string) {
    return this.availableFilters()[parseInt(value)];
  }

  public async applyFilter(
    image: ArrayBuffer,
    filterName: keyof typeof filters
  ) {
    const filter = new filters[filterName]();
    const imageProcessor = await this.sdk!.createImageProcessor(image);
    await imageProcessor.applyFilter(filter);
    const result = await imageProcessor.processedImage();
    await imageProcessor.release();
    return result;
  }

  async documentImageAsBase64(index: number) {
    const bytes = Pages.instance.imageAtIndex(index);
    if (bytes) {
      return await this.sdk!.toDataUrl(bytes);
    }
  }

  async reapplyFilter() {
    const existing = Pages.instance.getActiveItem();
    if (!existing.filter) {
      return;
    }
    existing.filtered = await this.applyFilter(
      existing.cropped,
      existing.filter
    );
  }

  async generatePDF(pages: any[]) {
    const options: PdfGenerationOptions = {
      standardPaperSize: "A4",
      pageDirection: "PORTRAIT",
    };
    const generator: PdfGenerator = await this.sdk!.beginPdf(options);
    for (const page of pages) {
      let image = page.filtered ?? page.cropped ?? page.original;
      image = await ImageUtils.downscale(this.sdk!, image);
      await generator.addPage(image);
    }
    return await generator.complete();
  }

  async generateTIFF(pages: any[]) {
    const options: TiffGenerationOptions = {
      dpi: 72,
    };
    const generator: TiffGenerator = await this.sdk!.beginTiff(options);
    for (const page of pages) {
      const image = page.cropped ?? page.original;
      const imageProcessor = await this.sdk!.createImageProcessor(image);
      await imageProcessor.applyFilter(
        new ScanbotSDK.imageFilters.ScanbotBinarizationFilter()
      );
      await generator.addPage(await imageProcessor.processedImage());
      await imageProcessor.release();
    }
    return await generator.complete();
  }

  async detectDocument(image: ArrayBuffer): Promise<ContourDetectionResult> {
    return await this.sdk!.detectDocument(image);
  }

  async cropAndRotateImageCcw(
    image: ArrayBuffer,
    polygon: Polygon,
    rotations: number
  ): Promise<Uint8Array> {
    return await this.sdk!.cropAndRotateImageCcw(image, polygon, rotations);
  }

  disableAutoCapture() {
    return this.documentScanner?.disableAutoCapture();
  }

  public isAutoCapturePresent() {
    return this.documentScanner?.isAutoCaptureEnabled();
  }
}
