const http = require("node:http");
const path = require("node:path");
const { createRouter } = require("./routes/router");
const { parseRequestUrl, sendJson, sendNoContent, serveStaticFile } = require("./utils/http");

const PORT = Number(process.env.PORT || 3080);
const WEB_ROOT = path.join(__dirname, "..", "web");
const router = createRouter();

const server = http.createServer(async (request, response) => {
  const { pathname } = parseRequestUrl(request.url);

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  if (pathname.startsWith("/api/")) {
    await router.handle(request, response);
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    serveStaticFile(response, path.join(WEB_ROOT, "index.html"));
    return;
  }

  const filePath = path.join(WEB_ROOT, pathname.replace(/^\/+/, ""));
  if (filePath.startsWith(WEB_ROOT)) {
    serveStaticFile(response, filePath);
    return;
  }

  sendJson(response, 404, { message: "页面不存在。" });
});

server.listen(PORT, () => {
  console.log(`客户报价管理系统已启动：http://127.0.0.1:${PORT}`);
});
