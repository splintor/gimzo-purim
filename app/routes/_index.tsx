import { type ChangeEvent, FormEvent, type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import { type ActionFunctionArgs, type MetaFunction, redirect } from "@vercel/remix";
import { Form, useFetcher, useLoaderData, useNavigation } from '@remix-run/react';
import { HDate } from '@hebcal/core';
import { UAParser } from 'ua-parser-js';
import { getData, saveForm } from '~/googleapis.server';
import { sendToTelegram } from '~/telegram.server';
import { SearchSVG } from '~/SearchSVG';
import { CloseSVG } from '~/CloseSVG';

const currentYear = new HDate().renderGematriya().split(' ').at(-1);

export const meta: MetaFunction = () => {
  return [
    { title: `טופס משלוח מנות מושבי - גמזו - ${currentYear}` },
    { name: "description", content: "טופס משלוח מנות מושבי - גמזו" },
  ];
};

export function loader() {
  return getData();
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const params = Object.fromEntries(formData) as Record<string, string | string[]>;
  const { browser, os, device } = new UAParser(request.headers.get('User-Agent') as string).getResult();
  params.browser = `${browser.name} (${os.name}, ${device.model})`;
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
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
  const yearToUse = year < 100 ? year + currentCentury : year;
  return new Date(yearToUse, month - 1, day);
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchString, setSearchString] = useState<string>();
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedFamiliesCount, setSelectedFamiliesCount] = useState(0);
  const fadihaEndDate = getDateAndTime(settings['תאריך לסיום הנחת ביטוח פדיחה'], settings['שעה לסיום הנחת ביטוח פדיחה']);
  const fadihaCost = Number(settings['עלות ביטוח פדיחה']);
  const minimumForFadiha = Number(settings['מספר משפחות מינימלי לביטוח פדיחה']);
  const fetcher = useFetcher({ key: 'logger' });
  const [previouslySelectedNames, setPreviouslySelectedNames] = useState<Set<string>>();
  const [previouslySelectedDate, setPreviouslySelectedDate] = useState<Date>();
  const [showPreviouslySelected, setShowPreviouslySelected] = useState(false);

  useEffect(() => {
    let calculatedSum = settings['עלות הזמנה לכל המושב'];
    if (!sendToAll) {
      calculatedSum = settings['עלות הזמנה למשפחה'] * selectedFamiliesCount;

      if (selectedFamiliesCount >= Number(settings['מספר משפחות מינימלי להנחת כמות'])) {
        calculatedSum *= 1 - eval(settings['הנחת כמות'].replace('%', '/100'));
      }

      if (fadiha && new Date() > fadihaEndDate && selectedFamiliesCount >= minimumForFadiha) {
        calculatedSum += fadihaCost;
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
    if (senderNameDropDown && storedNameIndex) {
      setSelectedName(storedName);
      senderNameDropDown.selectedIndex = storedNameIndex + 1;
    }
  }, []);

  useEffect(() => {
    setPreviouslySelectedNames(new Set(window.localStorage?.getItem('names')?.split(',').filter(Boolean) || []));
    setPreviouslySelectedDate(new Date(window.localStorage?.getItem('names-date') ?? new Date()));
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

  function sendToLog(message: string) {
    fetcher.submit({
      message,
    }, {
      action: '/logger',
      method: 'POST',
    });

  }

  function showSearchElement(event: MouseEvent) {
    event.preventDefault();
    setShowSearch(true);
    setTimeout(() => searchRef.current?.focus(), 10);
    sendToLog(`${selectedName} הציג חיפוש`);
  }

  function hideSearchElement(event?: MouseEvent) {
    event?.preventDefault();
    setShowSearch(false);
    sendToLog(`${selectedName} הסתיר חיפוש`);
  }

  function onSearchKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setShowSearch(false);
      sendToLog(`${selectedName} הסתיר חיפוש בלחיצה על אסקייפ`);
    }
  }

  function handleSubmit(e: FormEvent) {
    window.localStorage?.setItem('names', new FormData(e.target as HTMLFormElement).getAll('names').join(','));
    window.localStorage?.setItem('names-date', new Date().toISOString());
  }

  function toggleShowPreviousSelected(e: MouseEvent) {
    e.preventDefault();
    setShowPreviouslySelected(!showPreviouslySelected);
  }

  return (
    <Form method="post" onSubmit={handleSubmit}>
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
          <option id="-1">-- לחצו כאן לבחירת השם שלכם מתוך הרשימה --</option>
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
            <label>ביטוח פדיחה זמין רק למי שבחר {minimumForFadiha} משפחות או יותר.</label>
          </div>
          <div>
            <div className="families-label">
              <label> לאיזה משפחות תרצו לתת? </label>
              {!showSearch && selectedFamiliesCount === 0 && <a href="#" onClick={showSearchElement}><SearchSVG/></a>}
            </div>
            {previouslySelectedNames?.size! > 0 &&
               <div className="families-note"><a href="#"
                                                 onClick={toggleShowPreviousSelected}>
                 {showPreviouslySelected ? 'הסתר' : 'הצג'}
                 {' '}את הבחירה{' '}
                 {(previouslySelectedDate?.getFullYear() as number) < (new Date().getFullYear()) ? 'שלי משנה שעברה' : 'הקודמת שלי'}</a>
               </div>}

            {(selectedFamiliesCount > 0 || showSearch) && <div id="banner">
              {selectedFamiliesCount > 0 &&
                 <div id="families-counter">
                 <span>{
                   selectedFamiliesCount === 1
                     ? <span>משפחה <b>אחת</b> נבחרה</span>
                     : <span><b>{selectedFamiliesCount}</b> משפחות נבחרו</span>
                 }
                   <span> - הסכום לתשלום: <b>{sum} ₪</b></span>
                 </span>
                   {!showSearch && <a href="#" onClick={showSearchElement}><SearchSVG/></a>}
                 </div>}
              {showSearch && <div id="families-search"><span>
                  <input placeholder="חיפוש משפחות" value={searchString}
                         ref={searchRef}
                         onInput={e => {
                           setSearchString(e.currentTarget.value);
                           sendToLog(`${selectedName} חיפש את "${e.currentTarget.value}"`);
                         }}
                         onKeyDown={onSearchKeyDown}
                  />
                </span>
                <a href="#" onClick={hideSearchElement}><CloseSVG/></a>
              </div>}
            </div>}

            <div className="families-selection"
                 onChange={() => setSelectedFamiliesCount(document.querySelectorAll('input[name=names]:checked').length,
                 )}>
              {names.filter(name => name !== selectedName && (!searchString || !showSearch || name.includes(searchString))).map(name => (
                <span key={`checkbox-${name}`}>
                  <input type="checkbox" name="names" id={name} value={name}
                         onClick={() => setTimeout(() => searchRef.current?.focus(), 10)}/>
                  <label htmlFor={name}><span
                    className={showPreviouslySelected && previouslySelectedNames?.has(name) ? 'previously-selected' : ''}>{name}</span></label>
                </span>),
              )}
            </div>

          </div>

          {selectedFamiliesCount >= minimumForFadiha && (
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
                  ₪{fadihaCost} לסכום
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
