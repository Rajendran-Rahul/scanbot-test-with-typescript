import { ScanbotSdkService } from "../service/scanbot-sdk-service";
import { DocumentDetectionResult } from "scanbot-web-sdk/@types";
import BaseScannerComponent from "./common/base-scanner-component";
import { AnimationType } from "./enum/animation-type";
import Pages from "../model/pages";
import { MiscUtils } from "../utils/misc-utils";

export default class DocumentScannerComponent extends BaseScannerComponent {
  render() {
    return this.controller(
      ScanbotSdkService.DOCUMENT_SCANNER_CONTAINER,
      "Document Scanner",
      this.labelText(),
      () => {
        this.onCameraSwap(ScanbotSdkService.instance.documentScanner!, true);
      },
      () => {
        this.onCameraSwitch(ScanbotSdkService.instance.documentScanner!);
      }
    );
  }

  onDocumentDetected(result: DocumentDetectionResult) {
    this.props.onDocumentDetected(result);
    const label = document.getElementById("count-label");
    
    if (label) {
      label.innerHTML = this.labelText();
    }    
  }

  onDocumentScannerError(e: Error) {
    console.log(e.name + ': ' + e.message);
    MiscUtils.alert(e.name + ': ' + e.message);
  }

  labelText() {
    return Pages.instance.count() + " Pages";
  }

  async push(type: AnimationType) {
    super.push(type);
    this.pushType = type;
    ScanbotSdkService.instance.disableAutoCapture();
    this.updateAnimationType(type, async () => {
      try {
        await ScanbotSdkService.instance.createDocumentScanner(
          this.onDocumentDetected.bind(this),
          this.onDocumentScannerError.bind(this),
        );
      } catch (e:any) {
        this.onDocumentScannerError(e);
        this.pop()
      }
    });
  }

  pop() {
    super.pop();
    this.updateAnimationType(AnimationType.Pop, () => {
      ScanbotSdkService.instance.disposeDocumentScanner();
    });
  }
}
