import { ChangeEvent, useEffect, useState } from 'react';
import { type ActionFunctionArgs, type MetaFunction, redirect } from "@vercel/remix";
import { Form, useLoaderData } from '@remix-run/react';
import { HDate } from '@hebcal/core';
import { getData, saveForm } from '~/googleapis.server';
import { sendToTelegram } from '~/telegram.server';

const currentYear = new HDate().renderGematriya().split(' ')[2];

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

const Header = ({ currentYear }: { currentYear: string }) => (<><h1>
  טופס משלוח מנות מושבי
</h1>
  <h1>
    גמזו - {currentYear}
  </h1></>);

export default function Index() {
  const { names, settings } = useLoaderData<typeof loader>();
  const [selectedName, setSelectedName] = useState('');
  const [sum, setSum] = useState(750);
  const [sendToAll, setSendToAll] = useState(true);
  const [fadiha, setFadiha] = useState('true');
  const [selectedFamiliesCount, setSelectedFamiliesCount] = useState(0);
  const fadihaEndDate = new Date(`${settings['תאריך לסיום הנחת ביטוח פדיחה']} ${settings['שעה לסיום הנחת ביטוח פדיחה']}`);

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
  }, [sendToAll, selectedFamiliesCount]);

  const endDate = new Date(`${settings['תאריך לסיום הרשמה']} ${settings['שעה לסיום הרשמה']}`);
  if (endDate < new Date()) {
    return (<Form method="post">
      <Header currentYear={currentYear}/>
      <div className="end-message">ההרשמה נגמרה לשנת {currentYear}</div>
    </Form>);
  }

  return (
    <Form method="post">
      <Header currentYear={currentYear}/>
      <div>
        <label>בחרו את שמכם מהרשימה: </label>
        <input type="hidden" name="sum" value={sum}/>
        <input type="hidden" name="link"
               value={settings['קישור לתשלום'] + '?sum=' + sum + '&subscribers_name=' + selectedName + '&description=משלוח מנות מושבי'}/>
        <select name="senderName" onInput={event => {
          const option = (event.target as HTMLSelectElement)?.selectedOptions[0];
          const name = option.id === '-1' ? '' : option.label;
          setSelectedName(name);
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

            <div className="families-selection"
                 onChange={() => setSelectedFamiliesCount(document.querySelectorAll('input[name=names]:checked').length,
                 )}>
              {names.filter(name => name !== selectedName).map(name => (
                <span><input type="checkbox" name="names" id={name} key={`checkbox-${name}`}
                             value={name}/><label
                  htmlFor={name}><span>{name}</span></label></span>))}
            </div>

            <div>{selectedFamiliesCount === 1 ? 'משפחה אחת נבחרה' : selectedFamiliesCount > 1 ? `${selectedFamiliesCount} משפחות נבחרו` : ''}</div>
          </div>

          {fadihaEndDate > new Date() && selectedFamiliesCount >= Number(settings['מספר משפחות מינימלי לביטוח פדיחה']) && (
            <div onChange={({ target }: ChangeEvent<HTMLInputElement>) => setFadiha(target.value)}>
              <label>ביטוח פדיחה:</label>

              <div className="radio-button">
                <input type="radio" id="fadihaYes" name="fadiha" value="true" defaultChecked/>
                <label htmlFor="fadihaYes">כן, אנחנו מעוניינים בביטוח פדיחה</label>
              </div>
              <div className="radio-button">
                <input type="radio" id="fadihaNo" name="fadiha" value="false"/>
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
          <label className={'price'}>{sum} ₪</label>
        </div>
        <div>
          <label className="footer">
            התשלום הינו תנאי הכרחי להפעלת הרשימה שבחרתם.
          </label>
        </div>
        <div className="submit-section">
          <button type="submit" disabled={!sendToAll && selectedFamiliesCount === 0}>שלח טופס הרשמה ועבור לדף התשלום
          </button>
        </div>
      </>)}
    </Form>
  );
}
