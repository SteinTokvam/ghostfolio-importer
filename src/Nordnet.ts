import fs from "fs";
import path from "path";
import { uploadActivities } from "./ghostfolio.js";
import { fetchSymbolFromYahoo } from "./Yahoo.js";

export function readCSV(
  file: string,
  ghostfolio_account_id: string,
  base_currency: string = "NOK",
  ghostfolio_token
) {
  fs.readFile(path.join(process.cwd(), file), "utf16le", async (err, data) => {
    if (err) {
      console.error("Feil ved lesing av fil:", err);
      return;
    }

    // Del opp filen i linjer
    const rows = data.split("\n");

    // Første linje er headere
    const headers = rows[0].split("\t");

    // Resten av linjene er data
    const parsedData = rows.slice(1).map((row: string) => {
      const values = row.split("\t");
      const obj = {} as any;
      headers.forEach((header: string, index: number) => {
        // @ts-ignore
        obj[header.trim().toLowerCase()] = values[index]
          .trim()
          .replaceAll(",", ".");
      });
      return obj;
    });

    const activities = parsedData.map((row) => {
      return {
        id: row.id,
        accountId: ghostfolio_account_id,
        currency: row.valutaend ? row.valutaend : base_currency,
        dataSource: "YAHOO",
        comment:
          row.verdipapir === "YAR" || row.verdipapir === "EQNR"
            ? `${row.verdipapir}.OL`
            : row.verdipapir,
        date: row.handelsdag + "T00:00:00.000Z",
        fee: parseInt(row.kurtasje),
        quantity: parseFloat(row.antall),
        symbol: row.isin,
        type: row.transaksjonstype === "KJØPT" ? "BUY" : "SELL",
        unitPrice: parseFloat(row.kurs.replaceAll(" ", "")),
      };
    });

    const transactions = await addSymbolFromYahoo(activities);
    console.log("Read transactions:");
    console.table(transactions);
    const ghostfolioActivities = await uploadActivities(
      transactions
        .filter((transaction) => transaction.comment !== "eSports Fund")
        .map((transaction) => ({
          accountId: transaction.accountId,
          currency: transaction.currency,
          dataSource: transaction.dataSource,
          comment: transaction.comment + " - " + transaction.id,
          date: transaction.date,
          fee: transaction.fee,
          quantity: transaction.quantity,
          symbol: transaction.symbol,
          type: transaction.type,
          unitPrice: transaction.unitPrice,
        })),
      ghostfolio_token
    );

    const ghostfolioIds = ghostfolioActivities.map(
      (activity: any) => activity.comment.split(" - ")[1]
    );
    // @ts-ignore
    const excluded = [];
    transactions
      .filter((transaction) => !ghostfolioIds.includes(transaction.id))
      .forEach((transaction) => {
        excluded.push(transaction);
      });

    console.log("transactions not imported:");
    // @ts-ignore
    console.table(excluded);
  });
}

async function addSymbolFromYahoo(transactions: any[]) {
  const symbols = new Map<string, string>();
  for (const transaction of transactions) {
    if (!symbols.has(transaction.comment)) {
      const yahoo_symbol = await fetchSymbolFromYahoo({
        name: transaction.comment,
        isin: transaction.symbol,
      });
      if (yahoo_symbol) {
        symbols.set(transaction.comment, yahoo_symbol.symbol);
      }
    }
  }

  console.table(symbols);
  return transactions.map((transaction) => {
    return {
      ...transaction,
      symbol: symbols.get(transaction.comment),
    };
  });
}
