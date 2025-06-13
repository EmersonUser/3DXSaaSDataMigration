import React, { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import "../../pages/styles.css";
import ToastMessage from "../ToastMessage/ToastMessage";

const CardComponent = ({
  title,
  text,
  buttonLabel,
  onButtonClick,
  responseMessage,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState("info");

  const handleButtonClick = async () => {
    setIsLoading(true);
    try {
      await onButtonClick(); // Assuming onButtonClick is an async function
      setToastVariant("success"); // Green for success
      setShowToast(true);
    } catch (error) {
      setToastVariant("danger"); // Red for error
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="custom-card">
      <div className="toast-wrapper">
        <ToastMessage
          show={showToast}
          onClose={() => setShowToast(false)}
          message={responseMessage || "Action completed!"}
          variant={toastVariant}
        />
      </div>

      <Card.Body>
        <Card.Title className="card-title">{title}</Card.Title>
        <Card.Text className="card-text">{text}</Card.Text>
        {children}

        {buttonLabel && (
          <Button
            className="custom-button"
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="sr-only">Loading...</span>
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default CardComponent;
