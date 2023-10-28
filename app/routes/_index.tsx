import type { MetaFunction } from "@vercel/remix";
import { HDate } from '@hebcal/core';
import { useLoaderData } from '@remix-run/react';

const currentYear = new HDate().renderGematriya().split(' ')[2];

export const meta: MetaFunction = () => {
  return [
    { title:  `טופס משלוח מנות מושבי - גמזו - ${currentYear}` },
    { name: "description", content: "טופס משלוח מנות מושבי - גמזו" },
  ];
};

export async function loader() {
  console.log('loader', process.env.GOOGLE_API_KEY);
  return process.env.GOOGLE_API_KEY;
}


export default function Index() {
  const data = useLoaderData<typeof loader>();
  console.log('APP', data);

  return (
    <form>
      <h1>
        טופס משלוח מנות מושבי - גמזו - {currentYear}
      </h1>
      <div>
        <label>בחר את שמך מהרשימה: </label>
        <select><option>aaaa</option></select>
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
