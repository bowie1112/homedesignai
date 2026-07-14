const ORIGIN = "http://analytics.homedesignai.co:8000";

const ROUTES = new Map([
  ["/js/m.js", "/js/script.js"],
  ["/js/script.js", "/js/script.js"],
  ["/api/v", "/api/event"],
  ["/api/event", "/api/event"],
]);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, User-Agent",
    "Access-Control-Max-Age": "86400",
  };
}

function mappedPath(pathname) {
  return ROUTES.get(pathname) || pathname;
}

function forwardedRequest(request, originPath) {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(originPath, ORIGIN);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  const clientIp = request.headers.get("CF-Connecting-IP");
  headers.set("Host", targetUrl.host);
  headers.set("X-Forwarded-Proto", "https");
  headers.set("X-Forwarded-Host", incomingUrl.host);
  if (clientIp) {
    headers.set("CF-Connecting-IP", clientIp);
    headers.set("X-Real-IP", clientIp);
    headers.set("X-Forwarded-For", clientIp);
  }

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  return new Request(targetUrl, init);
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin");
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originPath = mappedPath(url.pathname);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("Origin")),
      });
    }

    if (originPath === "/js/script.js" && !["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405 });
    }

    if (originPath === "/api/event" && !["POST", "OPTIONS"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405 });
    }

    const response = await fetch(forwardedRequest(request, originPath));

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return response;
    }

    return withCors(response, request);
  },
};
