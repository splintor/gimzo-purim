import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { type ActionFunctionArgs, json, type MetaFunction } from '@vercel/remix';
import { useEffect, useState } from 'react';
import { addFamily, deleteFamily, getNamesData, updateFamily } from '~/googleapis.server';

export const meta: MetaFunction = () => [
  { title: 'ניהול שמות - גמזו' },
];

export async function loader() {
  const families = await getNamesData();
  return json({ families });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('_action') as string;

  try {
    if (actionType === 'add') {
      const family = (formData.get('family') as string ?? '').trim();
      const husband = (formData.get('husband') as string ?? '').trim();
      const wife = (formData.get('wife') as string ?? '').trim();
      if (!family && !husband && !wife) {
        return json({ success: null as string | null, error: 'יש למלא לפחות שדה אחד.' });
      }
      await addFamily(family, husband, wife);
      return json({ success: `משפחת ${family} נוספה בהצלחה.` as string | null, error: null as string | null });
    }

    if (actionType === 'update') {
      const rowIndex = Number(formData.get('rowIndex'));
      const expectedFamily = formData.get('expectedFamily') as string;
      const family = (formData.get('family') as string ?? '').trim();
      const husband = (formData.get('husband') as string ?? '').trim();
      const wife = (formData.get('wife') as string ?? '').trim();
      await updateFamily(rowIndex, expectedFamily, family, husband, wife);
      return json({ success: `משפחת ${family} עודכנה בהצלחה.` as string | null, error: null as string | null });
    }

    if (actionType === 'delete') {
      const rowIndex = Number(formData.get('rowIndex'));
      const expectedFamily = formData.get('expectedFamily') as string;
      await deleteFamily(rowIndex, expectedFamily);
      return json({ success: `משפחת ${expectedFamily} נמחקה בהצלחה.` as string | null, error: null as string | null });
    }

    return json({ success: null as string | null, error: 'פעולה לא מוכרת.' });
  } catch (err) {
    return json({ success: null as string | null, error: `שגיאה: ${(err as Error).message}` });
  }
}

