import zipfile,plistlib,json
from pathlib import Path
report=[]
for path in sorted(Path('dist/ios').glob('*.ipa')):
    with zipfile.ZipFile(path) as z:
        names=z.namelist()
        info=next(n for n in names if n.count('/')==2 and n.endswith('/Info.plist'))
        base=info.rsplit('/',1)[0]+'/'
        p=plistlib.loads(z.read(info))
        assert base+p['CFBundleExecutable'] in names
        executable=z.read(base+p['CFBundleExecutable'])
        assert executable[:4] in [b'\xcf\xfa\xed\xfe',b'\xca\xfe\xba\xbe'], 'Expected device Mach-O'
        for f in ['core.js','content.js','navigation.js','start.css']: assert base+f in names
        assert not any('embedded.mobileprovision' in n for n in names)
        if 'Safari' in path.name: assert any(n.endswith('.appex/manifest.json') for n in names)
        report.append({'artifact':path.name,'bundle':p['CFBundleIdentifier'],'unsigned':True,'deviceTarget':True,'installTested':False})
assert len(report)==2
Path('evidence/ipa-inspection.json').write_text(json.dumps(report,indent=2))
