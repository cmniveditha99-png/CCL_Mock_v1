export async function onRequest(context) {
  // This forces ALL routes to go through Pages Functions,
  // so your _middleware.js runs for /mock-01, /mock-04, etc.
  return context.next();
}
