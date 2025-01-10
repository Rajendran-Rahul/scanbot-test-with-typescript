import { createBrowserHistory } from "history";

const history = createBrowserHistory();

export enum RoutePath {
  DocumentScanner = "document-scanner",
  DocumentOnJpeg = "document-on-jpeg",
 
  MrzScanner = "mrz-scanner",
  TextDataScanner = "text-data-scanner",
  ImageResults = "image-results",
  ImageDetails = "image-details",
  LicenseInfo = "license-info",
  CroppingView = "cropping-view",
}

export class RoutingService {
  public static instance = new RoutingService();

  public route(path: RoutePath, args?: any) {
    let query = "";
    if (args) {
      query += "?";
      const keys = Object.keys(args);
      keys.forEach((key: string) => {
        query += key + "=" + args[key];
      });
    }
    
    history.push("#/" + path + query);
  }

  public reset() {
    history.replace("#/");
  }

  public observeChanges(action: any) {
    history.listen((_update) => {
      action();
    });
  }

  public back() {
    history.back();
  }
}
