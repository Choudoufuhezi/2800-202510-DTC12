import os

html_dir = "."  # Update this if your HTML files are in a subfolder

for filename in os.listdir(html_dir):
    if filename.endswith(".html"):
        path = os.path.join(html_dir, filename)
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()

        modified = False

        # Inject familyIconContainer after </nav> (only after topNav)
        if "familyIconContainer" not in content and 'id="topNav"' in content:
            parts = content.split('</nav>', 1)
            if len(parts) == 2:
                content = parts[0] + '</nav>\n<div id="familyIconContainer"></div>\n' + parts[1]
                modified = True

        # Inject script at the end before </body>
        if "load_family_icon.js" not in content and "</body>" in content:
            content = content.replace("</body>", '<script src="../scripts/load_family_icon.js"></script>\n</body>')
            modified = True

        if modified:
            with open(path, "w", encoding="utf-8") as file:
                file.write(content)

print(" Family icon injected into all HTML files (only where needed).")
