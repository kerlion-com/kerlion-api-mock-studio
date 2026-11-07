"use strict";

// Lightweight browser-console tests for the routing and validation helpers.
(() => {
  const api = window.KerlionMockStudio;
  if (!api) throw new Error("Load app.js before running tests.js");

  const sample = [
    { id:"a", name:"Users", method:"GET", path:"/api/users", status:200, body:{ data:[] }, headers:[] },
    { id:"b", name:"User detail", method:"GET", path:"/api/users/:id", status:200, body:{ id:1 }, headers:[] },
    { id:"c", name:"Create user", method:"POST", path:"/api/users", status:201, body:{ created:true }, headers:[] }
  ];
  const tests = [
    ["normalizes a root path", () => api.normalizePath("/") === "/"],
    ["normalizes repeated slashes", () => api.normalizePath("//api///users/") === "/api/users"],
    ["rejects query strings in route definitions", () => { try { api.normalizePath("/api/users?page=1"); return false; } catch { return true; } }],
    ["rejects path traversal", () => { try { api.normalizePath("/api/../secret"); return false; } catch { return true; } }],
    ["matches a static route", () => api.pathMatches("/api/users", "/api/users")],
    ["matches a parameter route", () => api.pathMatches("/api/users/:id", "/api/users/42")],
    ["does not match different route lengths", () => !api.pathMatches("/api/users/:id", "/api/users")],
    ["finds a route by method and path", () => api.findMatchingEndpoint("GET", "/api/users/7", sample)?.id === "b"],
    ["does not match the wrong method", () => api.findMatchingEndpoint("DELETE", "/api/users", sample) === null],
    ["accepts a valid endpoint", () => api.validateEndpoint(sample[0]) === true],
    ["rejects an invalid method", () => { try { api.validateEndpoint({ ...sample[0], method:"TRACE" }); return false; } catch { return true; } }],
    ["rejects an invalid status code", () => { try { api.validateEndpoint({ ...sample[0], status:99 }); return false; } catch { return true; } }],
    ["rejects header line breaks", () => { try { api.validateEndpoint({ ...sample[0], headers:[{name:"X-Test",value:"ok\r\nInjected: yes"}] }); return false; } catch { return true; } }],
    ["accepts a valid response header", () => api.isValidHeader({ name:"X-Trace-Id", value:"trace-123" })],
    ["rejects a whitespace-only header name", () => !api.isValidHeader({ name:"   ", value:"value" })],
    ["rejects line breaks in a header name", () => !api.isValidHeader({ name:"X-Test\r\nInjected", value:"value" })],
    ["rejects line breaks in a header value", () => !api.isValidHeader({ name:"X-Test", value:"value\r\nInjected: yes" })]
  ];

  const failures = [];
  tests.forEach(([name, test]) => {
    let passed = false;
    try { passed = Boolean(test()); } catch (error) { console.error("FAIL:", name, error); }
    console[passed ? "log" : "error"]((passed ? "PASS " : "FAIL ") + name);
    if (!passed) failures.push(name);
  });
  console.log(tests.length - failures.length + "/" + tests.length + " tests passed");
  if (failures.length) throw new Error(failures.length + " test(s) failed");
})();