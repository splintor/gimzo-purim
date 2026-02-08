import google from '@googleapis/sheets';
import { GoogleAuth } from 'google-auth-library';
import { sendToTelegram } from '~/telegram.server';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const namesSheetName = 'שמות';
const lastYearSheetName = new Date().getFullYear() - 1;
const registrationsSheetName = 'הרשמות';
const shippingSheetName = 'משלוחים';
const settingsSheetName = 'הגדרות';
const namesColumnTitle = 'שם לטופס';
const nameColumnTitle = 'שם';
const fadihaColumnTitle = 'ביטוח פדיחה';
const familiesColumnTitle = 'משפחות';
const linkColumnTitle = 'קישור';

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

function getValueByColumnName(row: string[] | undefined, columns: string[], columnName: string) {
  if (!row) {
    return null;
  }
  const index = columns.indexOf(columnName);
  return index >= 0 ? row[index] : null;
}

export async function getData(initialValuesHash: string | null) {
  try {
    const sheets = getGoogleSheets();
    const namesSheetTitles = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${namesSheetName}!1:1` });
    const formNameIndex = 1 + namesSheetTitles.data.values?.[0].findIndex((title: string) => title === namesColumnTitle)!;
    const namesValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${namesSheetName}!R2C${formNameIndex}:C${formNameIndex}`,
    });
    const names = namesValues.data.values!.map<string>(([name]) => name).sort();

    const settingsColumns = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${settingsSheetName}!A:B` });
    const settings = Object.fromEntries(settingsColumns.data.values as any);
    let initialValues: { name: string, fadiha: boolean, families: string[] } | undefined;

    if (initialValuesHash) {
      const lastYearNamesSheetTitlesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${lastYearSheetName}!1:1`,
      });
      const lastYearNamesSheetTitles = lastYearNamesSheetTitlesResponse.data.values?.[0] ?? [];
      const linkIndex = 1 + lastYearNamesSheetTitles.findIndex((title: string) => title === linkColumnTitle)!;
      const links = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${lastYearSheetName}!R2C${linkIndex}:C${linkIndex}`,
      });

      const linkRow = 2 + links.data.values!.findIndex(([link]: string[]) => link?.endsWith(initialValuesHash));
      const initialValuesRowResponse = linkRow >= 2 ? await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${lastYearSheetName}!${linkRow}:${linkRow}`,
      }) : null;

      const initialValuesRow = initialValuesRowResponse?.data.values?.[0];

      const name = getValueByColumnName(initialValuesRow, lastYearNamesSheetTitles, nameColumnTitle)!;
      const fadiha = getValueByColumnName(initialValuesRow, lastYearNamesSheetTitles, fadihaColumnTitle) === 'כן';
      const families = getValueByColumnName(initialValuesRow, lastYearNamesSheetTitles, familiesColumnTitle)?.split(',').filter(Boolean) ?? [];
      initialValues = { name, fadiha, families };
    }

    return { names, settings, initialValues };
  } catch (err) {
    console.error('Failed to get list of names', err);
    await sendToTelegram(`Failed to get list of names: ${err}`);
    throw err;
  }
}

export async function saveForm({ senderName, fadiha = 'לא', names = [], sum }: Record<string, string | string[]>) {
  try {
    if (process.env.DO_NOT_SAVE_TO_WORKSHEET) {
      console.log('Note: DO_NOT_SAVE_TO_WORKSHEET env var is set to true - skipping saving to worksheet.');
      return;
    }

    const sheets = getGoogleSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${registrationsSheetName}!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: [[new Date().toISOString(), senderName, fadiha, (names as string[]).join(','), Number(sum)]] },
    });
    void processShipping(sheets);
  } catch (err) {
    console.error('Failed to add submission', err);
    await sendToTelegram(`Failed to add submission for ${senderName} with names (${names}): ${err}`);
    throw err;
  }
}

export async function updateShipping() {
  try {
    const sheets = getGoogleSheets();
    await processShipping(sheets);
  } catch (err) {
    console.error('Failed to update shipping', err);
    await sendToTelegram(`Failed to update shipping: ${err}`);
    throw err;
  }
}

interface ResultRecord {
  name: string;
  to: string;
  toAll: boolean;
  from: Map<string, boolean>; // boolean indicates if by fadiha
  sortedFrom?: [string, boolean][]; // boolean indicates if by fadiha
  fadiha: boolean;
  fadihaCount: number | undefined;
}

