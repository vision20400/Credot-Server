const express = require("express");
const router = express.Router();

const coupangRouter = require("./coupang/coupangController.js");
const tmonRouter = require("./tmon/tmonController.js");
const wemakepriceRouter = require("./wemakeprice/wmpController.js");

const puppeteer = require("puppeteer");
(async () => {
  global.browser = await puppeteer
    .launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      //args: ["--no-sandbox"]
      //headless: false,
    })
    .then(console.log("pupp open"));
  global.page = await browser.newPage().then(console.log("pupp open"));
})();

router.use("/coupang", coupangRouter);
router.use("/tmon", tmonRouter);
router.use("/wmp", wemakepriceRouter);

module.exports = router;
