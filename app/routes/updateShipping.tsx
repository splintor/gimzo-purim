import { Form, useNavigation } from '@remix-run/react';
import { updateShipping } from '~/googleapis.server';

export async function loader() {
  return {
    result: await updateShipping(),
  };
}

export default function UpdateShipping() {
  const { state } = useNavigation();

  return <div style={{ textAlign: 'center', marginBlockStart: '20px' }}>
    <Form>
      {state === 'idle' ? (
        <div>
          <h1>המשלוחים עודכנו בהצלחה!</h1>
          <button type="submit">עדכן שוב</button>
        </div>
      ) : (
        <h1>מעדכן משלוחים...</h1>
      )}
    </Form>
  </div>;
}
