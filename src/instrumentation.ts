export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initFirebaseAdmin } = await import('@/lib/firebaseAdmin');
    initFirebaseAdmin();
  }
}
