import { uploadActivities } from "./ghostfolio.js";
import { importKronTransactions } from "./Kron.js";
import { readCSV } from "./Nordnet.js";

(() => {
  if (process.argv.length < 3) {
    console.log("Usage: npm start <Kron|Nordnet> <options> <ghostfolio_token>");
    console.log("Options depends on the import type...");
    console.log("Example: npm start Nordnet nordnet.csv d99d9a00-b9df-4881-9b3d-50a0a0451301 NOK eysdfsdfdf");
    console.log("Example: npm start Kron 82ac268e-9810-4c42-965b-84dfdbf67888 f90698c7-4c14-4499-ad64-6ded476eca03 cc2d6756-6609-4c59-8a24-a168241730b7 eysdfsdfdf");
  }

  const importType = process.argv[2];

  if (importType === "Kron") {
    if (process.argv.length < 7) {
      console.log(
        "Usage: npm start <Kron|Nordnet> <kron_account_id> <kron_access_key> <ghostfolio_account_id>"
      );
      return;
    }
    importKronTransactions(process.argv[3], process.argv[4]).then(
      async (transactions) => {
        console.log("Fetched transactions:");
        console.table(transactions);
        const activities = transactions
          .map((transaction) => {
            const rate = transaction.rate === undefined ? 1 : transaction.rate;
            const activity = {
              accountId: process.argv[5],
              currency: "NOK",
              dataSource: "YAHOO",
              comment: `${transaction.fund_name} : ${transaction.id}`,
              date: transaction.date + "T00:00:00.000Z",
              fee: 0,
              quantity: Math.abs(transaction.amount) / rate,
              symbol: transaction.symbol,
              type: transaction.type,
              unitPrice: rate,
            };
            return activity;
          })
          .filter((activity) => activity.unitPrice !== 1);
        console.table(activities);

        const ghostfolioActivities = await uploadActivities(activities, process.argv[6]);

        const ghostfolioIds = ghostfolioActivities.map(
          (activity: any) => activity.comment.split(" : ")[1]
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
      }
    );
  } else if (importType === "Nordnet") {
    if (process.argv.length < 6) {
      console.log(
        "Usage: npm start Nordnet <filename> <ghostfolio_account_id> <base_currency>"
      );
      return;
    }
    readCSV(process.argv[3], process.argv[4], process.argv[5], process.argv[6]);
  }
})();
