import { tabletojson } from "tabletojson";
import { MongoClient } from "mongodb";
import "dotenv/config";

let urlApi = "https://finance.naver.com/sise/sise_market_sum.naver";
let urlApiScr = process.env.API_URL;
let page2 = "%3F%26page%3D2";

async function main() {
  let jsonTable = "";
  await tabletojson.convertUrl(urlApiScr, function (tablesAsJson) {
    console.log(tablesAsJson[1]);
    jsonTable = tablesAsJson[1];
  });

  let jsonTableCln = JSON.stringify(jsonTable)
    .replaceAll("\\t", "")
    .replaceAll("\\n", "");
  console.log("jsonTableCln = " + jsonTableCln);

  let table = JSON.parse(jsonTableCln);
  console.log("table = " + table);

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log("Connected successfully to DB server");
  const db = client.db("dbFF");
  const collection = db.collection("colKospi");

  for await (const e of table) {
    if (Number(e.N) == 0) {
      continue;
    }
    console.log("e = " + JSON.stringify(e));
    let eFilter = {};
    let eX = {};
    eX.N = Number(e.N);
    eX.stockNm = e.종목명;
    eX.stockCap = Number(e.시가총액.replaceAll(",", ""));
    eFilter.N = eX.N;
    console.log("eFlt = " + JSON.stringify(eFilter));
    console.log("eX = " + JSON.stringify(eX));
    await collection.updateOne(eFilter, { $set: eX }, { upsert: true });
  }

  client.close();
}

main();
