import google from '@googleapis/sheets';
import { GoogleAuth } from 'google-auth-library';
import * as console from 'console';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const namesSheetName = 'שמות';
const namesColumnTitle = 'שם לטופס';

export async function getData() {
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: Buffer.from(process.env.GOOGLE_PRIVATE_KEY as string, 'base64').toString('ascii'),
      },
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const namesSheet = spreadsheet.data.sheets?.find(sheet => sheet.properties?.title === 'שמות');
    const namesSheetTitles = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${namesSheetName}!1:1` });
    const formNameIndex = 1 + namesSheetTitles.data.values?.[0].findIndex((title: string) => title === namesColumnTitle)!;
    const namesValues = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${namesSheetName}!R2C${formNameIndex}:R10000C${formNameIndex}` });
    const names = namesValues.data.values!.map(([name]) => name as string);
    return { names };
  } catch (err) {
    // TODO (developer) - Handle exception
    console.error('ERRRR', err);
    throw err;
  }

}
