import { RoutePath } from "../service/routing-service";

export class Features {
  public static LIST = [
    {
      id: RoutePath.DocumentScanner,
      name: "Document Scanner",
      route: RoutePath.DocumentScanner,
    },
    { id: RoutePath.DocumentOnJpeg, name: "Detect document on .jpeg" },
    {
      id: RoutePath.ImageResults,
      name: "Image Results",
      route: RoutePath.ImageResults,
    },
  ];
}
