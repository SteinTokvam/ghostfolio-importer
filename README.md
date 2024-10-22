# ghostfolio-importer
 Typescript + node application to import transactions from Nordnet and Kron to [ghostfolio](https://ghostfol.io).

## Usage

```bash
nvm use
npm install
npm start
```

The program will try to match your transactions with a symbol from yahoo and use the closing rate of the day. Transactions it hasn't imported will be listed.

For Nordnet the file will have several "Valuta" fields. the third one will be the one used since that is the one I found to use correct currency. Since there are several "Valuta" fields the current version will expect that one to be renamed to "valutaend".

## Contribute

Contributions of all kinds are wellcome! Either by creating issues or by opening pull requests.

### Issue Tracker
Feel free to open an issue for bugs, feature requests, or questions, but please check the open issues first.
