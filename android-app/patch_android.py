# Ajusta o projeto Android gerado pelo Capacitor: permissões, ícones, ecrã inicial, versão e assinatura.
import os, re, glob
from PIL import Image, ImageDraw, ImageFont
A = 'android-app/android/app'
run = int(os.environ.get('RUN_NUMBER', '1'))

# Permissões: microfone (gravação e transcrição) e notificações (alertas de prazos)
mf = f'{A}/src/main/AndroidManifest.xml'
s = open(mf).read()
perms = ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.POST_NOTIFICATIONS']
add = ''.join(f'\n    <uses-permission android:name="{p}" />' for p in perms if p not in s)
s = re.sub(r'(<manifest[^>]*>)', r'\1' + add, s, count=1)
open(mf, 'w').write(s)

# Ícones e ecrã inicial com o logótipo CG VERTEX
fp = next((f for f in glob.glob('/usr/share/fonts/**/*.ttf', recursive=True) if re.search(r'(DejaVuSans|LiberationSans)-Bold\.ttf$', f)), None)
def logo(size, bg=True, scale=1.0):
    im = Image.new('RGBA', (size, size), (20, 33, 61, 255) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(fp, int(size * 0.42 * scale)) if fp else ImageFont.load_default()
    bb = d.textbbox((0, 0), 'CG', font=f); w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((size - w) / 2 - bb[0], (size - h) / 2 - bb[1] - size * 0.05 * scale), 'CG', font=f, fill=(228, 122, 42, 255))
    m = size * (1 - 0.46 * scale) / 2
    d.rectangle([m, size * (0.5 + 0.25 * scale), size - m, size * (0.5 + 0.275 * scale)], fill=(228, 122, 42, 255))
    return im
for dens, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    dpath = f'{A}/src/main/res/mipmap-{dens}'
    os.makedirs(dpath, exist_ok=True)
    logo(px).convert('RGB').save(f'{dpath}/ic_launcher.png')
    logo(px).convert('RGB').save(f'{dpath}/ic_launcher_round.png')
    fg = int(px * 108 / 48)
    big = Image.new('RGBA', (fg, fg), (20, 33, 61, 255)); big.alpha_composite(logo(fg, bg=False, scale=0.62))
    big.save(f'{dpath}/ic_launcher_foreground.png')
bgx = f'{A}/src/main/res/values/ic_launcher_background.xml'
if os.path.exists(bgx):
    open(bgx, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#14213D</color>\n</resources>\n')
for sp in glob.glob(f'{A}/src/main/res/drawable*/splash.png'):
    w, h = Image.open(sp).size
    im = Image.new('RGB', (w, h), (20, 33, 61)); L = logo(int(min(w, h) * 0.45), bg=False)
    im.paste(L, ((w - L.width) // 2, (h - L.height) // 2), L); im.save(sp)

# Versão e assinatura (a mesma chave em todas as versões, para atualizar sem perder dados)
g = f'{A}/build.gradle'
s = open(g).read()
s = re.sub(r'versionCode \d+', f'versionCode {run}', s)
s = re.sub(r'versionName "[^"]*"', f'versionName "1.0.{run}"', s)
if 'signingConfigs' not in s:
    s = s.replace('    buildTypes {', '''    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE"))
            storePassword System.getenv("KEYSTORE_PASS")
            keyAlias "lexvortex"
            keyPassword System.getenv("KEYSTORE_PASS")
        }
    }
    buildTypes {''', 1)
    s = re.sub(r'(release \{\n)(\s*minifyEnabled)', r'\1            signingConfig signingConfigs.release\n\2', s, count=1)
open(g, 'w').write(s)
print('versão', run, '| assinatura:', 'signingConfig signingConfigs.release' in s)
