import React from "react";

export interface AuthorizeComponentProps {
  redirect_uri: string;
}

const AuthorizeComponent: React.FC<AuthorizeComponentProps> = (props) => {
  const handleApprove = () => {
    fetch("/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ approve: true, redirect_uri: props.redirect_uri }),
    }).then((response) => {
      if (response.ok) {
        window.location.href = props.redirect_uri + "?code=staticAuthCode123";
      }
    });
  };

  const handleDeny = () => {
    // Handle deny logic, possibly redirecting the user to another page or showing a message.
  };

  return (
    <div>
      <h2>Mock Authorization Page</h2>
      <p>
        <strong>App XYZ</strong> is requesting access to your profile information.
      </p>
      <button onClick={handleApprove}>Approve</button>
      <button onClick={handleDeny}>Deny</button>
    </div>
  );
};

export default AuthorizeComponent;
