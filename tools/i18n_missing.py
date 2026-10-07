#!/usr/bin/env python3
"""List English strings that have no translation yet in assets/i18n/<lang>.json.

main.js looks a translation up by the English text itself (its textContent with runs of
whitespace collapsed), so after an English sentence changes its old key no longer matches
and that sentence shows in English until the JSON is updated. Run from the repository root:

    python3 tools/i18n_missing.py            # every language
    python3 tools/i18n_missing.py fr de      # just these
"""
import json, os, re, sys
from html.parser import HTMLParser

PAGES = ['index.html', 'works/kagane.html', 'works/yuki.html', 'play/kagane.html', 'news/index.html']
# written by main.js itself (share buttons on the how-to-play page)
EXTRA = ['Hashtags copied:', 'Couldn’t copy. Press and hold the hashtags to copy them.']
VOID = {'br', 'img', 'wbr', 'input', 'meta', 'link', 'hr', 'source'}


def norm(t):
    return re.sub(r'[\s​﻿]+', ' ', t).strip(' ')


class Strings(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.found, self.body = [], [], False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'body':
            self.body = True
        for k in ('data-title-en', 'data-alt-en'):
            if a.get(k):
                self.found.append(norm(a[k]))
        if tag in VOID:
            return
        self.stack.append([tag, self.body and a.get('lang') == 'en', []])

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        while self.stack:
            t, en, buf = self.stack.pop()
            if en and not any(s[1] for s in self.stack):
                self.found.append(norm(''.join(buf)))
            if self.stack:
                self.stack[-1][2].extend(buf)
            if t == tag:
                break

    def handle_data(self, d):
        if self.stack:
            self.stack[-1][2].append(d)


def main():
    keys = []
    for p in PAGES:
        s = Strings()
        s.feed(open(p, encoding='utf-8').read())
        keys += [k for k in s.found if k and k not in keys]
    keys += [k for k in EXTRA if k not in keys]
    langs = sys.argv[1:] or sorted(f[:-5] for f in os.listdir('assets/i18n') if f.endswith('.json'))
    dicts = {lang: json.load(open(f'assets/i18n/{lang}.json', encoding='utf-8')) for lang in langs}
    # untranslated in every language: names, venues and titles kept in English on purpose, or a new string
    nowhere = [k for k in keys if not any(k in d for d in dicts.values())]
    print(f'== untranslated in every language ({len(nowhere)}): kept in English on purpose, or new')
    for k in nowhere:
        print('  ', k[:100])
    for lang, d in dicts.items():
        missing = [k for k in keys if k not in d and k not in nowhere]
        unused = [k for k in d if k not in keys]
        print(f'== {lang}: {len(missing)} missing, {len(unused)} unused (an English sentence that changed or went away)')
        for k in missing:
            print('  missing:', k[:100])
        for k in unused:
            print('  unused: ', k[:100])

if __name__ == '__main__':
    main()
