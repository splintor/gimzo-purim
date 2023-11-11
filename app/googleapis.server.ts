import google from '@googleapis/sheets';
import { GoogleAuth } from 'google-auth-library';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const namesSheetName = 'שמות';
const registrationsSheetName = 'הרשמות';
const namesColumnTitle = 'שם לטופס';

function getGoogleSheets() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: Buffer.from(process.env.GOOGLE_PRIVATE_KEY as string, 'base64').toString('ascii'),
    },
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getData() {
  try {
    const sheets = getGoogleSheets();
    const namesSheetTitles = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${namesSheetName}!1:1` });
    const formNameIndex = 1 + namesSheetTitles.data.values?.[0].findIndex((title: string) => title === namesColumnTitle)!;
    const namesValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${namesSheetName}!R2C${formNameIndex}:C${formNameIndex}`,
    });
    const names = namesValues.data.values!.map(([name]) => name as string);
    return { names };
  } catch (err) {
    console.error('Failed to get list of names', err);
    throw err;
  }
}


export async function saveForm({ senderName, fadiha, names, sum }: Record<string, string>) {
  try {
    const sheets = getGoogleSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${registrationsSheetName}!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: [[new Date().toISOString(), senderName, fadiha, names, (names || '').split(',').length, sum]] },
    });
  } catch (err) {
    console.error('Failed to add submission', err);
    throw err;
  }
}
