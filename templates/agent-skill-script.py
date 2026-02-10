#!/usr/bin/env python3
"""
Query generated GraphQL docs JSON for operation-level lookup.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import deque
from typing import Any

BUILTIN_SCALARS = {'String', 'Boolean', 'Int', 'Float', 'ID'}
TYPE_NAME_RE = re.compile(r'[A-Za-z_][A-Za-z0-9_]*')
INCLUDE_EXAMPLES_BY_DEFAULT = __INCLUDE_EXAMPLES_BY_DEFAULT__
SUBCOMMANDS = {'list-operations', 'get-operation'}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
DEFAULT_DOCS_ROOT = SKILL_DIR
FALLBACK_DOCS_ROOT = __FALLBACK_DOCS_ROOT_EXPR__
GLOBAL_OPTIONS_WITH_VALUES = {'--docs-root', '--operations-file', '--types-file'}


def load_json(file_path: str) -> Any:
    with open(file_path, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def flatten_operations(operations_by_type: dict[str, dict[str, dict[str, Any]]]) -> list[dict[str, Any]]:
    operations: list[dict[str, Any]] = []
    for operation_type, entries in operations_by_type.items():
        if not isinstance(entries, dict):
            continue
        for operation_name, operation in entries.items():
            if not isinstance(operation, dict):
                continue
            record = dict(operation)
            record['name'] = record.get('name') or operation_name
            record['operationType'] = record.get('operationType') or operation_type
            operations.append(record)
    operations.sort(key=lambda op: (str(op.get('operationType', '')), str(op.get('name', ''))))
    return operations


def summarize_operation(operation: dict[str, Any]) -> dict[str, Any]:
    directives = operation.get('directives') or {}
    group = (directives.get('docGroup') or {}).get('name') or 'Uncategorized'
    description = (operation.get('description') or '').strip()
    return {
        'name': operation.get('name'),
        'operationType': operation.get('operationType'),
        'description': description,
        'docGroup': group,
        'hasExamples': bool(operation.get('examples')),
    }


def extract_type_names(type_string: str | None) -> set[str]:
    if not type_string:
        return set()
    names = {match.group(0) for match in TYPE_NAME_RE.finditer(type_string)}
    return {name for name in names if name not in BUILTIN_SCALARS}


def extract_type_names_from_ref(type_ref: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(type_ref, dict):
        name = type_ref.get('name')
        if isinstance(name, str) and name not in BUILTIN_SCALARS:
            names.add(name)
        names.update(extract_type_names_from_ref(type_ref.get('ofType')))
    return names


def referenced_type_names(type_def: dict[str, Any]) -> set[str]:
    references: set[str] = set()
    for interface_name in type_def.get('interfaces') or []:
        if isinstance(interface_name, str):
            references.add(interface_name)
        elif isinstance(interface_name, dict):
            if isinstance(interface_name.get('name'), str):
                references.add(interface_name['name'])
            if isinstance(interface_name.get('ref'), str):
                references.add(interface_name['ref'])
    for possible_type in type_def.get('possibleTypes') or []:
        if isinstance(possible_type, str):
            references.add(possible_type)
        elif isinstance(possible_type, dict):
            if isinstance(possible_type.get('name'), str):
                references.add(possible_type['name'])
            if isinstance(possible_type.get('ref'), str):
                references.add(possible_type['ref'])
    for field in type_def.get('fields') or []:
        if not isinstance(field, dict):
            continue
        references.update(extract_type_names(field.get('typeString')))
        references.update(extract_type_names_from_ref(field.get('type')))
        for key in ('args', 'arguments'):
            for arg in field.get(key) or []:
                if isinstance(arg, dict):
                    references.update(extract_type_names(arg.get('typeString')))
                    references.update(extract_type_names_from_ref(arg.get('type')))
    return references


def collect_related_types(operation: dict[str, Any], types_by_name: dict[str, dict[str, Any]], max_depth: int) -> dict[str, dict[str, Any]]:
    seeds: set[str] = set()
    seeds.update(extract_type_names(operation.get('returnTypeString')))
    seeds.update(extract_type_names_from_ref(operation.get('returnType')))
    for key in ('arguments', 'args'):
        for arg in operation.get(key) or []:
            if isinstance(arg, dict):
                seeds.update(extract_type_names(arg.get('typeString')))
                seeds.update(extract_type_names_from_ref(arg.get('type')))
    for referenced_type in operation.get('referencedTypes') or []:
        if isinstance(referenced_type, str):
            seeds.add(referenced_type)
        elif isinstance(referenced_type, dict):
            if isinstance(referenced_type.get('name'), str):
                seeds.add(referenced_type['name'])
            if isinstance(referenced_type.get('ref'), str):
                seeds.add(referenced_type['ref'])

    related: dict[str, dict[str, Any]] = {}
    queue: deque[tuple[str, int]] = deque((name, 0) for name in seeds)

    while queue:
        name, depth = queue.popleft()
        if name in related:
            continue
        type_def = types_by_name.get(name)
        if not isinstance(type_def, dict):
            continue
        related[name] = type_def
        if depth >= max_depth:
            continue
        for ref in referenced_type_names(type_def):
            if ref not in related:
                queue.append((ref, depth + 1))

    return related


def find_operation(operations: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    for operation in operations:
        if operation.get('name') == name:
            return operation
    lowercase = name.lower()
    for operation in operations:
        operation_name = str(operation.get('name') or '')
        if operation_name.lower() == lowercase:
            return operation
    return None


def normalize_global_option_placement(argv: list[str]) -> list[str]:
    command_index = next((idx for idx, token in enumerate(argv) if token in SUBCOMMANDS), None)
    if command_index is None:
        return argv

    before_command = argv[:command_index]
    command = argv[command_index]
    after_command = argv[command_index + 1 :]

    moved_options: list[str] = []
    remaining_args: list[str] = []

    idx = 0
    while idx < len(after_command):
        token = after_command[idx]

        if any(token.startswith(f'{option}=') for option in GLOBAL_OPTIONS_WITH_VALUES):
            moved_options.append(token)
            idx += 1
            continue

        if token in GLOBAL_OPTIONS_WITH_VALUES:
            moved_options.append(token)
            if idx + 1 < len(after_command):
                moved_options.append(after_command[idx + 1])
                idx += 2
                continue
            idx += 1
            continue

        remaining_args.append(token)
        idx += 1

    if not moved_options:
        return argv

    return before_command + moved_options + [command] + remaining_args


def main() -> int:
    parser = argparse.ArgumentParser(description='Inspect generated GraphQL docs JSON for AI skills.')
    parser.add_argument('--docs-root', default=DEFAULT_DOCS_ROOT, help='Directory containing _data/operations.json and _data/types.json')
    parser.add_argument('--operations-file', default=None, help='Override operations JSON path')
    parser.add_argument('--types-file', default=None, help='Override types JSON path')

    subparsers = parser.add_subparsers(dest='command', required=True)
    subparsers.add_parser('list-operations', help='List operation names and descriptions')

    get_operation_parser = subparsers.add_parser('get-operation', help='Fetch full details for one operation')
    get_operation_parser.add_argument('operation_name', help='Operation name to fetch')
    get_operation_parser.add_argument('--max-depth', type=int, default=2, help='Max type traversal depth (default: 2)')
    get_operation_parser.add_argument('--include-examples', action='store_true', default=INCLUDE_EXAMPLES_BY_DEFAULT, help='Include examples in operation payload')
    get_operation_parser.add_argument('--no-include-examples', action='store_false', dest='include_examples', help='Exclude examples in operation payload')

    args = parser.parse_args(normalize_global_option_placement(sys.argv[1:]))

    docs_root = args.docs_root
    if not args.operations_file and not args.types_file:
        local_operations = os.path.join(docs_root, "_data", "operations.json")
        local_types = os.path.join(docs_root, "_data", "types.json")
        if not (os.path.exists(local_operations) and os.path.exists(local_types)):
            fallback_operations = os.path.join(FALLBACK_DOCS_ROOT, "_data", "operations.json")
            fallback_types = os.path.join(FALLBACK_DOCS_ROOT, "_data", "types.json")
            if os.path.exists(fallback_operations) and os.path.exists(fallback_types):
                docs_root = FALLBACK_DOCS_ROOT

    operations_file = args.operations_file or os.path.join(docs_root, "_data", "operations.json")
    types_file = args.types_file or os.path.join(docs_root, "_data", "types.json")

    try:
        operations_by_type = load_json(operations_file)
        types_by_name = load_json(types_file)
    except Exception as error:  # pragma: no cover
        print(json.dumps({'error': str(error), 'operationsFile': operations_file, 'typesFile': types_file}, indent=2), file=sys.stderr)
        return 1

    if not isinstance(operations_by_type, dict):
        print(json.dumps({'error': 'operations.json must be a JSON object keyed by operation type', 'operationsFile': operations_file}, indent=2), file=sys.stderr)
        return 1

    if not isinstance(types_by_name, dict):
        print(json.dumps({'error': 'types.json must be a JSON object keyed by type name', 'typesFile': types_file}, indent=2), file=sys.stderr)
        return 1

    operations = flatten_operations(operations_by_type)

    if args.command == 'list-operations':
        payload = [summarize_operation(operation) for operation in operations]
        print(json.dumps(payload, indent=2))
        return 0

    operation = find_operation(operations, args.operation_name)
    if operation is None:
        print(json.dumps({'error': f'Operation not found: {args.operation_name}'}, indent=2), file=sys.stderr)
        return 1

    operation_payload = dict(operation)
    if not args.include_examples:
        operation_payload.pop('examples', None)

    related_types = collect_related_types(operation_payload, types_by_name, max(args.max_depth, 0))
    payload = {
        'operation': operation_payload,
        'relatedTypes': related_types,
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
