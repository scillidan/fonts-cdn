from fontTools.ttLib import TTFont
import sys


def nr(ttf, nid):
    for r in ttf["name"].names:
        if r.nameID == nid:
            try:
                return r.toUnicode()
            except:
                pass
    return ""


ttf = TTFont(sys.argv[1])
family = nr(ttf, 1) or nr(ttf, 16)
subfamily = nr(ttf, 2) or nr(ttf, 17)
fullname = nr(ttf, 4) or nr(ttf, 6)
os2 = ttf["OS/2"]
w = os2.usWeightClass
WM = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "SemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black",
}
wl = WM.get(w, "")
wi = f"{w} ({wl})" if wl else str(w)
mac = ttf["head"].macStyle
fs = "italic" if mac & 2 else "normal"
print(fullname)
print(family)
print(subfamily)
print(wi)
print(fs)
print(wl)
