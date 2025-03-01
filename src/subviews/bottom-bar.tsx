import React from "react";
import { Styles } from "../model/styles";

export class BottomBar extends React.Component<any, any> {
  render() {
    if (this.props.hidden) {
      return null;
    }
    return (
      <div
        style={{
          height: this.props.height,
          backgroundColor: Styles.colors.scanbot1,
          display: "flex",
          alignItems:"center",
          color:"black",
          width:"100%"
        }}
      >
        {this.props.buttons && this.createButtons()}
      </div>
    );
  }

  private createButtons() {
    return this.props.buttons.map((button: any) => this.createButton(button));
  }
  private createButton(data: any) {
    const button = (
      <button
        key={data.text}
        style={Styles.bottomBarButton}
        onClick={data.action}
      >
        {data.text}
      </button>
    );

    if (data.right) {
      return (
        <div key={data.text} style={{ right: "8px", position: "absolute" }}>
          {button}
        </div>
      );
    }
    return button;
  }
}
