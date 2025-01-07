import { RoutePath } from "../service/routing-service";

export class Features {
  public static LIST = [
    {
      id: RoutePath.DocumentScanner,
      name: "Document Scanner",
      route: RoutePath.DocumentScanner,
      description:
        "Scan any documents in front of you with auto-capture and user guidance",
    },
    // {
    //   id: RoutePath.DocumentOnJpeg,
    //   name: "Detect document on .jpeg",
    //   description: "Turn pictures of documents into high quality scans",
    // },
    {
      id: RoutePath.ImageResults,
      name: "Image Results",
      route: RoutePath.ImageResults,
    },
  ];
}
