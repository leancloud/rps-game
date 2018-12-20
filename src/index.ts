import express = require("express");
import apiRoute from "./server";

const app = express();

app.use("/api", apiRoute);
app.use(express.static("dist/client"));

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
