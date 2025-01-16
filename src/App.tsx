import React from "react";
import AppBar from "@mui/material/AppBar";
import Swal from "sweetalert2";
import { NavigationContent } from "./subviews/navigation-content";
import { Toast } from "./subviews/toast";
// import FeatureList from "./subviews/feature-list";
import { BottomBar } from "./subviews/bottom-bar";
import ImageResultsPage from "./pages/image-results-page";
import ImageDetailPage from "./pages/image-detail-page";
import CroppingPage from "./pages/cropping-page";
import Pages from "./model/pages";
import { ScanbotSdkService } from "./service/scanbot-sdk-service";
import { RoutePath, RoutingService } from "./service/routing-service";
import { ImageUtils } from "./utils/image-utils";
import { NavigationUtils } from "./utils/navigation-utils";
import { MiscUtils } from "./utils/misc-utils";
import DocumentScannerComponent from "./rtu-ui/document-scanner-component";
import { AnimationType } from "./rtu-ui/enum/animation-type";
// import ErrorLabel from "./subviews/error-label";

export default class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      alert: undefined,
      activeImage: undefined,
      sdk: undefined,
      error: {
        message: undefined,
      },
      image: undefined,
      frontSideImage: undefined,
      backSideImage: undefined,
      documentQuality: "",
      activeImageIndex: undefined
    };
  }

  poorQualityDocument = ["POOR", "VERY POOR", "NO DOCUMENT"];

  async componentDidMount() {
    const sdk = await ScanbotSdkService.instance.initialize();
    this.setState({ sdk: sdk });

    RoutingService.instance.observeChanges(() => {
      this.forceUpdate();
    });

    await ScanbotSdkService.instance.setLicenseFailureHandler((error: any) => {
      RoutingService.instance.reset();

      this.setState({ error: { message: error } });
      if (this._documentScanner?.isVisible()) {
        this._documentScanner?.pop();
      }
    });
  }

  onBackPress() {
    RoutingService.instance.back();
  }

  navigation?: any;

  toolbarHeight() {
    return (this.navigation as HTMLHeadingElement)?.clientHeight ?? 0;
  }

  containerHeight() {
    if (!this.navigation) {
      return "100%";
    }
    return window.innerHeight - 2 * this.toolbarHeight()
      ? window.innerHeight - 2 * this.toolbarHeight()
      : 0;
  }

  render() {
    return (
      <div>
        {this.documentScanner()}

        <Toast
          alert={this.state.alert}
          onClose={() => this.setState({ alert: undefined })}
        />

        <AppBar
          position="fixed"
          ref={(ref) => (this.navigation = ref)}
          style={{ zIndex: 19 }}
        >
          <NavigationContent
            backVisible={!NavigationUtils.isAtRoot()}
            onBackClick={() => this.onBackPress()}
          />
        </AppBar>
        <div
          style={{
            height: this.containerHeight(),
            marginTop: this.toolbarHeight(),
            position: "relative",
            width: "99vw",
          }}
        >
          {this.decideContent()}
        </div>
        <BottomBar
          hidden={NavigationUtils.isAtRoot()}
          height={this.toolbarHeight()}
          buttons={this.decideButtons()}
        />
      </div>
    );
  }

  _documentScannerHtmlComponent: any;
  _documentScanner?: DocumentScannerComponent | null;
  documentScanner() {
    if (!this._documentScannerHtmlComponent) {
      this._documentScannerHtmlComponent = (
        <DocumentScannerComponent
          ref={(ref) => (this._documentScanner = ref)}
          sdk={this.state.sdk}
          onDocumentDetected={this.onDocumentDetected.bind(this)}
          showBottomActionBar={true}
          onDocumentScannerError={this.onDocumentScannerError.bind(this)}
        />
      );
    }
    return this._documentScannerHtmlComponent;
  }

  decideContent() {
    const route = NavigationUtils.findRoute();

    if (NavigationUtils.isAtRoot() || route === RoutePath.DocumentScanner) {
      return (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: "40px",
            }}
          >
            {/* <ErrorLabel message={this.state.error.message} />
          <FeatureList onItemClick={this.onFeatureClick.bind(this)} /> */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <button
                onClick={() => {
                  this.handleButtonClick(0);
                }}
              >
                Insurance - Front
              </button>
              {this.state.frontSideImage && (
                <img
                  src={this.state.frontSideImage}
                  alt=""
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "contain",
                  }}
                  onClick={() => this.postDocumentDetection(0)}
                />
              )}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <button
                onClick={() => {
                  this.handleButtonClick(1);
                }}
              >
                Insurance - Back
              </button>

              {this.state.backSideImage && (
                <img
                  src={this.state.backSideImage}
                  alt=""
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "contain",
                  }}
                  onClick={() => this.postDocumentDetection(1)}
                />
              )}
            </div>
          </div>
        </>
      );
    }
    if (route === RoutePath.CroppingView) {
      if (!Pages.instance.hasActiveItem()) {
        RoutingService.instance.reset();
        return null;
      }
      return <CroppingPage sdk={this.state.sdk} />;
    }
    if (route === RoutePath.ImageDetails) {
      if (!Pages.instance.hasActiveItem()) {
        RoutingService.instance.reset();
        return null;
      }
      return <ImageDetailPage image={this.state.activeImage} />;
    }
    if (route === RoutePath.ImageResults) {
      return (
        <ImageResultsPage
          sdk={this.state.sdk}
          onDetailButtonClick={async (index: number) => {
            Pages.instance.setActiveItem(index);
            this.setState({
              activeImage:
                await ScanbotSdkService.instance.documentImageAsBase64(index),
            });
            RoutingService.instance.route(RoutePath.ImageDetails, {
              index: index,
            });
          }}
        />
      );
    }
  }

  private handleButtonClick(imageIndex: number) {
    this._documentScanner?.push(AnimationType.PushRight);
    this.setState({
      activeImageIndex: imageIndex,
    });
  }

  private decideButtons() {
    const route = NavigationUtils.findRoute();
    if (route === RoutePath.DocumentScanner || NavigationUtils.isAtRoot()) {
      return [
        { text: Pages.instance.count() + " PAGES", action: undefined },
        { text: "Auto Capture", action: this.autoCaptureDisabled.bind(this) },
        { text: "DONE", action: this.onBackPress.bind(this), right: true },
      ];
    }
    if (route === RoutePath.ImageResults) {
      return [
        { text: "SAVE PDF", action: this.savePDF.bind(this) },
        { text: "SAVE TIFF", action: this.saveTIFF.bind(this) },
      ];
    }
    if (route === RoutePath.ImageDetails) {
      return [
        { text: "CROP", action: this.openCroppingUI.bind(this) },
        // { text: "FILTER", action: this.applyFilter.bind(this) },
        // { text: "DELETE", action: this.deletePage.bind(this) },
        { text: "DONE", action: this.backToHomePage.bind(this), right: true },
      ];
    }
    if (route === RoutePath.CroppingView) {
      return [
        { text: "DETECT", action: this.detect.bind(this) },
        { text: "ROTATE", action: this.rotate.bind(this) },
        { text: "APPLY", action: this.applyCrop.bind(this), right: true },
      ];
    }
  }

  async detect() {
    await ScanbotSdkService.instance.croppingView?.detect();
  }

  async rotate() {
    await ScanbotSdkService.instance.croppingView?.rotate(1);
  }

  async applyCrop() {
    const result = await ScanbotSdkService.instance.croppingView?.apply();
    Pages.instance.updateActiveItem(result);
    await ScanbotSdkService.instance.reapplyFilter();
    this.onBackPress();
    const index = Pages.instance.getActiveIndex();
    this.setState({
      activeImage: await ScanbotSdkService.instance.documentImageAsBase64(
        index
      ),
    });
    if (index === 0) {
      this.setState({
        frontSideImage: await ScanbotSdkService.instance.documentImageAsBase64(
          index
        ),
      });
    }
  }

  async savePDF() {
    const bytes = await ScanbotSdkService.instance.generatePDF(
      Pages.instance.get()
    );
    ImageUtils.saveBytes(bytes, MiscUtils.generateUUID() + ".pdf");
  }

  async saveTIFF() {
    const bytes = await ScanbotSdkService.instance.generateTIFF(
      Pages.instance.get()
    );
    ImageUtils.saveBytes(bytes, MiscUtils.generateUUID() + ".tiff");
  }

  openCroppingUI() {
    RoutingService.instance.route(RoutePath.CroppingView, {
      index: Pages.instance.getActiveIndex(),
    });
  }

  async applyFilter() {
    const page = Pages.instance.getActiveItem();
    const result = await Swal.fire({
      title: "Select filter",
      input: "select",
      inputOptions: ScanbotSdkService.instance.availableFilters(),
      inputPlaceholder: page.filter ?? "Select a filter to apply",
    });

    const filter = ScanbotSdkService.instance.filterNameByIndex(result?.value);

    // "None" is not an actual filter, only used in this example app
    if (filter === "none") {
      page.filter = undefined;
      page.filtered = undefined;
    } else {
      page.filter = filter;
      page.filtered = await ScanbotSdkService.instance.applyFilter(
        page.cropped ?? page.original,
        filter
      );
    }

    const index = Pages.instance.getActiveIndex();
    this.setState({
      activeImage: await ScanbotSdkService.instance.documentImageAsBase64(
        index
      ),
    });
  }

  deletePage() {
    Pages.instance.removeActiveItem();
    RoutingService.instance.reset();
  }

  async onDocumentDetected(result: any) {
    // const { cropped } = result;
    // const documentQuality = await this.documenQuality(cropped);
    // if(documentQuality && documentQuality?.quality in this.poorQualityDocument){
    //   this.onDocumentScannerError("Image quality is not good. Please try again.")
    // }
    Pages.instance.add(result, this.state.activeImageIndex);
    ScanbotSdkService.instance.sdk?.utils.flash();
    this._documentScanner?.pop();
    ScanbotSdkService.instance.disposeDocumentScanner();
    this.postDocumentDetection(this.state.activeImageIndex);
  }

  // async documenQuality(image: any) {
  //   const analyzer =
  //     await ScanbotSdkService.instance.createDocumentQualityAnalyzer();
  //   const result = await analyzer?.analyze(image);
  //   await analyzer?.release();
  //   return result;
  // }

  async postDocumentDetection(imageIndex: number) {
    this.setState({
      activeImage: await ScanbotSdkService.instance.documentImageAsBase64(
        imageIndex
      ),
      activeImageIndex: imageIndex
    });
    Pages.instance.setActiveItem(imageIndex);
    RoutingService.instance.route(RoutePath.ImageDetails, {
      index: imageIndex,
    });
  }

  backToHomePage() {
    this.onBackPress();
    if (this.state.activeImageIndex === 0) {
      this.setState({
        frontSideImage: this.state.activeImage,
      });
      return;
    }
    this.setState({
      backSideImage: this.state.activeImage,
    });
  }

  async onFeatureClick(feature: any) {
    const valid = await ScanbotSdkService.instance.isLicenseValid();
    if (!valid) {
      console.error(
        "License invalid or expired. ScanbotSDK features not available"
      );
      return;
    }

    if (feature.id === RoutePath.DocumentScanner) {
      this._documentScanner?.push(AnimationType.PushRight);
      return;
    }

    if (feature.route) {
      RoutingService.instance.route(feature.route);
      return;
    }

    if (feature.id === RoutePath.LicenseInfo) {
      const info = await this.state.sdk?.getLicenseInfo();
      const color = info?.status === "Trial" ? "success" : "error";
      this.setState({ alert: { color: color, text: JSON.stringify(info) } });
    } else if (feature.id === RoutePath.DocumentOnJpeg) {
      const image = await ImageUtils.pick(
        ImageUtils.MIME_TYPE_JPEG,
        document.getElementById(feature.id) as any
      );

      const contourDetectionResult =
        await ScanbotSdkService.instance.detectDocument(image.original);
      if (
        contourDetectionResult.success === true &&
        contourDetectionResult.polygon
      ) {
        const cropped = await ScanbotSdkService.instance.cropAndRotateImageCcw(
          image.original,
          contourDetectionResult.polygon,
          0
        );
        const documentDetectionResult = {
          ...contourDetectionResult,
          original: image.original,
          cropped: cropped,
        };

        Pages.instance.add(documentDetectionResult);
        await MiscUtils.alert("Detection successful");
      } else {
        await MiscUtils.alert("Detection failed");
      }
    } else {
      console.log("no service");
    }
  }

  autoCaptureDisabled() {
    ScanbotSdkService.instance.disableAutoCapture();
  }

  onDocumentScannerError(error: any) {
    console.log("error", error);
    this._documentScanner?.pop();
  }
}
