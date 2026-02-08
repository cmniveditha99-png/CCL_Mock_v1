export async function onRequest(context) {
  return new Response("MIDDLEWARE IS RUNNING", { status: 403 });
}
