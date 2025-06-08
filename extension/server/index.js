const express = require("express");
const app = express();
require("dotenv").config();

const oauthRoutes = require("./routes/oauth");
app.use("/oauth", oauthRoutes);

app.listen(8080, () => console.log("Server running on http://localhost:8080"));
