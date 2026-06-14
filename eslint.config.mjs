import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 디자인 시스템 강제: raw HTML 폼 엘리먼트 대신 components/ui/* 컴포넌트를 사용해야 합니다.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "raw <input> 금지 — components/ui/Input.tsx의 <Input>을 사용하세요.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "raw <select> 금지 — components/ui/Input.tsx의 <Select>를 사용하세요.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "raw <textarea> 금지 — components/ui/Input.tsx의 <Textarea>를 사용하세요.",
        },
      ],
    },
  },
]);

export default eslintConfig;
