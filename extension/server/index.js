const express = require("express");
const cors = require('cors');
const app = express();
require("dotenv").config();

// ✅ 加上 middleware：順序非常重要
app.use(cors());
app.use(express.json());

const oauthRoutes = require("./routes/oauth");
app.use("/oauth", oauthRoutes);

app.listen(8080, () => console.log("Server running on http://localhost:8080"));
