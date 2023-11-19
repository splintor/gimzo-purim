import { ChangeEvent, useState } from 'react';
import type { ActionFunctionArgs, MetaFunction } from "@vercel/remix";
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
  const params = Object.fromEntries(formData) as Record<string, string>;
  await saveForm(params);
  await sendToTelegram('Form was submitted with params: ' + JSON.stringify(params));
  return null;
}

export default function Index() {
  const { names } = useLoaderData<typeof loader>();
  const [name, setName] = useState('');
  const [sum, setSum] = useState(750);
  const [sendToAll, setSendToAll] = useState(true);
  const [fadiha, setFadiha] = useState('true');

  return (
    <Form method="post">
      <h1>
        טופס משלוח מנות מושבי
      </h1>
      <h1>
        גמזו - {currentYear}
      </h1>
      <div>
        <label>בחרו את שמכם מהרשימה: </label>
        <input type="hidden" name="sum" value={sum}/>
        <input type="hidden" name="fadiha" value={fadiha}/>
        <select name="senderName" onInput={event => {
          const option = (event.target as HTMLSelectElement)?.selectedOptions[0];
          const name = option.id === '-1' ? '' : option.label;
          setName(name);
        }}>
          <option id="-1">-- יש לבחור שם --</option>
          {names.map((name, index) => <option key={index}>{name}</option>)}
        </select>
      </div>
      {name && (<>
        <div onChange={({ target }: ChangeEvent<HTMLInputElement>) => setSendToAll(target.value === 'all')}>
          <label> האם תרצו לתת משלוחים לכל המושב? </label>

          <div className="radio-button">
            <input type="radio" id="sendToAll" name="basicTarget" value="all" defaultChecked/>
            <label htmlFor="sendToAll">כן, לכולם</label>
          </div>
          <div className="radio-button">
            <input type="radio" id="sendToSpecific" name="basicTarget" value="specific"/>
            <label htmlFor="sendToSpecific">לא, רק למשפחות שאבחר</label>
          </div>
        </div>

        {!sendToAll && (<>
          <div>
            <label> לאיזה משפחות תרצו לתת? </label>
            <button>משפחת לוי</button>
            <button>משפחת כהן</button>
          </div>

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
          </div>
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
        <div>
          <button type="submit">שלח טופס הרשמה ועבור לדף התשלום</button>
        </div>
      </>)}
    </Form>
  );
}