export default function NameManagement() {
  const { families } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [deletingRow, setDeletingRow] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const isSubmitting = navigation.state === 'submitting';

  // Reset editing/deleting state when families data refreshes (after successful action)
  useEffect(() => {
    if (navigation.state === 'idle') {
      setEditingRow(null);
      setDeletingRow(null);
    }
  }, [navigation.state, families]);

  return (
    <div className="name-management">
      <h1>ניהול שמות - גמזו</h1>

      <details className="nm-info-box">
        <summary>איך להגן על הגיליון בגוגל שיטס?</summary>
        <ol>
          <li>פתחו את הגיליון בגוגל שיטס.</li>
          <li>לחצו על הלשונית &quot;שמות&quot; בתחתית המסך עם כפתור ימני.</li>
          <li>בחרו &quot;הגנה על הגיליון&quot;.</li>
          <li>סמנו &quot;גיליון&quot; (ולא טווח).</li>
          <li>לחצו &quot;הגדר הרשאות&quot;.</li>
          <li>בחרו &quot;הגבל מי יכול לערוך טווח זה&quot;.</li>
          <li>הוסיפו רק את כתובות המייל שצריכות הרשאת עריכה.</li>
          <li>לחצו &quot;סיום&quot;.</li>
        </ol>
        <p>מעתה, כל שינוי בשמות יתבצע דרך <a href="/nameManagement">דף ניהול השמות</a> בלבד.</p>
      </details>

      <section className="nm-add-section">
        <h2>הוספת משפחה חדשה</h2>
        <Form method="post" className="nm-add-form">
          <input type="hidden" name="_action" value="add" />
          <input type="text" name="family" placeholder="משפחה" className="nm-input" />
          <input type="text" name="husband" placeholder="בעל" className="nm-input" />
          <input type="text" name="wife" placeholder="אשה" className="nm-input" />
          <button type="submit" className="nm-btn nm-btn-primary" disabled={isSubmitting}>
            {isSubmitting && navigation.formData?.get('_action') === 'add' ? 'מוסיף...' : 'הוסף'}
          </button>
        </Form>
      </section>

      {actionData && (
        <div className={`nm-feedback ${actionData.success ? 'nm-feedback-success' : 'nm-feedback-error'}`}>
          {actionData.success || actionData.error}
        </div>
      )}

      <section>
        <h2>משפחות קיימות ({families.length})</h2>
        <input
          type="text"
          className="nm-input nm-filter"
          placeholder="סינון משפחות..."
          value={filter}
          onInput={(e) => setFilter(e.currentTarget.value)}
        />
        <div className="nm-cards">
          {families.filter((fam) => {
            if (!filter) return true;
            const q = filter.toLowerCase();
            return fam.displayName.toLowerCase().includes(q)
              || fam.family.toLowerCase().includes(q)
              || fam.husband.toLowerCase().includes(q)
              || fam.wife.toLowerCase().includes(q);
          }).map((fam) => {
            const isEditing = editingRow === fam.rowIndex;
            const isDeleting = deletingRow === fam.rowIndex;

            if (isEditing) {
              return (
                <div key={fam.rowIndex} className="nm-card nm-card-editing">
                  <Form method="post" className="nm-edit-form">
                    <input type="hidden" name="_action" value="update" />
                    <input type="hidden" name="rowIndex" value={fam.rowIndex} />
                    <input type="hidden" name="expectedFamily" value={fam.family} />
                    <div className="nm-edit-fields">
                      <label>
                        משפחה:
                        <input type="text" name="family" defaultValue={fam.family} className="nm-input" />
                      </label>
                      <label>
                        בעל:
                        <input type="text" name="husband" defaultValue={fam.husband} className="nm-input" />
                      </label>
                      <label>
                        אשה:
                        <input type="text" name="wife" defaultValue={fam.wife} className="nm-input" />
                      </label>
                    </div>
                    <div className="nm-card-actions">
                      <button type="submit" className="nm-btn nm-btn-primary" disabled={isSubmitting}>
                        {isSubmitting && navigation.formData?.get('_action') === 'update' ? 'שומר...' : 'שמור'}
                      </button>
                      <button type="button" className="nm-btn" onClick={() => setEditingRow(null)}>
                        ביטול
                      </button>
                    </div>
                  </Form>
                </div>
              );
            }

            if (isDeleting) {
              return (
                <div key={fam.rowIndex} className="nm-card nm-card-deleting">
                  <div className="nm-delete-confirm">
                    האם למחוק את {fam.displayName || fam.family}?
                  </div>
                  <Form method="post" className="nm-card-actions">
                    <input type="hidden" name="_action" value="delete" />
                    <input type="hidden" name="rowIndex" value={fam.rowIndex} />
                    <input type="hidden" name="expectedFamily" value={fam.family} />
                    <button type="submit" className="nm-btn nm-btn-danger" disabled={isSubmitting}>
                      {isSubmitting && navigation.formData?.get('_action') === 'delete' ? 'מוחק...' : 'כן, מחק'}
                    </button>
                    <button type="button" className="nm-btn" onClick={() => setDeletingRow(null)}>
                      ביטול
                    </button>
                  </Form>
                </div>
              );
            }

            return (
              <div key={fam.rowIndex} className="nm-card">
                <div className="nm-card-display-name">{fam.displayName}</div>
                <div className="nm-card-details">
                  <span>משפחה: {fam.family}</span>
                  <span>בעל: {fam.husband}</span>
                  <span>אשה: {fam.wife}</span>
                </div>
                <div className="nm-card-actions">
                  <button type="button" className="nm-btn nm-btn-primary" onClick={() => { setEditingRow(fam.rowIndex); setDeletingRow(null); }}>
                    ערוך
                  </button>
                  <button type="button" className="nm-btn nm-btn-danger" onClick={() => { setDeletingRow(fam.rowIndex); setEditingRow(null); }}>
                    מחק
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
