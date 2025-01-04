import React from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

function CustomAlert(props: any) {
  return <Alert elevation={6} variant="filled" {...props} />;
}

export class Toast extends React.Component<any, any> {
  render() {
    return (
      <Snackbar
        open={!!this.props.alert}
        autoHideDuration={2000}
        onClose={this.props.onClose}
      >
        <CustomAlert
          onClose={this.props.onClose}
          severity={this.props.alert?.color}
        >
          <div style={{ wordWrap: "break-word", maxWidth: "70vw" }}>
            {this.props.alert?.text}
          </div>
        </CustomAlert>
      </Snackbar>
    );
  }
}
