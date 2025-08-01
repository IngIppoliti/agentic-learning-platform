import os

def print_structure(path, file):
    for root, dirs, files in os.walk(path):
        if ".git" in root:
            continue
        level = root.replace(path, '').count(os.sep)
        indent = ' ' * 4 * level
        file.write(f"{indent}{os.path.basename(root)}/\n")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            file.write(f"{subindent}{f}\n")

with open("struttura.txt", "w", encoding="utf-8") as f:
    print_structure('.', f)