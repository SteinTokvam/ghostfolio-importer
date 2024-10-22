export async function fetchSymbolFromYahoo(symbol: {
  name: string;
  isin: string;
}) {
  var fetchResult = await doFetch(symbol.name);
  
  if (fetchResult.quotes.length === 0) {
    fetchResult = await doFetch(symbol.isin);
  }
  const res = fetchResult.quotes.filter((quote: any) => {
    return quote.longname
      ? quote.longname.toLowerCase().trim() ===
          symbol.name.toLocaleLowerCase().trim()
      : quote.shortname.toLowerCase().trim() ===
          symbol.name.toLocaleLowerCase().trim();
  })[0];
  if (res) {
    return res;
  }
  return fetchResult.quotes[0];
}

async function doFetch(name: string) {
  return await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${name}&lang=en-US&quotesCount=2&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
  ).then((response) => response.json());
}

const rates = new Map();

export async function fetchRateFromYahoo(transaction: any) {
  const dateUnix = Math.floor(new Date(transaction.date).getTime() / 1000);
  const dateUnixEnd = Math.floor(
    new Date(transaction.date).getTime() / 1000 + 3600 * 24
  );
  if (
    rates.has(transaction.symbol) &&
    rates.get(transaction.symbol).date.includes(transaction.date)
  ) {
    const rate = rates.get(transaction.symbol).rate[
      rates.get(transaction.symbol).date.indexOf(transaction.date)
    ];
    return rate;
  }

  const res = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/chart/${transaction.symbol}?period1=${dateUnix}&period2=${dateUnixEnd}&interval=1d&includePrePost=true&events=div|split|earn&&lang=en-US&region=US`
  ).then((response) => response.json());

  if (Object.keys(res.chart.result[0].indicators.quote[0]).length === 0) {
    return -1;
  }

  if (rates.has(transaction.symbol)) {
    rates.get(transaction.symbol).date.push(transaction.date);
    rates
      .get(transaction.symbol)
      .rate.push(res.chart.result[0].indicators.quote[0].close[0]);
  } else {
    rates.set(transaction.symbol, {
      rate: [res.chart.result[0].indicators.quote[0].close[0]],
      date: [transaction.date],
    });
  }
  return res.chart.result[0].indicators.quote[0].close[0];
}