async function processShipping(sheets: ReturnType<typeof getGoogleSheets>): Promise<void> {
  try {
    const registrationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${registrationsSheetName}!A:E`,
    });
    const namesSheetTitles = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${namesSheetName}!1:1` });
    const formNameIndex = 1 + namesSheetTitles.data.values?.[0].findIndex((title: string) => title === namesColumnTitle)!;
    const namesValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${namesSheetName}!R2C${formNameIndex}:C${formNameIndex}`,
    });
    const namesSet = new Set(namesValues.data.values!.map<string>(([name]) => name));
    const registrationRows = registrationsResponse.data.values as string[][] ?? [];
    const registrations = registrationRows.slice(1).map((row) => ({
      name: row[1],
      fadiha: row[2] === 'כן',
      names: row[3],
      sum: row[4],
    })).filter(({ name }) => name);

    const result: Record<string, ResultRecord> = {};
    for (const registration of registrations) {
      const existing = result[registration.name];
      result[registration.name] = {
        name: registration.name,
        to: registration.names && (existing?.to ? `${existing.to},${registration.names.trim()}` : registration.names.trim()),
        toAll: !registration.names,
        from: new Map(),
        fadiha: registration.fadiha,
        fadihaCount: registration.fadiha ? 0 : undefined,
      };
    }

    for (const record of Object.values(result)) {
      if (record.to) {
        const toNames = new Set(record.to.split(',').map(s => s.trim()));

        for (const toName of toNames) {
          if (!(toName in result)) {
            if (!namesSet.has(toName)) {
              await sendToTelegram(`Unknown name in registration of ${record.name}: ${toName}`);
            }
            result[toName] = {
              name: toName,
              to: '',
              toAll: false,
              from: new Map(),
              fadiha: false,
              fadihaCount: undefined,
            };
          }
          result[toName].from.set(record.name, false);
        }
      }
    }

    const records = Object.values(result);

    // For each record that is sent to all, add to all other records as sender
    for (const record of records.filter(({ toAll }) => toAll)) {
      for (const targetRecord of records) {
        if (targetRecord != record) {
          targetRecord.from.set(record.name, false);
        }
      }
    }

    // for each record that has fadiha, add to all records that send to it
    for (const record of records.filter(({ fadiha }) => fadiha)) {
      for (const [resultFromName] of record.from) {
        if (!result[resultFromName].from.has(record.name)) {
          result[resultFromName].from.set(record.name, true);
          ++record.fadihaCount!;
        }
      }
    }

    // update sortedFrom field
    records.forEach(record =>
      record.sortedFrom = [...record.from.entries()].sort(([a], [b]) => a.localeCompare(b)));

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${shippingSheetName}!2:10000`,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${shippingSheetName}!A:A`,
      valueInputOption: 'RAW',
      requestBody: {
        values: records
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((record) => [record.name, record.fadihaCount, ...record.sortedFrom!.map(([name]) => name)]),
      },
    });

    const colorRows = [
      {
        values: [
          {
            userEnteredFormat: {
              backgroundColor: {
                red: 1,
                green: 1,
                blue: 0,
              },
            },
          },
        ],
      },
    ];

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const shippingSheetID = spreadsheet.data.sheets?.find(sheet => sheet.properties?.title === shippingSheetName)?.properties?.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          updateCells: {
            range: {
              sheetId: shippingSheetID,
              startRowIndex: 1,
            },
            fields: 'userEnteredFormat.backgroundColor',
            rows: [
              {
                values: [
                  {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 1,
                        green: 1,
                        blue: 1,
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
          ...records.map((record, recordIndex) =>
            record.sortedFrom!
              .map(([, fadiha], fromIndex) => fadiha ? {
                updateCells: {
                  range: {
                    sheetId: shippingSheetID,
                    startRowIndex: recordIndex + 1,
                    endRowIndex: recordIndex + 2,
                    startColumnIndex: fromIndex + 2,
                    endColumnIndex: fromIndex + 3,
                  },
                  fields: 'userEnteredFormat.backgroundColor',
                  rows: colorRows,
                },
              } : null as any)).flat().filter(Boolean),

        ],
      },
    });
  } catch (err) {
    console.error('Failed to process shipping', err);
    await sendToTelegram(`Failed to process shipping: ${err}`);
    throw err;
  }
}
