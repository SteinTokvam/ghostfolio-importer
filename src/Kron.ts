import { fetchRateFromYahoo, fetchSymbolFromYahoo } from "./Yahoo.js";

type KronTransaction = {
  id: string;
  amount: number;
  fund_name: string;
  type: string;
  date: Date;
  status: string;
  report_url: string;
};

type TransactionWithRateAndSymbol = KronTransaction & {
  rate: number | undefined;
  symbol: string | undefined;
};

function getOptions(accessKey: string) {
  return {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKey}`,
    },
  };
}

export async function importKronTransactions(
  account_id: string,
  accessKey: string
): Promise<TransactionWithRateAndSymbol[]> {
  const transactions = await fetch(
    `https://kron.no/api/accounts/${account_id}/transactions`,
    getOptions(accessKey)
  )
    .then((response) => response.json())
    .then((data) => data as KronTransaction[])
    .then((data: KronTransaction[]) =>
      data
        .filter(
          (transaction: KronTransaction) =>
            transaction.type !== "DEP" && transaction.type !== "FEE"
        )
        .filter(
          (transaction: KronTransaction) => transaction.status === "COMPLETED"
        )
    );
  const transactionsAndSymbols = await addSymbolFromYahoo(transactions);

  const ret = [];
  for (const transaction of transactionsAndSymbols) {
    if (transaction.symbol) {
      const rate = await fetchRateFromYahoo(transaction);

      if (rate !== -1) {
        ret.push({
          ...transaction,
          rate: rate,
        });
      } else {
        ret.push({ ...transaction, rate: undefined });
      }
    } else {
      ret.push({ ...transaction, rate: undefined });
    }
  }
  return ret;
}

async function addSymbolFromYahoo(transactions: KronTransaction[]) {
  const symbols = new Map<string, string>();
  for (const transaction of transactions) {
    if (!symbols.has(transaction.fund_name)) {
      const yahoo_symbol = await fetchSymbolFromYahoo({
        name: transaction.fund_name,
        isin: transaction.fund_name,
      });
      if (yahoo_symbol) {
        symbols.set(transaction.fund_name, yahoo_symbol.symbol);
      }
    }
  }
  console.log("Fetched symbols:");
  console.table(symbols);
  return transactions.map((transaction) => {
    return {
      ...transaction,
      symbol: symbols.get(transaction.fund_name),
    };
  });
}
