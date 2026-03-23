import os, re

base = r"C:\Users\andre\Downloads\Reconstruct\vedi_ehr_frontend_8\src\app\dashboard"
routes = ['patients','encounters','schedule','sessions','recordings','tasks','settings',
          'telehealth','messages','orders','prescriptions','reports','admin','billing','login']

pattern = re.compile(r"""(?<=['"`])/(""" + '|'.join(routes) + r""")(?=[/'"`)\s])""")

count = 0
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
            new_content = pattern.sub(r'/dashboard/\1', content)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
                count += 1
                print(f"Fixed: {os.path.relpath(path, base)}")

print(f"\nTotal files fixed: {count}")
