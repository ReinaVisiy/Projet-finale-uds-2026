import re, subprocess, json, sys, os

def extract_translations_block(src):
    m = re.search(r'const translations = \{', src)
    if not m:
        return None
    start = m.start()
    i = m.end() - 1
    depth = 0
    for j in range(i, len(src)):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                end = j + 1
                if end < len(src) and src[end] == ';':
                    end += 1
                # also eat trailing newline
                if end < len(src) and src[end] == '\n':
                    end += 1
                return src[start:end], start, end
    return None

def eval_translations_to_json(block_text):
    node_code = block_text + "\nconsole.log(JSON.stringify(translations));"
    with open('/tmp/_extract.js', 'w', encoding='utf-8') as f:
        f.write(node_code)
    result = subprocess.run(['node', '/tmp/_extract.js'], capture_output=True, text=True)
    if result.returncode != 0:
        print("NODE ERROR:", result.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)

def migrate(component_path, namespace, locales_dir):
    with open(component_path, encoding='utf-8') as f:
        src = f.read()

    res = extract_translations_block(src)
    if not res:
        print(f"SKIP (no translations block): {component_path}")
        return False
    block, start, end = res
    data = eval_translations_to_json(block)

    # Merge into locale JSON files
    for lang in ['fr', 'en']:
        locale_path = os.path.join(locales_dir, lang, 'translation.json')
        with open(locale_path, encoding='utf-8') as f:
            existing = json.load(f)
        existing[namespace] = data.get(lang, {})
        with open(locale_path, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
            f.write('\n')

    # Remove the translations block from source
    new_src = src[:start] + src[end:]

    # Replace import of useDict with useTranslation
    new_src = re.sub(
        r"import \{ useDict \} from '\.\./context/LanguageContext';\n?",
        "import { useTranslation } from 'react-i18next';\n",
        new_src
    )
    # Handle case where useDict import might be combined with something else - none observed

    # Replace `const t = useDict(translations);` -> `const { t } = useTranslation();`
    new_src = re.sub(
        r"const t = useDict\(translations\);",
        "const { t } = useTranslation();",
        new_src
    )

    # Replace t.identifier -> t('namespace.identifier')
    def repl_t(m):
        ident = m.group(1)
        return f"t('{namespace}.{ident}')"
    new_src = re.sub(r"\bt\.([a-zA-Z_][a-zA-Z0-9_]*)\b", repl_t, new_src)

    with open(component_path, 'w', encoding='utf-8') as f:
        f.write(new_src)

    print(f"OK: {component_path} -> namespace '{namespace}'")
    return True

if __name__ == '__main__':
    component_path = sys.argv[1]
    namespace = sys.argv[2]
    locales_dir = sys.argv[3]
    migrate(component_path, namespace, locales_dir)

def check_corruption(namespace, locales_dir):
    import json as _json
    bad = []
    for lang in ['fr', 'en']:
        path = f"{locales_dir}/{lang}/translation.json"
        with open(path, encoding='utf-8') as f:
            d = _json.load(f)
        ns = d.get(namespace, {})
        for k, v in ns.items():
            if isinstance(v, str) and '{t.' in v:
                bad.append((lang, k, v))
    return bad
