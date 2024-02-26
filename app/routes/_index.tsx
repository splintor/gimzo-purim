import { ChangeEvent, useEffect, useState } from 'react';
import { type ActionFunctionArgs, type MetaFunction, redirect } from "@vercel/remix";
import { Form, useLoaderData, useNavigation } from '@remix-run/react';
import { HDate } from '@hebcal/core';
import { getData, saveForm } from '~/googleapis.server';
import { sendToTelegram } from '~/telegram.server';

const currentYear = new HDate().renderGematriya().split(' ').at(-1);

export const meta: MetaFunction = () => {
  return [
    { title: `טופס משלוח מנות מושבי - גמזו - ${currentYear}` },
    { name: "description", content: "טופס משלוח מנות מושבי - גמזו" },
  ];
};

export async function loader() {
  return await getData();
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const params = Object.fromEntries(formData) as Record<string, string | string[]>;
  if (params.names) {
    params.names = formData.getAll('names').map(name => name.toString());
  }
  await saveForm(params);
  const redirectLink = params.link as string;
  delete params.link;
  await sendToTelegram('Form was submitted with params: ' + JSON.stringify(params));
  return redirect(encodeURI(redirectLink));
}

function parseDMYDate(dateString: string) {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function getDateAndTime(dateString: string, timeString: string) {
  const date = parseDMYDate(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  date.setHours(hours, minutes);
  return date;
}

export default function Index() {
  const { state } = useNavigation();
  const { names, settings } = useLoaderData<typeof loader>();
  const [selectedName, setSelectedName] = useState('');
  const [sum, setSum] = useState(750);
  const [sendToAll, setSendToAll] = useState(true);
  const [fadiha, setFadiha] = useState(true);
  const [selectedFamiliesCount, setSelectedFamiliesCount] = useState(0);
  const fadihaEndDate = getDateAndTime(settings['תאריך לסיום הנחת ביטוח פדיחה'], settings['שעה לסיום הנחת ביטוח פדיחה']);

  useEffect(() => {
    let calculatedSum = settings['עלות הזמנה לכל המושב'];
    if (!sendToAll) {
      calculatedSum = settings['עלות הזמנה למשפחה'] * selectedFamiliesCount;

      if (selectedFamiliesCount >= Number(settings['מספר משפחות מינימלי להנחת כמות'])) {
        calculatedSum *= 1 - eval(settings['הנחת כמות'].replace('%', '/100'));
      }

      if (fadiha && new Date() > fadihaEndDate) {
        calculatedSum += Number(settings['עלות ביטוח פדיחה']);
      }
    }
    setSum(calculatedSum);
  }, [sendToAll, selectedFamiliesCount, fadiha, fadihaEndDate, settings]);

  useEffect(() => {
    // reset form on browser back button
    const senderNameDropDown = document.getElementsByName('senderName')[0] as HTMLSelectElement;
    if (!selectedName && senderNameDropDown?.selectedIndex > 0) {
      senderNameDropDown.selectedIndex = 0;
    }

    const storedName = window.localStorage?.getItem('senderName');
    const storedNameIndex = storedName && names.indexOf(storedName);
    if (storedNameIndex) {
      setSelectedName(storedName);
      senderNameDropDown.selectedIndex = storedNameIndex + 1;
    }
  }, []);

  const endDate = getDateAndTime(settings['תאריך לסיום הרשמה'], settings['שעה לסיום הרשמה']);
  if (endDate < new Date()) {
    return (<div className="end-message">
      <div>
        <svg width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="48" cy="48" r="48" fill="#FFB629" fillOpacity=".25"></circle>
          <path className="triangle"
                d="M55.528 21.002c-2.35-4.028-7.552-5.455-11.58-3.105a9.159 9.159 0 0 0-3.105 3.105L17.935 60.693c-2.35 4.028-.923 9.23 3.105 11.58a8.407 8.407 0 0 0 4.28 1.175h45.9c4.7 0 8.475-3.776 8.475-8.475 0-1.51-.42-2.937-1.174-4.28L55.528 21.002Zm-7.3 45.649a3.366 3.366 0 0 1-3.357-3.357 3.366 3.366 0 0 1 3.357-3.356 3.366 3.366 0 0 1 3.356 3.356 3.367 3.367 0 0 1-3.356 3.357Zm3.356-15.272a3.366 3.366 0 0 1-3.356 3.356 3.366 3.366 0 0 1-3.357-3.356V31.91a3.366 3.366 0 0 1 3.357-3.357 3.366 3.366 0 0 1 3.356 3.357v19.468Z"
                fill="#FFA217"></path>
        </svg>
      </div>
      <div>ההרשמה למשלוח המנות של גמזו לשנת {currentYear} נסגרה.<br/><br/>חג שמח!</div>
    </div>);
  }

  return (
    <Form method="post">
      <h1>
        טופס משלוח מנות מושבי
      </h1>
      <h1>
        גמזו - {currentYear}
      </h1>
      <div>
        <label>שם השולח: </label>
        <input type="hidden" name="sum" value={sum}/>
        <input type="hidden" name="link"
               value={settings['קישור לתשלום'] + '?sum=' + sum + '&subscribers_name=' + selectedName + '&description=משלוח מנות מושבי'}/>
        <select name="senderName" onInput={event => {
          const option = (event.target as HTMLSelectElement)?.selectedOptions[0];
          const name = option.id === '-1' ? '' : option.label;
          setSelectedName(name);
          window.localStorage?.setItem('senderName', name);
        }}>
          <option id="-1">-- יש לבחור שם --</option>
          {names.map((name, index) => <option key={index}>{name}</option>)}
        </select>
      </div>
      {selectedName && (<>
        <div onChange={({ target }: ChangeEvent<HTMLInputElement>) => setSendToAll(target.value === 'all')}>
          <label> האם תרצו לתת משלוחים לכל המושב? </label>

          <div className="radio-button">
            <input type="radio" id="sendToAll" name="basicTarget" value="all" form="" defaultChecked/>
            <label htmlFor="sendToAll">כן, לכולם</label>
          </div>
          <div className="radio-button">
            <input type="radio" id="sendToSpecific" name="basicTarget" value="specific" form=""/>
            <label htmlFor="sendToSpecific">לא, רק למשפחות שאבחר</label>
          </div>
        </div>

        {!sendToAll && (<>
          <div className="fadiha-promise">
            <label>ביטוח פדיחה זמין רק למי שבחר {settings['מספר משפחות מינימלי לביטוח פדיחה']} משפחות או יותר.</label>
          </div>
          <div>
            <label> לאיזה משפחות תרצו לתת? </label>
            {selectedFamiliesCount > 0 && <div id="families-counter"><span>{
              selectedFamiliesCount === 1
                ? <span>משפחה <b>אחת</b> נבחרה</span>
                : <span><b>{selectedFamiliesCount}</b> משפחות נבחרו</span>
            }
              <span> - הסכום לתשלום: <b>{sum} ₪</b></span>
            </span></div>}

            <div className="families-selection"
                 onChange={() => setSelectedFamiliesCount(document.querySelectorAll('input[name=names]:checked').length,
                 )}>
              {names.filter(name => name !== selectedName).map(name => (
                <span key={`checkbox-${name}`}>
                  <input type="checkbox" name="names" id={name} value={name}/>
                  <label htmlFor={name}><span>{name}</span></label>
                </span>),
              )}
            </div>

          </div>

          {fadihaEndDate > new Date() && selectedFamiliesCount >= Number(settings['מספר משפחות מינימלי לביטוח פדיחה']) && (
            <div onChange={({ target }: ChangeEvent<HTMLInputElement>) => setFadiha(target.value === 'כן')}>
              <label>ביטוח פדיחה:</label>

              <div className="radio-button">
                <input type="radio" id="fadihaYes" name="fadiha" value="כן" defaultChecked/>
                <label htmlFor="fadihaYes">כן, אנחנו מעוניינים בביטוח פדיחה</label>
              </div>
              <div className="radio-button">
                <input type="radio" id="fadihaNo" name="fadiha" value="לא"/>
                <label htmlFor="fadihaNo">לא, אין צורך בביטוח פדיחה</label>
              </div>

              {fadiha ? new Date() > fadihaEndDate ?
                <div className="fadiha-cost">משנכנס אדר, סימון ביטוח פדיחה מוסיף אוטומטית עוד
                  ₪{settings['עלות ביטוח פדיחה']} לסכום
                  התשלום.</div> : <div className="fadiha-gain">הרווחת ביטוח פדיחה חינם... כל הכבוד...</div> : null}
            </div>
          )}
        </>)}

        <div>
          <label> הסכום לתשלום: </label>
          <label className="price">{sum} ₪</label>
        </div>
        <div>
          <label className="footer">
            התשלום הינו תנאי הכרחי להפעלת הרשימה שבחרתם.
          </label>
        </div>
        <div className="submit-section">
          <button type="submit" disabled={!sendToAll && selectedFamiliesCount === 0 || state === 'submitting'}>
            {state === 'submitting' ? 'שולח, נא להמתין...' : 'שלח טופס הרשמה ועבור לדף התשלום'}
          </button>
        </div>
      </>)}
    </Form>
  );
}
