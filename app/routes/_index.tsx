import { useEffect, useState } from 'react';
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

  useEffect(() => {
    console.log('name', name);
  }, [name]);

  return (
    <Form method="post">
      <h1>
        טופס משלוח מנות מושבי - גמזו - {currentYear}
      </h1>
      <div>
        <label>בחר את שמך מהרשימה: </label>
        <input type="hidden" name="sum" value={sum}/>
        <select name="senderName" onInput={event => {
          const option = (event.target as HTMLSelectElement)?.selectedOptions[0];
          const name = option.id === '-1' ? '' : option.label;
          setName(name);
        }}>
          <option id="-1">יש לבחור את שמכם מהרשימה</option>
          {names.map((name, index) => <option key={index}>{name}</option>)}
        </select>
      </div>
      {name && (<>
          <div>
            <label> האם תרצו לתת משלוחים לכל המושב? </label>
            <button>כן, לכולם</button>
            <button>לא, רק למשפחות שאבחר</button>
          </div>
          <div>
            <label> לאיזה משפחות תרצו לתת? </label>
            <button>משפחת לוי</button>
            <button>משפחת כהן</button>
          </div>
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
        </>
      )}
    </Form>
  );
}
