require("dotenv").config();
const puppeteer = require("puppeteer");
const Json2csvParser = require("json2csv").Parser;
var fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const url =
    "https://www.amazon.in/ap/signin?openid.return_to=https%3A%2F%2Fwww.amazon.in%2F%3Fie%3DUTF8%26tag%3Dgooginabkkenshoo-21%26ascsubtag%3D_k_EAIaIQobChMIqOmbwaL-3wIVjoKRCh2NTABIEAAYASAAEgJ82PD_BwE_k_%26gclid%3DEAIaIQobChMIqOmbwaL-3wIVjoKRCh2NTABIEAAYASAAEgJ82PD_BwE%26ref_%3Dnav_ya_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&&openid.pape.max_auth_age=0";
  await page.goto(url);

  const USERNAME_SELECTOR = "#ap_email";
  const BUTTON_SELECTOR = "#continue";
  const PASSWORD_SELECTOR = "#ap_password";
  const LOGIN_SELCTOR = "#signInSubmit";

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(process.env.EMAIL);

  await page.click(BUTTON_SELECTOR);

  await page.waitForNavigation();

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(process.env.PASSWORD);

  await page.click(LOGIN_SELCTOR);

  const searchString = process.env.searchString;
  const searchKey = searchString.split(" ").join("+");
  const searchUrl = `https://www.amazon.in/s/ref=nb_sb_ss_c_1_9?url=search-alias%3Daps&field-keywords=${searchKey}&sprefix=bean+bags%2Caps%2C284&crid=1UWE6008KVVN`;

  await page.goto(searchUrl);
  await page.waitFor(2 * 1000);

  let index = 3;

  let scrapeData = async () => {
    const data = await page.evaluate(() => {
      return {
        title: Array.from(document.querySelectorAll("h2")).map(ele =>
          ele.innerText
            .trim()
            .split("[Sponsored]")
            .join("")
            .split("\n")
            .join("")
        ),
        price: Array.from(
          document.querySelectorAll(
            "span.a-size-base.a-color-price.s-price.a-text-bold"
          )
        ).map(ele =>
          Number(
            ele.innerText
              .trim()
              .split(",")
              .join("")
          )
        )
      };
    });
    const fields = ["title", "price"];
    let myData = [];
    for (let i = 0; i < data.title.length; i++) {
      myData.push({ title: data.title[i], price: data.price[i] });
    }

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(myData);

    //console.log(csv);

    fs.writeFile("data.csv", csv, { encoding: "utf8", flag: "a" }, function(
      err
    ) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved."
        );
      } else {
        console.log("It's saved!!!");
      }
    });
  };

  await scrapeData();
  browser.close();
  //   let hyperLoop = async () => {
  //     try {
  //       await page.click(`#pagn > span:nth-child(${index}) > a`);
  //       await scrapeData(page);
  //       index++;
  //     } catch (err) {
  //       console.log(err);
  //       console.log("No more pages!!!!!!!");
  //       browser.close();
  //       return;
  //     }
  //   };
  //   hyperLoop(); // HyperLoop function calls itself again and again and visits the pages
})();
