const React = require("react");
const { renderToString } = require("react-dom/server");
const { convert } = require("convert-svg-to-png");
const Avatar = require("boring-avatars").default;

const DEFAULT_COLORS = [
  "#92A1C6",
  "#146A7C",
  "#F0AB3D",
  "#C271B4",
  "#C20D90",
].join(",");
const DEFAULT_SIZE = 80;
const DEFAULT_VARIANT = "marble";

const VALID_VARIANTS = new Set([
  "marble",
  "beam",
  "pixel",
  "sunset",
  "ring",
  "bauhaus",
]);

const VALID_FORMATS = new Set(["svg", "png"]);

function normalizeColors(colors) {
  const colorPalette = colors.split(",");

  if (colorPalette.length) {
    return colorPalette.map((color) =>
      color.startsWith("#") ? color : `#${color}`
    );
  }
}

const app = require("express")();

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

app.get("/:variant?/:size?/:name?", (req, res) => {
  const { variant = DEFAULT_VARIANT, size = DEFAULT_SIZE } = req.params;
  const explicitName = req.query.name || req.params.name;
  const format = req.query.format || "svg";
  const name = explicitName || Math.random().toString();
  const colors = normalizeColors(req.query.colors || DEFAULT_COLORS);
  const square = req.query.hasOwnProperty("square");

  if (!VALID_VARIANTS.has(variant)) {
    return res.status(400).send("Invalid variant");
  }

  if (!VALID_FORMATS.has(format)) {
    return res.status(400).send("Invalid format");
  }

  if (explicitName) {
    res.setHeader("Cache-Control", "max-age=0, s-maxage=2592000");
  } else {
    res.setHeader("Cache-control", "max-age=0, s-maxage=1");
  }

  const svg = renderToString(
    React.createElement(
      Avatar,
      {
        size,
        name,
        variant,
        colors,
        square,
      },
      null
    )
  );

  if (format === "svg") {
    res.setHeader("Content-Type", "image/svg+xml");
    res.end(svg);
  } else if (format === "png") {
    res.set("Content-Type", "image/png");
    convert(svg)
      .then((png) => {
        res.send(png);
        return res;
      })
      .catch(() => {
        return res.status(400).send("Conversion failed");
      });
  } else {
    return res.status(400).send("Invalid format");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on ${port}, http://localhost:${port}`);
});
