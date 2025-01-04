import React from "react";
import { Styles } from "../model/styles";

export default class ImageDetailPage extends React.Component<any, any> {
  render() {
    return (
      <div style={{ width: "100%", height: "100%", margin:"auto" }}>
        <img style={Styles.documentImage} src={this.props.image} alt={"."} />
      </div>
    );
  }
}
