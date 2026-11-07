(() => {
  "use strict";

  const STORAGE_KEY = "kerlion-api-mock-studio:v1";
  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const DEFAULT_HEADERS = [{ name: "Content-Type", value: "application/json" }];

  const seedEndpoints = [
    { id: "users-list", name: "List users", method: "GET", path: "/api/users", status: 200, body: { data: [{ id: 1, name: "Ada Lovelace", email: "ada@example.com" }, { id: 2, name: "Grace Hopper", email: "grace@example.com" }], total: 2 }, headers: DEFAULT_HEADERS },
    { id: "user-create", name: "Create user", method: "POST", path: "/api/users", status: 201, body: { id: 3, name: "New user", email: "new@example.com", created: true }, headers: DEFAULT_HEADERS },
    { id: "user-detail", name: "Get user by ID", method: "GET", path: "/api/users/:id", status: 200, body: { id: 1, name: "Ada Lovelace", role: "admin" }, headers: DEFAULT_HEADERS },
    { id: "products-list", name: "List products", method: "GET", path: "/api/products", status: 200, body: { data: [{ id: "p-100", name: "Developer Toolkit", price: 29.99 }, { id: "p-101", name: "UI Starter Pack", price: 19.5 }] }, headers: DEFAULT_HEADERS }
  ];

  const $ = (selector) => document.querySelector(selector);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let endpoints = clone(seedEndpoints);
  let selectedId = endpoints[0].id;
  let activeTab = "response-tab";
  let toastTimer;

  const elements = {
    list: $("#endpoint-list"), count: $("#endpoint-count"), search: $("#endpoint-search"),
    empty: $("#empty-state"), editor: $("#endpoint-editor"), title: $("#editor-title"),
    method: $("#method-input"), path: $("#path-input"), status: $("#status-input"),
    response: $("#response-input"), jsonState: $("#json-validity"), responseError: $("#response-error"),
    headers: $("#headers-editor"), headerCount: $("#header-count"), reqMethod: $("#request-method"),
    reqPath: $("#request-path"), reqBodyWrap: $("#request-body-wrap"), reqBody: $("#request-body"),
    feedback: $("#request-feedback"), result: $("#response-result"), resultStatus: $("#result-status"),
    resultTime: $("#result-time"), resultOutput: $("#result-output"), resultHeaders: $("#result-headers"),
    toast: $("#toast")
  };

  function notify(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
  }

  function selectedEndpoint() {
    return endpoints.find((endpoint) => endpoint.id === selectedId) || null;
  }

  function normalizePath(path) {
    const trimmed = String(path || "").trim();
    if (!trimmed) throw new Error("Enter an endpoint path.");
    if (/[?#]/.test(trimmed)) throw new Error("Paths must not include query strings or fragments.");
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.some((part) => part === "." || part === "..")) throw new Error("Path traversal segments are not allowed.");
    return "/" + parts.join("/");
  }

  function validateEndpoint(endpoint) {
    if (!METHODS.includes(endpoint.method)) throw new Error("Unsupported HTTP method.");
    normalizePath(endpoint.path);
    if (!Number.isInteger(Number(endpoint.status)) || Number(endpoint.status) < 100 || Number(endpoint.status) > 599) throw new Error("Status must be between 100 and 599.");
    if (!Array.isArray(endpoint.headers)) throw new Error("Headers must be a list.");
    endpoint.headers.forEach((header) => {
      if (!header.name || /[\r\n:]/.test(header.name)) throw new Error("Header names must be valid and cannot contain line breaks or colons.");
      if (/[\r\n]/.test(header.value || "")) throw new Error("Header values cannot contain line breaks.");
    });
    if (typeof endpoint.body === "undefined") throw new Error("Response body is missing.");
    return true;
  }

  function pathMatches(route, request) {
    const routeParts = normalizePath(route).split("/").filter(Boolean);
    const requestParts = normalizePath(request).split("/").filter(Boolean);
    if (routeParts.length !== requestParts.length) return false;
    return routeParts.every((part, index) => part.startsWith(":") ? requestParts[index].length > 0 : part === requestParts[index]);
  }

  function findMatchingEndpoint(method, path, collection = endpoints) {
    const normalizedMethod = String(method).toUpperCase();
    const normalizedPath = normalizePath(path);
    return collection.find((endpoint) => endpoint.method === normalizedMethod && pathMatches(endpoint.path, normalizedPath)) || null;
  }

  function renderList() {
    const query = elements.search.value.trim().toLowerCase();
    const filtered = endpoints.filter((endpoint) => [endpoint.name, endpoint.path, endpoint.method].join(" ").toLowerCase().includes(query));
    elements.list.replaceChildren();
    elements.count.textContent = String(endpoints.length);
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "sidebar-empty";
      empty.textContent = endpoints.length ? "No matching endpoints." : "No endpoints yet.";
      elements.list.append(empty);
      return;
    }
    filtered.forEach((endpoint) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "endpoint-item" + (endpoint.id === selectedId ? " active" : "");
      const top = document.createElement("span");
      top.className = "endpoint-item-top";
      const method = document.createElement("span");
      method.className = "method-pill " + endpoint.method.toLowerCase();
      method.textContent = endpoint.method;
      const name = document.createElement("span");
      name.className = "endpoint-name";
      name.textContent = endpoint.name;
      top.append(method, name);
      const path = document.createElement("small");
      path.textContent = endpoint.path;
      button.append(top, path);
      button.addEventListener("click", () => selectEndpoint(endpoint.id));
      elements.list.append(button);
    });
  }

  function selectEndpoint(id) {
    if (!endpoints.some((endpoint) => endpoint.id === id)) return;
    selectedId = id;
    render();
  }

  function renderHeaders(endpoint) {
    elements.headers.replaceChildren();
    elements.headerCount.textContent = String(endpoint.headers.length);
    if (!endpoint.headers.length) {
      const empty = document.createElement("div");
      empty.className = "headers-empty";
      empty.textContent = "No custom headers. Add one when your mock needs it.";
      elements.headers.append(empty);
      return;
    }
    endpoint.headers.forEach((header, index) => {
      const row = document.createElement("div");
      row.className = "header-row";
      const name = document.createElement("input");
      name.value = header.name;
      name.placeholder = "Header name";
      name.setAttribute("aria-label", "Header name");
      name.addEventListener("input", () => { header.name = name.value; });
      const value = document.createElement("input");
      value.value = header.value;
      value.placeholder = "Header value";
      value.setAttribute("aria-label", "Header value");
      value.addEventListener("input", () => { header.value = value.value; });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Remove header");
      remove.addEventListener("click", () => {
        endpoint.headers.splice(index, 1);
        renderHeaders(endpoint);
      });
      row.append(name, value, remove);
      elements.headers.append(row);
    });
  }

  function setTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll(".tab").forEach((button) => {
      const active = button.dataset.tab === tabId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = panel.id !== tabId; });
  }

  function render() {
    renderList();
    const endpoint = selectedEndpoint();
    const hasEndpoint = Boolean(endpoint);
    elements.empty.hidden = hasEndpoint;
    elements.editor.hidden = !hasEndpoint;
    if (!endpoint) return;
    elements.title.textContent = endpoint.name;
    elements.method.value = endpoint.method;
    elements.path.value = endpoint.path;
    elements.status.value = String(endpoint.status);
    elements.response.value = JSON.stringify(endpoint.body, null, 2);
    elements.reqMethod.value = endpoint.method;
    elements.reqPath.value = endpoint.path;
    elements.reqBody.value = "";
    elements.reqBodyWrap.hidden = !["POST", "PUT", "PATCH"].includes(endpoint.method);
    elements.responseError.textContent = "";
    elements.jsonState.textContent = "Valid JSON";
    elements.jsonState.classList.remove("invalid");
    renderHeaders(endpoint);
    elements.result.hidden = true;
    setTab(activeTab);
  }

  function syncSimpleFields() {
    const endpoint = selectedEndpoint();
    if (!endpoint) return;
    endpoint.name = endpoint.name || endpoint.method + " " + endpoint.path;
    endpoint.method = elements.method.value;
    endpoint.path = elements.path.value;
    endpoint.status = Number(elements.status.value);
    elements.reqMethod.value = endpoint.method;
    elements.reqPath.value = endpoint.path;
    elements.reqBodyWrap.hidden = !["POST", "PUT", "PATCH"].includes(endpoint.method);
    renderList();
  }

  function syncResponseBody() {
    const endpoint = selectedEndpoint();
    if (!endpoint) return false;
    try {
      endpoint.body = JSON.parse(elements.response.value);
      elements.jsonState.textContent = "Valid JSON";
      elements.jsonState.classList.remove("invalid");
      elements.responseError.textContent = "";
      return true;
    } catch (error) {
      elements.jsonState.textContent = "Invalid JSON";
      elements.jsonState.classList.add("invalid");
      elements.responseError.textContent = error.message;
      return false;
    }
  }

  function addEndpoint() {
    const id = "endpoint-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
    const endpoint = { id, name: "New endpoint", method: "GET", path: "/api/new-endpoint", status: 200, body: { message: "Hello from KERLION API Mock Studio" }, headers: clone(DEFAULT_HEADERS) };
    endpoints.push(endpoint);
    selectedId = id;
    render();
    elements.title.focus?.();
    notify("Endpoint added.");
  }

  function deleteEndpoint() {
    const endpoint = selectedEndpoint();
    if (!endpoint) return;
    endpoints = endpoints.filter((item) => item.id !== selectedId);
    selectedId = endpoints[0]?.id || null;
    render();
    notify("Endpoint deleted.");
  }

  function runRequest() {
    if (!syncResponseBody()) {
      elements.feedback.firstElementChild.textContent = "Cannot run request";
      elements.feedback.lastElementChild.textContent = "Fix the response JSON first.";
      return;
    }
    syncSimpleFields();
    const started = performance.now();
    try {
      const method = elements.reqMethod.value;
      const path = normalizePath(elements.reqPath.value);
      const endpoint = findMatchingEndpoint(method, path);
      const elapsed = (performance.now() - started).toFixed(2);
      if (!endpoint) {
        elements.feedback.firstElementChild.textContent = "No matching route";
        elements.feedback.lastElementChild.textContent = method + " " + path;
        elements.result.hidden = false;
        elements.resultStatus.textContent = "404 NOT FOUND";
        elements.resultTime.textContent = elapsed + " ms";
        elements.resultOutput.textContent = JSON.stringify({ error: "No mock endpoint matches this request.", method, path }, null, 2);
        elements.resultHeaders.textContent = "Content-Type: application/json";
        return;
      }
      validateEndpoint(endpoint);
      const resultBody = Number(endpoint.status) === 204 ? null : endpoint.body;
      elements.feedback.firstElementChild.textContent = "Matched " + endpoint.name;
      elements.feedback.lastElementChild.textContent = method + " " + path;
      elements.result.hidden = false;
      elements.resultStatus.textContent = endpoint.status + " " + statusText(endpoint.status);
      elements.resultTime.textContent = elapsed + " ms";
      elements.resultOutput.textContent = resultBody === null ? "(No content)" : JSON.stringify(resultBody, null, 2);
      const headers = Object.fromEntries(endpoint.headers.map((header) => [header.name, header.value]));
      if (!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) headers["Content-Type"] = "application/json";
      elements.resultHeaders.textContent = Object.entries(headers).map(([key, value]) => key + ": " + value).join("\n") || "(No headers)";
    } catch (error) {
      elements.feedback.firstElementChild.textContent = "Request could not be tested";
      elements.feedback.lastElementChild.textContent = error.message;
      elements.result.hidden = true;
    }
  }

  function statusText(status) {
    const labels = { 200:"OK",201:"Created",202:"Accepted",204:"No Content",400:"Bad Request",401:"Unauthorized",403:"Forbidden",404:"Not Found",409:"Conflict",422:"Unprocessable Entity",429:"Too Many Requests",500:"Internal Server Error",503:"Service Unavailable" };
    return labels[status] || "Response";
  }

  function exportProject() {
    if (!syncResponseBody()) {
      notify("Fix invalid JSON before exporting.");
      return;
    }
    const project = { format: "kerlion-api-mock-studio", version: 1, exportedAt: new Date().toISOString(), endpoints };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kerlion-api-mock-studio-project.json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Workspace exported.");
  }

  function importProject(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = JSON.parse(String(reader.result));
        if (!project || project.format !== "kerlion-api-mock-studio" || project.version !== 1 || !Array.isArray(project.endpoints)) throw new Error("This file is not a supported KERLION API Mock Studio project.");
        if (project.endpoints.length > 200) throw new Error("A workspace can contain up to 200 endpoints.");
        const ids = new Set();
        const imported = project.endpoints.map((item, index) => {
          const endpoint = {
            id: String(item.id || "imported-" + index),
            name: String(item.name || ("Endpoint " + (index + 1))).slice(0, 100),
            method: String(item.method || "GET").toUpperCase(),
            path: normalizePath(item.path),
            status: Number(item.status || 200),
            body: item.body,
            headers: Array.isArray(item.headers) ? item.headers.map((header) => ({ name: String(header.name || ""), value: String(header.value || "") })) : []
          };
          if (ids.has(endpoint.id)) throw new Error("Duplicate endpoint IDs are not allowed.");
          ids.add(endpoint.id);
          validateEndpoint(endpoint);
          return endpoint;
        });
        endpoints = imported;
        selectedId = endpoints[0]?.id || null;
        render();
        notify("Workspace imported.");
      } catch (error) {
        notify(error.message || "Could not import this file.");
      }
    };
    reader.onerror = () => notify("Could not read the selected file.");
    reader.readAsText(file);
  }

  function bindEvents() {
    $("#new-endpoint-button").addEventListener("click", addEndpoint);
    $("#sidebar-add-button").addEventListener("click", addEndpoint);
    $("#empty-add-button").addEventListener("click", addEndpoint);
    $("#delete-endpoint-button").addEventListener("click", deleteEndpoint);
    $("#send-request-button").addEventListener("click", runRequest);
    $("#export-project-button").addEventListener("click", exportProject);
    $("#load-project-button").addEventListener("click", () => $("#import-project-input").click());
    $("#import-project-input").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) importProject(file);
      event.target.value = "";
    });
    elements.search.addEventListener("input", renderList);
    [elements.method, elements.path, elements.status].forEach((input) => input.addEventListener("change", syncSimpleFields));
    elements.response.addEventListener("input", syncResponseBody);
    elements.reqMethod.addEventListener("change", () => {
      elements.reqBodyWrap.hidden = !["POST", "PUT", "PATCH"].includes(elements.reqMethod.value);
    });
    $("#add-header-button").addEventListener("click", () => {
      const endpoint = selectedEndpoint();
      if (!endpoint) return;
      endpoint.headers.push({ name: "", value: "" });
      renderHeaders(endpoint);
    });
    document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
    elements.reqPath.addEventListener("keydown", (event) => { if (event.key === "Enter") runRequest(); });
  }

  window.KerlionMockStudio = {
    normalizePath,
    pathMatches,
    findMatchingEndpoint,
    validateEndpoint,
    getEndpoints: () => clone(endpoints)
  };

  bindEvents();
  render();
})();