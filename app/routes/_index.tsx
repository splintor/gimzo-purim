import type { MetaFunction } from "@vercel/remix";
import { HDate } from '@hebcal/core';
import { useLoaderData } from '@remix-run/react';
import { getData } from '~/googleapis.server';

const currentYear = new HDate().renderGematriya().split(' ')[2];

export const meta: MetaFunction = () => {
  return [
    { title:  `טופס משלוח מנות מושבי - גמזו - ${currentYear}` },
    { name: "description", content: "טופס משלוח מנות מושבי - גמזו" },
  ];
};

export async function loader() {
  return await getData();
}

export default function Index() {
  const { names } = useLoaderData<typeof loader>();

  return (
    <form>
      <h1>
        טופס משלוח מנות מושבי - גמזו - {currentYear}
      </h1>
      <div>
        <label>בחר את שמך מהרשימה: </label>
        <select>{names.map(name => <option>{name}</option>)}</select>
      </div>
      <div>
        <label> האם תרצו לתת משלוחים לכל המושב? </label>
        <button>כן, לכולם</button>
        <button>לא, רק למשפחות שאבחר</button>
      </div>
      <div>
        <label>  לאיזה משפחות תרצו לתת? </label>
        <button>משפחת לוי</button>
        <button>משפחת כהן</button>
      </div>
      <div>
        <label> הסכום לתשלום: </label>
        <label className={'price'}>750 ₪</label>
      </div>
      <div>
        <label className="footer">
          התשלום הינו תנאי הכרחי להפעלת הרשימה שבחרתם.
        </label>
      </div>
    </form>
  );
}
