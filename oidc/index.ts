import express from "express";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/.well-known/openid-configuration", (req, res) => {
  res.json({
    issuer: `http://localhost:${PORT}`,
    authorization_endpoint: `http://localhost:${PORT}/authorize`,
    token_endpoint: `http://localhost:${PORT}/token`,
    userinfo_endpoint: `http://localhost:${PORT}/userinfo`,
  });
});

app.get("/authorize", (req, res) => {
  // In a real-world scenario, you'd check client_id, scopes, and other parameters.
  res.render("authorize");
});

app.post("/approve", (req, res) => {
  if (req.body.approve === "true") {
    // Normally, generate a random authorization code.
    const authCode = "staticAuthCode123";
    const redirectUri = req.body.redirect_uri || "http://localhost:4000/callback";
    res.redirect(`${redirectUri}?code=${authCode}`);
  } else {
    res.send("Access denied by the user.");
  }
});

app.post("/token", (req, res) => {
  const { code, client_id, client_secret } = req.body;

  // Normally, validate the code, client_id, and client_secret.
  const tokens = {
    access_token: "staticAccessToken123",
    id_token: "staticIdToken123",
    expires_in: 3600,
  };
  res.json(tokens);
});

app.get("/userinfo", (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  // Normally, validate the access token.
  const userInfo = {
    sub: "123",
    name: "John Doe",
    email: "john.doe@example.com",
  };
  res.json(userInfo);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
