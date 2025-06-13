import React from "react";
import { Toast } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ToastMessage.css";

const ToastMessage = ({ show, onClose, message, variant = "info" }) => {
  return (
    <Toast
      show={show}
      onClose={onClose}
      delay={5000}
      autohide
      className={`toast-message bg-${variant}`}
    >
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  );
};

export default ToastMessage;
