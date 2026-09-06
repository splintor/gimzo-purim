import { sendToTelegram } from '~/telegram.server';
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await sendToTelegram(formData.get('message') as string);
  return null;
}
