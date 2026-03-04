import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { type ActionFunctionArgs, json, type MetaFunction } from '@vercel/remix';
import { useEffect, useState } from 'react';
import { CloseSVG } from '~/CloseSVG';
import { addFamily, deleteFamily, getNamesData, updateFamily } from '~/googleapis.server';

const STREET_OPTIONS = ['ראשון', 'שני', 'שלישי', 'הרחבה'] as const;

function computeDisplayName(family: string, husband: string, wife: string) {
  if (!husband) return family ? `משפחת ${family}` : '';
  return `${family} ${husband}${wife ? ` ו${wife}` : ''}`.trim();
}

export const meta: MetaFunction = () => [
  { title: 'משלוח מנות מושבי - גמזו - ניהול שמות' },
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
      const mourning = formData.get('mourning') === 'on';
      const street = (formData.get('street') as string ?? '').trim();
      const location = (formData.get('location') as string ?? '').trim();
      if (!family && !husband && !wife) {
        return json({ success: null as string | null, error: 'יש למלא לפחות שדה אחד.' });
      }
      if (!street) {
        return json({ success: null as string | null, error: 'יש לבחור רחוב.' });
      }
      await addFamily(family, husband, wife, mourning, street, location);
      return json({ success: `משפחת ${family} נוספה בהצלחה.` as string | null, error: null as string | null });
    }

    if (actionType === 'update') {
      const rowIndex = Number(formData.get('rowIndex'));
      const expectedFamily = formData.get('expectedFamily') as string;
      const family = (formData.get('family') as string ?? '').trim();
      const husband = (formData.get('husband') as string ?? '').trim();
      const wife = (formData.get('wife') as string ?? '').trim();
      const mourning = formData.get('mourning') === 'on';
      const street = (formData.get('street') as string ?? '').trim();
      const location = (formData.get('location') as string ?? '').trim();
      if (!street) {
        return json({ success: null as string | null, error: 'יש לבחור רחוב.' });
      }
      await updateFamily(rowIndex, expectedFamily, family, husband, wife, mourning, street, location);
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
  const [addFields, setAddFields] = useState({ family: '', husband: '', wife: '' });
  const [editFields, setEditFields] = useState({ family: '', husband: '', wife: '', mourning: false });

  const isSubmitting = navigation.state === 'submitting';

  // Reset editing/deleting state when families data refreshes (after successful action)
  const [lastAction, setLastAction] = useState<string | null>(null);
  useEffect(() => {
    if (navigation.state === 'submitting') {
      setLastAction(navigation.formData?.get('_action') as string);
    }
    if (navigation.state === 'idle') {
      setEditingRow(null);
      setDeletingRow(null);
      if (lastAction === 'add') {
        setAddFields({ family: '', husband: '', wife: '' });
      }
      setLastAction(null);
    }
  }, [navigation.state, families]);

  return (
    <div className="name-management">
      <h1>משלוח מנות מושבי - גמזו - ניהול שמות</h1>

      <section className="nm-add-section">
        <h2>הוספת משפחה חדשה</h2>
        <Form method="post" className="nm-add-form">
          <input type="hidden" name="_action" value="add" />
          <input type="text" name="family" placeholder="משפחה" className="nm-input"
            value={addFields.family} onInput={(e) => { const v = e.currentTarget.value; setAddFields((f) => ({ ...f, family: v })); }} />
          <input type="text" name="husband" placeholder="בעל" className="nm-input"
            value={addFields.husband} onInput={(e) => { const v = e.currentTarget.value; setAddFields((f) => ({ ...f, husband: v })); }} />
          <input type="text" name="wife" placeholder="אשה" className="nm-input"
            value={addFields.wife} onInput={(e) => { const v = e.currentTarget.value; setAddFields((f) => ({ ...f, wife: v })); }} />
          {(addFields.family || addFields.husband || addFields.wife) && (() => {
            const preview = computeDisplayName(addFields.family, addFields.husband, addFields.wife);
            const isDuplicate = families.some((fam) => fam.displayName === preview);
            return (
              <div className="nm-preview">
                שם לטופס: <b>{preview}</b>
                {isDuplicate && <span className="nm-duplicate-warning">משפחה זו כבר קיימת!</span>}
              </div>
            );
          })()}
          <label className="nm-checkbox-label">
            <input type="checkbox" name="mourning" />
            אבל
          </label>
          <select name="street" className="nm-input" required>
            <option value="">נא לבחור רחוב:</option>
            {STREET_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" name="location" placeholder="מיקום מדויק (לא חובה)" className="nm-input" />
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
        <div className="nm-filter-wrapper">
          <input
            type="text"
            className="nm-input nm-filter"
            placeholder="סינון משפחות..."
            value={filter}
            onInput={(e) => setFilter(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setFilter(''); }}
          />
          {filter && (
            <button type="button" className="nm-filter-clear" onClick={() => setFilter('')}>
              <CloseSVG />
            </button>
          )}
        </div>
        <div className="nm-cards">
          {(() => {
            const filtered = families.filter((fam) => {
              if (!filter) return true;
              const q = filter.toLowerCase();
              return fam.displayName.toLowerCase().includes(q)
                || fam.family.toLowerCase().includes(q)
                || fam.husband.toLowerCase().includes(q)
                || fam.wife.toLowerCase().includes(q);
            });
            if (filter && filtered.length === 0) {
              return <div className="nm-no-results">לא נמצאו משפחות שמתאימות לחיפוש.</div>;
            }
            return filtered.map((fam) => {
            const isEditing = editingRow === fam.rowIndex;
            const isDeleting = deletingRow === fam.rowIndex;

            if (isEditing) {
              return (
                <div key={fam.rowIndex} className={`nm-card nm-card-editing${editFields.mourning ? ' nm-card-mourning' : ''}`}>
                  <Form method="post" className="nm-edit-form">
                    <input type="hidden" name="_action" value="update" />
                    <input type="hidden" name="rowIndex" value={fam.rowIndex} />
                    <input type="hidden" name="expectedFamily" value={fam.family} />
                    <div className="nm-edit-fields">
                      <label>
                        משפחה:
                        <input type="text" name="family" value={editFields.family} className="nm-input"
                          onInput={(e) => { const v = e.currentTarget.value; setEditFields((f) => ({ ...f, family: v })); }} />
                      </label>
                      <label>
                        בעל:
                        <input type="text" name="husband" value={editFields.husband} className="nm-input"
                          onInput={(e) => { const v = e.currentTarget.value; setEditFields((f) => ({ ...f, husband: v })); }} />
                      </label>
                      <label>
                        אשה:
                        <input type="text" name="wife" value={editFields.wife} className="nm-input"
                          onInput={(e) => { const v = e.currentTarget.value; setEditFields((f) => ({ ...f, wife: v })); }} />
                      </label>
                    </div>
                    <div className="nm-preview">שם לטופס: <b>{computeDisplayName(editFields.family, editFields.husband, editFields.wife)}</b></div>
                    <div className="nm-edit-fields">
                      <label>
                        רחוב:
                        <select name="street" className="nm-input" defaultValue={fam.street} required>
                          <option value="">נא לבחור רחוב:</option>
                          {STREET_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        מיקום מדויק:
                        <input type="text" name="location" defaultValue={fam.location} className="nm-input" />
                      </label>
                      <label className="nm-checkbox-label">
                        <input type="checkbox" name="mourning" checked={editFields.mourning}
                          onChange={(e) => { const v = e.currentTarget.checked; setEditFields((f) => ({ ...f, mourning: v })); }} />
                        אבל
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
                  <Form method="post" className="nm-delete-actions">
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
              <div key={fam.rowIndex} className={`nm-card${fam.mourning ? ' nm-card-mourning' : ''}`}>
                <div className="nm-card-display-name"><span className="nm-card-index">{fam.index}</span>{fam.displayName}</div>
                <div className="nm-card-details">
                  <span>משפחה: {fam.family}</span>
                  <span>בעל: {fam.husband}</span>
                  <span>אשה: {fam.wife}</span>
                  {fam.mourning && <span>אבל: כן</span>}
                  <span>רחוב: {fam.street}</span>
                  {fam.location && <span>מיקום: {fam.location}</span>}
                </div>
                <div className="nm-card-actions">
                  <button type="button" className="nm-btn nm-btn-primary" onClick={() => { setEditingRow(fam.rowIndex); setDeletingRow(null); setEditFields({ family: fam.family, husband: fam.husband, wife: fam.wife, mourning: fam.mourning }); }}>
                    ערוך
                  </button>
                  <button type="button" className="nm-btn nm-btn-danger" onClick={() => { setDeletingRow(fam.rowIndex); setEditingRow(null); }}>
                    מחק
                  </button>
                </div>
              </div>
            );
          });
          })()}
        </div>
      </section>
    </div>
  );
}
