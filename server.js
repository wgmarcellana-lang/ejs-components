const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const rootDir = __dirname;
const port = process.env.PORT || 3000;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compileTemplate(template) {
  let code = 'let __output = "";\n';
  let cursor = 0;
  const pattern = /<%([=-]?)([\s\S]*?)%>/g;
  let match;

  while ((match = pattern.exec(template))) {
    const [fullMatch, flag, innerCode] = match;
    const html = template.slice(cursor, match.index);

    if (html) {
      code += `__output += ${JSON.stringify(html)};\n`;
    }

    if (flag === "=") {
      code += `__output += __escape(${innerCode.trim()});\n`;
    } else if (flag === "-") {
      code += `__output += (${innerCode.trim()});\n`;
    } else {
      code += `${innerCode}\n`;
    }

    cursor = match.index + fullMatch.length;
  }

  const tail = template.slice(cursor);
  if (tail) {
    code += `__output += ${JSON.stringify(tail)};\n`;
  }

  code += "return __output;";
  return new Function("__locals", "__escape", `with (__locals) {\n${code}\n}`);
}

function loadConfigModule(baseDir, configPath, locals = {}) {
  const resolvedPath = path.resolve(baseDir, configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  delete require.cache[require.resolve(resolvedPath)];
  const configModule = require(resolvedPath);
  const resolvedLocals =
    typeof configModule === "function" ? configModule(locals) : configModule;

  return resolvedLocals && typeof resolvedLocals === "object" ? resolvedLocals : {};
}

function resolveAssetPath(fileDir, assetPath) {
  const componentsDir = path.join(rootDir, "components");
  const resolvedPath = path.resolve(fileDir, assetPath);
  const relativePath = path.relative(componentsDir, resolvedPath);

  if (!relativePath || relativePath.startsWith("..")) {
    return assetPath.split(path.sep).join("/");
  }

  return `/components/${relativePath.split(path.sep).join("/")}`;
}

function renderTemplate(filePath, locals = {}) {
  const template = fs.readFileSync(filePath, "utf8");
  const renderer = compileTemplate(template);
  const fileDir = path.dirname(filePath);

  const scopedLocals = {
    ...locals,
    asset(assetPath) {
      return resolveAssetPath(fileDir, assetPath);
    },
    loadConfig(configPath, configLocals = {}) {
      return loadConfigModule(fileDir, configPath, configLocals);
    },
    include(includePath, includeLocals = {}) {
      const resolvedPath = path.resolve(fileDir, includePath);
      return renderTemplate(resolvedPath, includeLocals);
    }
  };

  return renderer(scopedLocals, escapeHtml);
}

app.use("/components", express.static(path.join(rootDir, "components")));
app.use("/src", express.static(path.join(rootDir, "src")));

app.get("/", (_req, res) => {
  res.type("html");
  res.send(renderTemplate(path.join(rootDir, "src", "index.ejs")));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Component demo available at http://localhost:${port}`);
});
 
