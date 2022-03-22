// This script is responsible for generating src/notion/languageMap.json

/* eslint-disable node/no-unpublished-import */
import l, {Language} from 'linguist-languages';
import fs from 'fs';
import path from 'path';
import {supportedCodeLang} from '../src/notion';

export const languages: Record<
  supportedCodeLang,
  Language | Language[] | undefined
> = {
  abap: l.ABAP,
  arduino: undefined, // Handled as C++
  bash: l.Shell,
  basic: l.BASIC,
  c: l.C,
  clojure: l.Clojure,
  coffeescript: l.CoffeeScript,
  'c++': l['C++'],
  'c#': l['C#'],
  css: l.CSS,
  dart: l.Dart,
  diff: l.Diff,
  docker: l.Dockerfile,
  elixir: l.Elixir,
  elm: l.Elm,
  erlang: l.Erlang,
  flow: undefined, // Handled as JavaScript
  fortran: l.Fortran,
  'f#': l['F#'],
  gherkin: l.Gherkin,
  glsl: l.GLSL,
  go: l.Go,
  graphql: l.GraphQL,
  groovy: l.Groovy,
  haskell: l.Haskell,
  html: l.HTML,
  java: l.Java,
  javascript: l.JavaScript,
  json: l.JSON,
  julia: l.Julia,
  kotlin: l.Kotlin,
  latex: l.TeX,
  less: l.Less,
  lisp: l['Common Lisp'],
  livescript: l.LiveScript,
  lua: l.Lua,
  makefile: l.Makefile,
  markdown: l.Markdown,
  markup: undefined, // Handled as ?
  matlab: l.MATLAB,
  mermaid: undefined, // Handled as Markdown
  nix: l.Nix,
  'objective-c': l['Objective-C'],
  ocaml: l.OCaml,
  pascal: l.Pascal,
  perl: l.Perl,
  php: l.PHP,
  'plain text': undefined,
  powershell: l.PowerShell,
  prolog: l.Prolog,
  protobuf: l['Protocol Buffer'],
  python: l.Python,
  r: l.R,
  reason: l.Reason,
  ruby: l.Ruby,
  rust: l.Rust,
  sass: l.Sass,
  scala: l.Scala,
  scheme: l.Scheme,
  scss: l.SCSS,
  shell: l.Shell,
  sql: l.SQL,
  swift: l.Swift,
  typescript: l.TypeScript,
  'vb.net': l['Visual Basic .NET'],
  verilog: l.Verilog,
  vhdl: l.VHDL,
  'visual basic': undefined, // Handled as VB.Net
  webassembly: l.WebAssembly,
  xml: l.XML,
  yaml: l.YAML,
  'java/c/c++/c#': l.Java, // Other languages have their own tag
};

const map: Record<string, string> = {};

Object.entries(languages).forEach(([notionKey, value]) => {
  ([value].flat().filter(e => !!e) as Language[]).forEach(lang => {
    map[lang.aceMode] = notionKey;
    lang.aliases?.forEach(alias => {
      map[alias] = notionKey;
    });
  });
});

fs.writeFileSync(
  path.join(__dirname, '../src/notion/languageMap.json'),
  JSON.stringify(map, null, 2)
);
