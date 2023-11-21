import { updateShipping } from '~/googleapis.server';

export async function loader() {
  return {
    result: await updateShipping(),
  };
}

export default function UpdateShipping() {
  return <div style={{ textAlign: 'center', marginBlockStart: '20px' }}>
    <h1>המשלוחים עודכנו בהצלחה!</h1>
  </div>;
}
