import webpush from 'web-push';
import { createSupabaseServiceClient } from './supabaseClient';

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url: string }
) {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();

  if (!data?.subscription) return;

  try {
    await webpush.sendNotification(
      data.subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    // 410 = subscription expired — remove it so we stop trying
    if ((err as { statusCode?: number }).statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    }
  }
}
